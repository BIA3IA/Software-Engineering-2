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

export function getTripCountCacheKey(userId: string): string {
    return `tripCount:${userId}`;
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
    } catch (error) {
        logger.warn({ err: error, userId }, 'Failed to decrement trip count cache');
        await redis.del(key).catch(() => {});
    }
}

export async function closeRedis(): Promise<void> {
    await redis.quit();
}