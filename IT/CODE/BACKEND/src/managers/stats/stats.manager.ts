import { Request, Response, NextFunction } from 'express';
import { StatsPeriod } from '@prisma/client';
import { queryManager } from '../query/index.js';
import { NotFoundError, BadRequestError } from '../../errors/index.js';
import logger from '../../utils/logger';
import { polylineDistanceKm } from '../../utils/geo.js';
import { Coordinates } from '../../types/index.js';
import { getCachedTripCount, getCachedOverallStats, setCachedOverallStats } from '../../utils/cache.js';

export class StatsManager {
    /**
     * UC22+: View Overall Statistics by period (day/week/month/year/overall)
     */
    async getAllStats(req: Request, res: Response, next: NextFunction) {
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
                const empty = buildEmptyStatsPayload(userId);
                res.status(200).json({
                    success: true,
                    data: empty,
                });
                return;
            }

            const now = new Date();
            const periodWindows: Record<StatsPeriod, { start?: Date; end?: Date }> = {
                [StatsPeriod.DAY]: { start: startOfDay(now), end: now },
                [StatsPeriod.WEEK]: { start: startOfWeek(now), end: now },
                [StatsPeriod.MONTH]: { start: startOfMonth(now), end: now },
                [StatsPeriod.YEAR]: { start: startOfYear(now), end: now },
                [StatsPeriod.OVERALL]: {},
            };

            const byPeriod: Record<string, any> = {};

            for (const period of [
                StatsPeriod.DAY,
                StatsPeriod.WEEK,
                StatsPeriod.MONTH,
                StatsPeriod.YEAR,
                StatsPeriod.OVERALL,
            ]) {
                let stats = await getCachedOverallStats(userId, period);

                if (period === StatsPeriod.OVERALL) {
                    if (!stats || stats.tripCount !== currentTripCount) {
                        await this.computeOverallStats(userId);
                        stats = await getCachedOverallStats(userId, period);
                    }
                } else if (!stats) {
                    const window = periodWindows[period];
                    stats = await this.computePeriodStats(userId, period, window.start, window.end);
                }

                if (stats) {
                    byPeriod[period.toLowerCase()] = stats;
                }
            }

            if (Object.keys(byPeriod).length === 0) {
                throw new NotFoundError('No statistics found for this user', 'STATS_NOT_FOUND');
            }

