import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import logger from '../../utils/logger';
import { polylineDistanceKm } from '../../utils/geo.js';
import { Coordinates } from '../../types/index.js';
import { getCachedTripCount } from '../../utils/cache.js';

export class StatsManager {
    /**
     * UC22: View Overall Statistics
     * State-aware recomputation: Only triggers full aggregation if trip count has changed.
     */
    async getOverallStats(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new BadRequestError('User is not authenticated', 'UNAUTHORIZED');
            }

            // 1. Get current trip count and existing overall stats

            const currentTripCount = await getCachedTripCount(
                userId,
                () => queryManager.getTripCountByUserId(userId)
            );

            if (currentTripCount === 0) {
                throw new NotFoundError('No trips found for this user', 'TRIPS_NOT_FOUND');
            }

            const cachedOverall = await queryManager.getOverallStatsByUserId(userId);

            // 2. State-aware check: If trip count hasn't changed, return cached data
            if (cachedOverall && cachedOverall.lastTripCount === currentTripCount) {
                return res.status(200).json({
                    success: true,
                    data: cachedOverall
                });
            }

            // 3. Recompute: Fetch all per-trip 'Stat' records to calculate averages
            logger.info({ userId }, 'Recomputing overall averages due to trip count change');
            const allTripStats = await queryManager.getAllStatsByUserId(userId);
            
            const overallAverages = this.calculateOverallAverages(allTripStats);

            // 4. Persist updated overall stats through queryManager
            const updatedOverall = await queryManager.upsertOverallStats(userId, {
                ...overallAverages,
                lastTripCount: currentTripCount
            });

            res.status(200).json({
                success: true,
                data: updatedOverall
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * UC20/UC16: Get or Compute Individual Trip Stats (Per-Trip)
     * Lazy initialization: Returns existing record or computes/persists it for the first time.
     */
    async getTripStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { tripId } = req.params;

            if (!tripId) {
                throw new BadRequestError('Trip ID is required', 'MISSING_TRIP_ID');
            }

            // 1. Check if processed record already exists in 'Stat' model
            const existingStat = await queryManager.getStatByTripId(tripId);
            if (existingStat) {
                return res.status(200).json({
                    success: true,
                    data: existingStat
                });
            }

            // 2. Fetch trip data for computation
            const trip = await queryManager.getTripById(tripId);
            if (!trip) {
                throw new NotFoundError('Trip not found', 'NOT_FOUND');
            }

            // 3. Compute metrics
            const computedMetrics = this.computePerTripMetrics(trip);

            // 4. Persist per-trip stat record
            const newStat = await queryManager.createStatRecord({
                tripId: trip.tripId,
                userId: trip.userId,
                ...computedMetrics
            });

            res.status(200).json({
                success: true,
                data: newStat
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Internal Logic: Computes metrics for a single trip
     */
    private computePerTripMetrics(trip: any) {
        const start = new Date(trip.startedAt).getTime();
        const end = new Date(trip.finishedAt).getTime();
        const durationSeconds = Math.max(0, (end - start) / 1000);

        let kilometers = trip.distanceKm;

        if (kilometers == null) {
            // Calculate distance from trip segments if not directly available
            const allCoordinates: Coordinates[] = [
                trip.origin,
                ...(trip.tripSegments?.flatMap((ts: any) => ts.segment?.polylineCoordinates) || []),
                trip.destination
            ].filter(Boolean) as Coordinates[];
            
            kilometers = polylineDistanceKm(allCoordinates);
        }

        const avgSpeed = durationSeconds > 0 ? (kilometers / (durationSeconds / 3600)) : 0;

        return {
            avgSpeed: Number(avgSpeed.toFixed(2)),
            duration: durationSeconds,
            kilometers: Number(kilometers.toFixed(2))
        };
    }

    /**
     * Internal Logic: Computes averages of averages across all trips
     */
    private calculateOverallAverages(statsArray: any[]) {
        const total = statsArray.reduce((acc, stat) => {
            acc.speed += stat.avgSpeed;
            acc.duration += stat.duration;
            acc.km += stat.kilometers;
            return acc;
        }, { speed: 0, duration: 0, km: 0 });

        const count = statsArray.length;

        return {
            avgSpeed: Number((total.speed / count).toFixed(2)),
            avgDuration: Number((total.duration / count).toFixed(2)),
            avgKilometers: Number((total.km / count).toFixed(2))
        };
    }

    async computeStats(tripId: string): Promise<void> {
        try {
            const existingStat = await queryManager.getStatByTripId(tripId);
            if (existingStat) {
                logger.info({ tripId }, 'Statistics already exist for this trip');
                return;
            }

            const trip = await queryManager.getTripById(tripId);
            if (!trip) {
                logger.warn({ tripId }, 'Trip not found, cannot compute statistics');
                return;
            }

            const computedMetrics = this.computePerTripMetrics(trip);

            await queryManager.createStatRecord({
                tripId: trip.tripId,
                userId: trip.userId,
                ...computedMetrics
            });

            logger.info({ tripId, userId: trip.userId }, 'Trip statistics computed and persisted');
        } catch (error) {
            logger.error({ err: error, tripId }, 'Failed to compute trip statistics');
            throw error;
        }
    }

}

export const statsManager = new StatsManager();