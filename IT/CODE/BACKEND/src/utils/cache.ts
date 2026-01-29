import Redis from 'ioredis';
import logger from './logger.js';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
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

const TRIP_COUNT_TTL = 600; // 10 minutes
const TRIP_STAT_TTL = 86400; // 24 hours (?)
const OVERALL_STAT_TTL = 600; // 10 minutes

export function getTripCountCacheKey(userId: string): string {
    return `tripCount:${userId}`;
}

export function getTripStatCacheKey(tripId: string): string {
    return `tripStat:${tripId}`;
}

export function getOverallStatCacheKey(userId: string): string {
    return `overallStat:${userId}`;
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
        await invalidateOverallStat(userId);
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
        await invalidateOverallStat(userId);
    } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to decrement trip count cache');
        await redis.del(key).catch(() => {});
    }
}

export async function closeRedis(): Promise<void> {
    await redis.quit();
}

// PER-TRIP STATS CACHING

export async function getCachedTripStat(tripId: string): Promise<any | null> {
    const key = getTripStatCacheKey(tripId);
    
    try {
        const cached = await redis.get(key);
        if (cached) {
            logger.debug({ tripId }, 'Trip stat cache hit');
            return JSON.parse(cached);
        }
        logger.debug({ tripId }, 'Trip stat cache miss');
        return null;
    } catch (error) {
        logger.warn({ err: error, tripId }, 'Redis error fetching trip stat');
        return null;
    }
}

export async function setCachedTripStat(tripId: string, stat: any): Promise<void> {
    const key = getTripStatCacheKey(tripId);
    
    try {
        await redis.setex(key, TRIP_STAT_TTL, JSON.stringify(stat));
        logger.debug({ tripId, ttl: TRIP_STAT_TTL }, 'Trip stat cached');
    } catch (error) {
        logger.warn({ err: error, tripId }, 'Failed to cache trip stat');
    }
}

// OVERALL STATS CACHING

export async function getCachedOverallStat(userId: string): Promise<any | null> {
    const key = getOverallStatCacheKey(userId);
    
    try {
        const cached = await redis.get(key);
        if (cached) {
            logger.debug({ userId }, 'Overall stat cache hit');
            return JSON.parse(cached);
        }
        logger.debug({ userId }, 'Overall stat cache miss');
        return null;
    } catch (error) {
        logger.warn({ err: error, userId }, 'Redis error fetching overall stat');
        return null;
    }
}

export async function setCachedOverallStat(userId: string, stat: any): Promise<void> {
    const key = getOverallStatCacheKey(userId);
    
    try {
        await redis.setex(key, OVERALL_STAT_TTL, JSON.stringify(stat));
        logger.debug({ userId, ttl: OVERALL_STAT_TTL }, 'Overall stat cached');
    } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to cache overall stat');
    }
}

export async function invalidateOverallStat(userId: string): Promise<void> {
    const key = getOverallStatCacheKey(userId);
    
    try {
        await redis.del(key);
        logger.debug({ userId }, 'Overall stat cache invalidated');
    } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to invalidate overall stat');
    }
}