            res.status(200).json({
                success: true,
                data: byPeriod,
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

        const total = statsArray.reduce((acc, stats) => {
            acc.speed += stats.avgSpeed;
            acc.duration += stats.duration;
            acc.km += stats.kilometers;
            return acc;
        }, { speed: 0, duration: 0, km: 0 });

        const count = statsArray.length;

        return {
            avgSpeed: Number((total.speed / count).toFixed(2)),
            avgDuration: Number((total.duration / count).toFixed(2)),
            avgKilometers: Number((total.km / count).toFixed(2))
        };
    }

    private async computePeriodStats(userId: string, period: StatsPeriod, start?: Date, end?: Date) {
        const [trips, pathsCount] = await Promise.all([
            queryManager.getTripsForStatsByUserId(userId, start, end),
            queryManager.getPathCountByUserIdInRange(userId, start, end),
        ]);

        let totalDistance = 0;
        let totalDuration = 0;
        let longestTrip = 0;

        for (const trip of trips) {
            const stats = trip.tripStats;
            const kilometers = stats?.kilometers ?? trip.distanceKm ?? 0;
            const duration = stats?.duration ?? Math.max(0, (trip.finishedAt.getTime() - trip.startedAt.getTime()) / 1000);

            totalDistance += kilometers;
            totalDuration += duration;
            if (kilometers > longestTrip) {
                longestTrip = kilometers;
            }
        }

        const avgSpeed = totalDuration > 0 ? totalDistance / (totalDuration / 3600) : 0;
        const avgDuration = trips.length > 0 ? totalDuration / trips.length : 0;
        const avgKilometers = trips.length > 0 ? totalDistance / trips.length : 0;

        const updated = await queryManager.upsertOverallStatsPeriod(userId, period, {
            avgSpeed: Number(avgSpeed.toFixed(2)),
            avgDuration: Number(avgDuration.toFixed(2)),
            avgKilometers: Number(avgKilometers.toFixed(2)),
            totalKilometers: Number(totalDistance.toFixed(2)),
            totalTime: Math.round(totalDuration),
            longestKilometer: Number(longestTrip.toFixed(2)),
            longestTime: Math.round(
                trips.reduce((max, trip) => {
                    const duration = Math.max(0, (trip.finishedAt.getTime() - trip.startedAt.getTime()) / 1000);
                    return Math.max(max, duration);
                }, 0)
            ),
            pathsCreated: pathsCount,
            tripCount: trips.length,
        });
        await setCachedOverallStats(userId, period, updated);
        return updated;
    }


    async computeStats(tripId: string): Promise<void> {
        try {
            const existingStats = await queryManager.getStatsByTripId(tripId);
            if (existingStats) {
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
            await queryManager.createStatsRecord({
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
                queryManager.getStatsTotalsByUserId(userId),
            ]);

            const totalKilometers = totals._sum.kilometers ?? 0;
            const totalTime = totals._sum.duration ?? 0;
            const longestKilometer = totals._max.kilometers ?? 0;
            const longestTime = totals._max.duration ?? 0;

            const extendedPayload = {
                ...overallAverages,
                pathsCreated: pathsCount,
                totalKilometers: Number(totalKilometers.toFixed(2)),
                totalTime: Math.round(totalTime),
                longestKilometer: Number(longestKilometer.toFixed(2)),
                longestTime: Math.round(longestTime),
            };

            // Update in DB with full payload
            const updatedOverall = await queryManager.upsertOverallStatsPeriod(userId, StatsPeriod.OVERALL, {
                ...extendedPayload,
                tripCount: currentTripCount,
            });

            // Cache the updated overall stats
            await setCachedOverallStats(userId, StatsPeriod.OVERALL, updatedOverall);

            const now = new Date();
            await Promise.all([
                this.computePeriodStats(userId, StatsPeriod.DAY, startOfDay(now), now),
                this.computePeriodStats(userId, StatsPeriod.WEEK, startOfWeek(now), now),
                this.computePeriodStats(userId, StatsPeriod.MONTH, startOfMonth(now), now),
                this.computePeriodStats(userId, StatsPeriod.YEAR, startOfYear(now), now),
            ]);

            logger.info({ userId, tripCount: currentTripCount }, 'Overall statistics computed and cached');
        } catch (error) {
            logger.error({ err: error, userId }, 'Failed to compute overall statistics');
            throw error;
        }
    }

}

export const statsManager = new StatsManager();

function buildEmptyStatsPayload(userId: string) {
    const now = new Date();
    const make = (period: StatsPeriod) => ({
        id: null,
        userId,
        period,
        avgSpeed: 0,
        avgDuration: 0,
        avgKilometers: 0,
        totalKilometers: 0,
        totalTime: 0,
        longestKilometer: 0,
        longestTime: 0,
        pathsCreated: 0,
        tripCount: 0,
        updatedAt: now,
    });

    return {
        day: make(StatsPeriod.DAY),
        week: make(StatsPeriod.WEEK),
        month: make(StatsPeriod.MONTH),
        year: make(StatsPeriod.YEAR),
        overall: make(StatsPeriod.OVERALL),
    };
}

function startOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function startOfWeek(value: Date) {
    const date = startOfDay(value);
    const day = date.getDay();
    const diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    return date;
}

function startOfMonth(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), 1);
}

function startOfYear(value: Date) {
    return new Date(value.getFullYear(), 0, 1);
}
