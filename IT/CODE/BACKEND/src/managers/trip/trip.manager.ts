import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { fetchAndAggregateWeatherData } from '../../services/index.js';
import { Coordinates, TripSegments, WeatherData } from '../../types/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import logger from '../../utils/logger';
import { sortTripSegmentsByChain } from '../../utils/index.js';
import { polylineDistanceKm } from '../../utils/geo.js';
import { incrementTripCount, decrementTripCount, getCachedTripStats, setCachedTripStats } from '../../utils/cache.js';
import { statsManager } from '../stats/stats.manager.js';

export class TripManager {

    async createTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const { origin, destination, startedAt, finishedAt, tripSegments, title } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!origin || !destination) {
                throw new BadRequestError('Origin and destination are required', 'MISSING_ORIGIN_DESTINATION');
            }

            if (!startedAt || !finishedAt) {
                throw new BadRequestError('Start and finish dates are required', 'MISSING_DATES');
            }

            const startedDate = new Date(startedAt);
            const finishedDate = new Date(finishedAt);

            if (Number.isNaN(startedDate.getTime()) || Number.isNaN(finishedDate.getTime())) {
                throw new BadRequestError('Invalid dates provided', 'INVALID_DATES');
            }

            if (finishedDate < startedDate) {
                throw new BadRequestError('Finish date must be after start date', 'INVALID_DATE_RANGE');
            }

            if (!tripSegments || !Array.isArray(tripSegments) || tripSegments.length === 0) {
                throw new BadRequestError('Trip segments are required', 'MISSING_TRIP_SEGMENTS');
            }

            const segmentIds = tripSegments.map((segment: { segmentId: string }) => segment.segmentId);
            const uniqueSegmentIds = new Set(segmentIds);

            if (uniqueSegmentIds.size !== segmentIds.length) {
                throw new BadRequestError('Duplicate segment IDs are not allowed', 'DUPLICATE_SEGMENT_IDS');
            }

            const existingSegments = await queryManager.getSegmentsByIds(segmentIds);
            const existingIds = new Set(existingSegments.map(segment => segment.segmentId));

            const missingSegments = tripSegments.filter(
                (segment: { segmentId: string }) => !existingIds.has(segment.segmentId)
            );

            for (const segment of missingSegments) {
                await queryManager.createSegmentWithId(
                    segment.segmentId,
                    'OPTIMAL',
                    segment.polylineCoordinates
                );
            }

            const segments = tripSegments.map(
                (segment: { segmentId: string }, index: number) => ({
                    segmentId: segment.segmentId,
                    nextSegmentId:
                        index < tripSegments.length - 1 ? tripSegments[index + 1].segmentId : null,
                })
            );

            const trip = await queryManager.createTrip(
                userId,
                origin,
                destination,
                startedDate,
                finishedDate,
                segments,
                title
            );
            await incrementTripCount(userId);

            try {
                const tripWithSegments = await queryManager.getTripById(trip.tripId);
                if (tripWithSegments) {
                    tripWithSegments.tripSegments = sortTripSegmentsByChain(tripWithSegments.tripSegments);

                    // Update trip distance based on segments' polylines
                    const allCoordinates = [
                        tripWithSegments.origin,
                        ...tripWithSegments.tripSegments.flatMap(ts => ts.segment.polylineCoordinates),
                        tripWithSegments.destination
                    ].filter(Boolean);

                    const distance = polylineDistanceKm(allCoordinates);
                    await queryManager.updateTripDistance(trip.tripId, distance);

                    // Compute per-trip stats and cache them
                    await statsManager.computeStats(trip.tripId);
                    
                    const stats = await queryManager.getStatsByTripId(trip.tripId);
                    if (stats) {
                        await setCachedTripStats(trip.tripId, stats);
                    }
                    
                    // Compute overall stats (also cache them inside computeOverallStats)
                    await statsManager.computeOverallStats(userId);

                    await this.enrichTripWithWeather(tripWithSegments, allCoordinates);
                }
            } catch (error) {
                logger.warn({ err: error, tripId: trip.tripId }, 'Trip weather enrichment failed');
            }

            res.status(201).json({
                success: true,
                message: 'Trip created successfully',
                data: {
                    tripId: trip.tripId,
                    createdAt: trip.createdAt,
                    startedAt: trip.startedAt,
                    finishedAt: trip.finishedAt,
                    title: trip.title,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async getTripsByUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            const trips = await queryManager.getTripsByUserId(userId);
            const sortedTrips = trips.map(trip => ({
                ...trip,
                tripSegments: sortTripSegmentsByChain(trip.tripSegments),
            }));

            await Promise.allSettled(
                sortedTrips.map(async trip => {
                    if (trip.weather) {
                        return;
                    }
                    try {
                        const weather = await this.enrichTripWithWeather(trip);
                        trip.weather = weather;
                    } catch (error) {
                        logger.warn({ err: error, tripId: trip.tripId }, 'Trip weather enrichment failed');
                    }
                })
            );

            const [tripReports, tripStats] = await Promise.all([
                Promise.all(
                    sortedTrips.map(trip => {
                        const segmentIds = trip.tripSegments.map(segment => segment.segmentId);
                        return queryManager.getReportsBySegmentIds(segmentIds);
                    })
                ),
                Promise.all(
                    sortedTrips.map(async trip => {
                        // Try Redis cache first
                        let stats = await getCachedTripStats(trip.tripId);
                        
                        if (stats) {
                            // Cache hit
                            return stats;
                        }

                        // Cache miss, try DB
                        stats = await queryManager.getStatsByTripId(trip.tripId).catch(() => null);
                        
                        if (stats) {
                            // Found in DB, cache for next time
                            await setCachedTripStats(trip.tripId, stats);
                            return stats;
                        }

                        // Not in DB either, compute on-the-fly                        
                        try {
                            // Compute stats 
                            await statsManager.computeStats(trip.tripId);
                            
                            // Fetch the newly computed stats
                            stats = await queryManager.getStatsByTripId(trip.tripId).catch(() => null);
                            
                            if (stats) {
                                // Cache the newly computed stats
                                await setCachedTripStats(trip.tripId, stats);
                            } else {
                                logger.error({ tripId: trip.tripId }, 'Failed to retrieve stats after computation');
                            }
                        } catch (error) {
                            logger.error({ err: error, tripId: trip.tripId }, 'Failed to compute stats on-the-fly');
                        }
                        
                        return stats;
                    })
                ),
            ]);

            res.json({
                success: true,
                data: {
                    count: sortedTrips.length,
                    trips: sortedTrips.map((trip, index) => ({
                        tripId: trip.tripId,
                        createdAt: trip.createdAt,
                        startedAt: trip.startedAt,
                        finishedAt: trip.finishedAt,
                        title: trip.title,
                        origin: trip.origin,
                        destination: trip.destination,
                        weather: trip.weather,
                        reports: tripReports[index] ?? [],
                        stats: tripStats[index] ?? null,
                        segmentCount: trip.tripSegments.length,
                        tripSegments: trip.tripSegments.map(ts => ({
                            segmentId: ts.segmentId,
                            polylineCoordinates: ts.segment?.polylineCoordinates ?? [],
                        })),
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            if (!tripId) {
                throw new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID');
            }

            const trip = await queryManager.getTripById(tripId);

            if (!trip) {
                throw new NotFoundError('Trip not found', 'NOT_FOUND');
            }

            if (trip.userId !== userId) {
                throw new ForbiddenError('You do not have permission to delete this trip', 'FORBIDDEN');
            }

            await queryManager.deleteTripById(tripId);
            await decrementTripCount(userId);

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    private async enrichTripWithWeather(trip: TripSegments, coordinates?: Coordinates[]): Promise<WeatherData> {
        const allCoordinates = coordinates || [
            trip.origin,
            ...trip.tripSegments.flatMap(ts => ts.segment.polylineCoordinates),
            trip.destination
        ].filter(Boolean) as Coordinates[];

        if (allCoordinates.length === 0) {
            throw new BadRequestError('Trip has no coordinates', 'NO_COORDINATES');
        }

        const tripWeather = await fetchAndAggregateWeatherData(allCoordinates);
        await queryManager.updateTripWeather(trip.tripId, tripWeather);
        return tripWeather;
    }

    async enrichTrip(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;
            const userId = req.user?.userId;

            if (!tripId) {
                return next(new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID'));
            }

            const trip = await queryManager.getTripById(tripId);

            if (!trip) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            if (trip.userId !== userId) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            const tripWeather = await this.enrichTripWithWeather(trip);

            res.json({
                success: true,
                data: tripWeather,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTripWeather(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;
            const userId = req.user?.userId;

            if (!tripId) {
                return next(new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID'));
            }

            const trip = await queryManager.getTripById(tripId);

            if (!trip) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            if (trip.userId !== userId) {
                return next(new NotFoundError('Trip not found', 'TRIP_NOT_FOUND'));
            }

            if (!trip.weather) {
                return next(new NotFoundError('Weather data not available for this trip', 'WEATHER_NOT_FOUND'));
            }

            res.json({
                success: true,
                data: trip.weather,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const tripManager = new TripManager();
