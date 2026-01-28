import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { fetchAndAggregateWeatherData } from '../../services/index.js';
import { Coordinates, TripSegments, WeatherData } from '../../types/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../errors/index.js';
import logger from '../../utils/logger';
import { sortTripSegmentsByChain } from '../../utils/index.js';

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
                null,
                segments,
                title
            );

            try {
                const tripWithSegments = await queryManager.getTripById(trip.tripId);
                if (tripWithSegments) {
                    tripWithSegments.tripSegments = sortTripSegmentsByChain(tripWithSegments.tripSegments);
                    await this.enrichTripWithWeather(tripWithSegments);
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

            const tripReports = await Promise.all(
                sortedTrips.map(trip => {
                    const segmentIds = trip.tripSegments.map(segment => segment.segmentId);
                    return queryManager.getReportsBySegmentIds(segmentIds);
                })
            );

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
                        statistics: trip.statistics,
                        weather: trip.weather,
                        reports: tripReports[index] ?? [],
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

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    private async enrichTripWithWeather(trip: TripSegments): Promise<WeatherData> {
        const allCoordinates: Coordinates[] = [];

        if (trip.origin) {
            allCoordinates.push(trip.origin);
        }

        trip.tripSegments = sortTripSegmentsByChain(trip.tripSegments);

        for (const tripSegment of trip.tripSegments) {
            const polyline = tripSegment.segment.polylineCoordinates;
            if (Array.isArray(polyline)) {
                allCoordinates.push(...polyline);
            }
        }

        if (trip.destination) {
            allCoordinates.push(trip.destination);
        }

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
