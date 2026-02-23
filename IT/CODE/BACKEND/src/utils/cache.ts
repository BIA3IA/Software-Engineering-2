import Redis from 'ioredis';
import logger from './logger.js';
import { TRIP_COUNT_TTL, TRIP_STATS_TTL, OVERALL_STATS_TTL } from '../constants/appConfig.js';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
});

redis.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
});

redis.on('connect', () => {
    logger.info('Redis connected');
});


export function getTripCountCacheKey(userId: string): string {
    return `tripCount:${userId}`;
}

export function getTripStatsCacheKey(tripId: string): string {
    return `tripStats:${tripId}`;
}

export function getOverallStatsCacheKey(userId: string, period: string): string {
    return `overallStats:${userId}:${period}`;
}

export async function getCachedTripCount(
    userId: string,
    fetchFromDb: () => Promise<number>
): Promise<number> {

    const key = getTripCountCacheKey(userId);
    const startTime = Date.now();

    try {
        const cached = await redis.get(key);
        const redisTime = Date.now() - startTime;

        if (cached !== null) {
            const parsed = parseInt(cached, 10);

            if (Number.isNaN(parsed)) {
                logger.warn({ userId, cached, redisTime }, 'Trip count cache is not a number, invalidating');
                await redis.del(key).catch(() => {});
            } else {
                logger.debug({ userId, count: parsed, redisTime }, 'Trip count cache hit');
                return parsed;
            }
        }

        const dbStartTime = Date.now();
        logger.debug({ userId, redisTime }, 'Trip count cache miss, fetching from DB');
        const count = await fetchFromDb();
        const dbTime = Date.now() - dbStartTime;

        await redis.setex(key, TRIP_COUNT_TTL, count.toString());
        logger.debug({ userId, count, dbTime, ttl: TRIP_COUNT_TTL }, 'Trip count cached');

        return count;
    } catch (error) {
        const errorTime = Date.now() - startTime;
        logger.warn({ err: error, userId, errorTime }, 'Redis error, falling back to DB');
        return await fetchFromDb();
    }
}

export async function incrementTripCount(userId: string): Promise<void> {
    const key = getTripCountCacheKey(userId);

    try {
        const exists = await redis.exists(key);
        if (exists) {
            await redis.incr(key);
            await redis.expire(key, TRIP_COUNT_TTL);
            logger.debug({ userId }, 'Trip count incremented in cache');
        } else {
            logger.debug({ userId }, 'Trip count not in cache, skip increment)');
        }
        
        // Invalidate overall stats because trip count changed
        await invalidateOverallStats(userId);
    } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to increment trip count cache');
        await redis.del(key).catch(() => {});
    }
}

export async function decrementTripCount(userId: string): Promise<void> {
    const key = getTripCountCacheKey(userId);

    try {
        const exists = await redis.exists(key);
        if (!exists) {
            logger.debug({ userId }, 'Trip count not in cache, skip decrement');
            return;
        }

        const current = await redis.get(key);
        if (!current) return;

        const parsed = parseInt(current, 10);
        if (Number.isNaN(parsed)) {
            logger.warn({ userId, current }, 'Trip count cache is not a number, invalidating');
            await redis.del(key).catch(() => {});
            return;
        }

        if (parsed > 0) {
            await redis.decr(key);
            await redis.expire(key, TRIP_COUNT_TTL);
            logger.debug({ userId, newCount: parsed - 1 }, 'Trip count decremented in cache');
        }
        
        // Invalidate overall stats because trip count changed
        await invalidateOverallStats(userId);
    } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to decrement trip count cache');
        await redis.del(key).catch(() => {});
    }
}

export async function closeRedis(): Promise<void> {
    await redis.quit();
}

// PER-TRIP STATS CACHING

export async function getCachedTripStats(tripId: string): Promise<any | null> {
    const key = getTripStatsCacheKey(tripId);
    
    try {
        const cached = await redis.get(key);
        if (cached) {
        logger.debug({ tripId }, 'Trip stats cache hit');
        return JSON.parse(cached);
    }
        logger.debug({ tripId }, 'Trip stats cache miss');
        return null;
    } catch (error) {
        logger.warn({ err: error, tripId }, 'Redis error fetching trip stats');
        return null;
    }
}

export async function setCachedTripStats(tripId: string, stats: any): Promise<void> {
    const key = getTripStatsCacheKey(tripId);
    
    try {
        await redis.setex(key, TRIP_STATS_TTL, JSON.stringify(stats));
        logger.debug({ tripId, ttl: TRIP_STATS_TTL }, 'Trip stats cached');
    } catch (error) {
        logger.warn({ err: error, tripId }, 'Failed to cache trip stats');
    }
}

// OVERALL STATS CACHING

export async function getCachedOverallStats(userId: string, period: string): Promise<any | null> {
    const key = getOverallStatsCacheKey(userId, period);
    
    try {
        const cached = await redis.get(key);
        if (cached) {
            logger.debug({ userId }, 'Overall stats cache hit');
            return JSON.parse(cached);
        }
        logger.debug({ userId }, 'Overall stats cache miss');
        return null;
    } catch (error) {
        logger.warn({ err: error, userId }, 'Redis error fetching overall stats');
        return null;
    }
}

export async function setCachedOverallStats(userId: string, period: string, stats: any): Promise<void> {
    const key = getOverallStatsCacheKey(userId, period);
    
    try {
        await redis.setex(key, OVERALL_STATS_TTL, JSON.stringify(stats));
        logger.debug({ userId, ttl: OVERALL_STATS_TTL }, 'Overall stats cached');
    } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to cache overall stats');
    }
}

export async function invalidateOverallStatsPeriod(userId: string, period: string): Promise<void> {
    const key = getOverallStatsCacheKey(userId, period);
    
    try {
        await redis.del(key);
        logger.debug({ userId, period }, 'Overall stats cache invalidated');
    } catch (error) {
        logger.warn({ err: error, userId, period }, 'Failed to invalidate overall stats');
    }
}

export async function invalidateOverallStats(userId: string): Promise<void> {
    const periods = ["DAY", "WEEK", "MONTH", "YEAR", "OVERALL"];
    await Promise.all(periods.map((period) => invalidateOverallStatsPeriod(userId, period)));
}
