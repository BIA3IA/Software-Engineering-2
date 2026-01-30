import { Request, Response, NextFunction } from 'express';
import { queryManager } from '../query/index.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import logger from '../../utils/logger';
import { polylineDistanceKm } from '../../utils/geo.js';
import { Coordinates } from '../../types/index.js';
import { getCachedTripCount, getCachedOverallStat, setCachedOverallStat } from '../../utils/cache.js';

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

            const currentTripCount = await getCachedTripCount(
                userId,
                () => queryManager.getTripCountByUserId(userId)
            );

            if (currentTripCount === 0) {
                throw new NotFoundError('No trips found for this user', 'TRIPS_NOT_FOUND');
            }

            let overallStats = await getCachedOverallStat(userId);
            
            if (overallStats && overallStats.lastTripCount === currentTripCount) {
                logger.debug({ userId, tripCount: currentTripCount }, 'Overall stats cache hit (no DB query)');
            } else {
                const dbOverall = await queryManager.getOverallStatsByUserId(userId);
                
                if (dbOverall && dbOverall.lastTripCount === currentTripCount) {
                    overallStats = dbOverall;
                    await setCachedOverallStat(userId, dbOverall);
                    logger.debug({ userId, tripCount: currentTripCount }, 'Overall stats from DB (cached for next time)');
                } else {
                    logger.info({ userId, currentTripCount, dbTripCount: dbOverall?.lastTripCount }, 'Recomputing overall stats');
                    const allTripStats = await queryManager.getAllStatsByUserId(userId);
                    
                    const overallAverages = this.calculateOverallAverages(allTripStats);

                    const [pathsCount, totals] = await Promise.all([
                        queryManager.getPathCountByUserIdInRange(userId),
                        queryManager.getStatTotalsByUserId(userId),
                    ]);

                    const totalKilometers = totals._sum.kilometers ?? 0;
                    const totalTime = totals._sum.duration ?? 0;
                    const longestKilometer = totals._max.kilometers ?? 0;
                    const longestTime = totals._max.duration ?? 0;

                    overallStats = await queryManager.upsertOverallStats(userId, {
                        ...overallAverages,
                        lastTripCount: currentTripCount,
                        pathsCreated: pathsCount,
                        totalKilometers: Number(totalKilometers.toFixed(2)),
                        totalTime: Math.round(totalTime),
                        longestKilometer: Number(longestKilometer.toFixed(2)),
                        longestTime: Math.round(longestTime),
                    });

                    await setCachedOverallStat(userId, overallStats);
                }
            }

            if (!overallStats) {
                throw new NotFoundError('No overall statistics found for this user', 'STATS_NOT_FOUND');
            }

            res.status(200).json({
                success: true,
                data: overallStats,
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
        if (!statsArray.length) {
            return {
                avgSpeed: 0,
                avgDuration: 0,
                avgKilometers: 0,
            };
        }

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

            // Fetch trip details
            const trip = await queryManager.getTripById(tripId);
            if (!trip) {
                logger.warn({ tripId }, 'Trip not found, cannot compute statistics');
                return;
            }

            // Compute metrics
            const computedMetrics = this.computePerTripMetrics(trip);

            // Update computed stats
            await queryManager.createStatRecord({
                tripId: trip.tripId,
                userId: trip.userId,
                ...computedMetrics
            });

            // Caching will be done on the trip manager (create trip flow), should be the same

            logger.info({ tripId, userId: trip.userId }, 'Trip statistics computed and persisted');
        } catch (error) {
            logger.error({ err: error, tripId }, 'Failed to compute trip statistics');
            throw error;
        }
    }

    async computeOverallStats(userId: string): Promise<void> {
        try {
            const currentTripCount = await getCachedTripCount(
                userId,
                () => queryManager.getTripCountByUserId(userId)
            );

            // Fetch all trip stats
            const allTripStats = await queryManager.getAllStatsByUserId(userId);
            
            if (allTripStats.length === 0) {
                logger.warn({ userId }, 'No trip stats found, cannot compute overall stats');
                return;
            }

            // Calculate overall averages
            const overallAverages = this.calculateOverallAverages(allTripStats);

            const [pathsCount, totals] = await Promise.all([
                queryManager.getPathCountByUserIdInRange(userId),
                queryManager.getStatTotalsByUserId(userId),
            ]);

            const totalKilometers = totals._sum.kilometers ?? 0;
            const totalTime = totals._sum.duration ?? 0;
            const longestKilometer = totals._max.kilometers ?? 0;
            const longestTime = totals._max.duration ?? 0;

            const extendedPayload = {
                ...overallAverages,
                lastTripCount: currentTripCount,
                pathsCreated: pathsCount,
                totalKilometers: Number(totalKilometers.toFixed(2)),
                totalTime: Math.round(totalTime),
                longestKilometer: Number(longestKilometer.toFixed(2)),
                longestTime: Math.round(longestTime),
            };

            // Update in DB with full payload
            const updatedOverall = await queryManager.upsertOverallStats(userId, extendedPayload);

            // Cache the updated overall stats
            await setCachedOverallStat(userId, updatedOverall);

            logger.info({ userId, tripCount: currentTripCount }, 'Overall statistics computed and cached');
        } catch (error) {
            logger.error({ err: error, userId }, 'Failed to compute overall statistics');
            throw error;
        }
    }

}

export const statsManager = new StatsManager();
