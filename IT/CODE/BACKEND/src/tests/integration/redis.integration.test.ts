import { describe, test, expect, beforeEach, afterAll } from "@jest/globals";

// Mock ioredis BEFORE importing anything else
const mockRedisInstance = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
};

jest.mock("ioredis", () => {
    return jest.fn(() => mockRedisInstance);
});

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

import {
    getCachedTripCount,
    incrementTripCount,
    decrementTripCount,
    getCachedTripStats,
    setCachedTripStats,
    getCachedOverallStats,
    setCachedOverallStats,
    invalidateOverallStats,
    getTripCountCacheKey,
    getTripStatsCacheKey,
    getOverallStatsCacheKey,
} from "../../utils/cache";

describe("Cache Utilities Integration Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing cache key generators", () => {

        test("Should generate correct trip count cache key", () => {
            const key = getTripCountCacheKey("user123");
            expect(key).toBe("tripCount:user123");
        });

        test("Should generate correct trip stats cache key", () => {
            const key = getTripStatsCacheKey("trip123");
            expect(key).toBe("tripStats:trip123");
        });

        test("Should generate correct overall stats cache key", () => {
            const key = getOverallStatsCacheKey("user123", "WEEK");
            expect(key).toBe("overallStats:user123:WEEK");
        });
    });

    describe("Testing getCachedTripCount", () => {

        test("Should return cached trip count when available", async () => {
            mockRedisInstance.get.mockResolvedValue("5");

            const mockFetch = jest.fn();
            const count = await getCachedTripCount("user123", mockFetch);

            expect(count).toBe(5);
            expect(mockRedisInstance.get).toHaveBeenCalledWith("tripCount:user123");
            expect(mockFetch).not.toHaveBeenCalled();
        });

        test("Should fetch from DB and cache when cache miss", async () => {
            mockRedisInstance.get.mockResolvedValue(null);
            mockRedisInstance.setex.mockResolvedValue("OK");

            const mockFetch = jest.fn().mockResolvedValue(10);
            const count = await getCachedTripCount("user123", mockFetch);

            expect(count).toBe(10);
            expect(mockFetch).toHaveBeenCalled();
            expect(mockRedisInstance.setex).toHaveBeenCalledWith("tripCount:user123", 600, "10");
        });

        test("Should handle invalid cached value", async () => {
            mockRedisInstance.get.mockResolvedValue("invalid");
            mockRedisInstance.del.mockResolvedValue(1);

            const mockFetch = jest.fn().mockResolvedValue(7);
            const count = await getCachedTripCount("user123", mockFetch);

            expect(count).toBe(7);
            expect(mockRedisInstance.del).toHaveBeenCalledWith("tripCount:user123");
        });

        test("Should fallback to DB on Redis error", async () => {
            mockRedisInstance.get.mockRejectedValue(new Error("Redis error"));

            const mockFetch = jest.fn().mockResolvedValue(3);
            const count = await getCachedTripCount("user123", mockFetch);

            expect(count).toBe(3);
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe("Testing incrementTripCount", () => {

        test("Should increment trip count when key exists", async () => {
            mockRedisInstance.exists.mockResolvedValue(1);
            mockRedisInstance.incr.mockResolvedValue(6);
            mockRedisInstance.expire.mockResolvedValue(1);
            mockRedisInstance.del.mockResolvedValue(1);

            await incrementTripCount("user123");

            expect(mockRedisInstance.exists).toHaveBeenCalledWith("tripCount:user123");
            expect(mockRedisInstance.incr).toHaveBeenCalledWith("tripCount:user123");
            expect(mockRedisInstance.expire).toHaveBeenCalledWith("tripCount:user123", 600);
            
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:DAY");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:WEEK");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:MONTH");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:YEAR");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:OVERALL");
        });

        test("Should skip increment when key does not exist", async () => {
            mockRedisInstance.exists.mockResolvedValue(0);
            mockRedisInstance.del.mockResolvedValue(1);

            await incrementTripCount("user123");

            expect(mockRedisInstance.incr).not.toHaveBeenCalled();
            

            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:DAY");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:WEEK");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:MONTH");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:YEAR");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:OVERALL");
        });

        test("Should handle Redis errors gracefully", async () => {
            mockRedisInstance.exists.mockRejectedValue(new Error("Redis error"));
            mockRedisInstance.del.mockResolvedValue(1);

            await incrementTripCount("user123");

            expect(mockRedisInstance.del).toHaveBeenCalledWith("tripCount:user123");
        });
    });

    describe("Testing decrementTripCount", () => {

        test("Should decrement trip count when key exists and value > 0", async () => {
            mockRedisInstance.exists.mockResolvedValue(1);
            mockRedisInstance.get.mockResolvedValue("5");
            mockRedisInstance.decr.mockResolvedValue(4);
            mockRedisInstance.expire.mockResolvedValue(1);
            mockRedisInstance.del.mockResolvedValue(1);

            await decrementTripCount("user123");

            expect(mockRedisInstance.decr).toHaveBeenCalledWith("tripCount:user123");
            expect(mockRedisInstance.expire).toHaveBeenCalledWith("tripCount:user123", 600);
            
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:DAY");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:WEEK");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:MONTH");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:YEAR");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:OVERALL");
        });

        test("Should skip decrement when key does not exist", async () => {
            mockRedisInstance.exists.mockResolvedValue(0);

            await decrementTripCount("user123");

            expect(mockRedisInstance.decr).not.toHaveBeenCalled();
        });

        test("Should handle invalid cached value", async () => {
            mockRedisInstance.exists.mockResolvedValue(1);
            mockRedisInstance.get.mockResolvedValue("invalid");
            mockRedisInstance.del.mockResolvedValue(1);

            await decrementTripCount("user123");

            expect(mockRedisInstance.del).toHaveBeenCalledWith("tripCount:user123");
        });
    });

    describe("Testing trip stats caching", () => {

        test("Should return cached trip stats when available", async () => {
            const mockStat = {
                statsId: "stat1",
                tripId: "trip123",
                avgSpeed: 20.5,
                duration: 3600,
                kilometers: 15.2,
            };

            mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockStat));

            const stat = await getCachedTripStats("trip123");

            expect(stat).toEqual(mockStat);
            expect(mockRedisInstance.get).toHaveBeenCalledWith("tripStats:trip123");
        });

        test("Should return null when cache miss", async () => {
            mockRedisInstance.get.mockResolvedValue(null);

            const stat = await getCachedTripStats("trip123");

            expect(stat).toBeNull();
        });

        test("Should cache trip stats successfully", async () => {
            const mockStat = {
                statsId: "stat1",
                tripId: "trip123",
                avgSpeed: 20.5,
                duration: 3600,
                kilometers: 15.2,
            };

            mockRedisInstance.setex.mockResolvedValue("OK");

            await setCachedTripStats("trip123", mockStat);

            expect(mockRedisInstance.setex).toHaveBeenCalledWith(
                "tripStats:trip123",
                86400,
                JSON.stringify(mockStat)
            );
        });

        test("Should handle Redis errors gracefully", async () => {
            mockRedisInstance.get.mockRejectedValue(new Error("Redis error"));

            const stat = await getCachedTripStats("trip123");

            expect(stat).toBeNull();
        });
    });

    describe("Testing overall stats caching", () => {

        test("Should return cached overall stats when available", async () => {
            const mockStat = {
                userId: "user123",
                period: "WEEK",
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
                totalKilometers: 76.0,
                totalTime: 18000,
                longestKilometer: 18.5,
                longestTime: 4200,
                pathsCreated: 2,
                tripCount: 5,
            };

            mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockStat));

            const stat = await getCachedOverallStats("user123", "WEEK");

            expect(stat).toEqual(mockStat);
            expect(mockRedisInstance.get).toHaveBeenCalledWith("overallStats:user123:WEEK");
        });

        test("Should cache overall stats successfully", async () => {
            const mockStat = {
                userId: "user123",
                period: "WEEK",
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
                totalKilometers: 76.0,
                totalTime: 18000,
                longestKilometer: 18.5,
                longestTime: 4200,
                pathsCreated: 2,
                tripCount: 5,
            };

            mockRedisInstance.setex.mockResolvedValue("OK");

            await setCachedOverallStats("user123", "WEEK", mockStat);

            expect(mockRedisInstance.setex).toHaveBeenCalledWith(
                "overallStats:user123:WEEK",
                600,
                JSON.stringify(mockStat)
            );
        });

        test("Should invalidate overall stats successfully", async () => {
            mockRedisInstance.del.mockResolvedValue(1);

            await invalidateOverallStats("user123");

            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:DAY");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:WEEK");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:MONTH");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:YEAR");
            expect(mockRedisInstance.del).toHaveBeenCalledWith("overallStats:user123:OVERALL");
        });

        test("Should handle Redis errors on invalidation", async () => {
            mockRedisInstance.del.mockRejectedValue(new Error("Redis error"));

            await expect(invalidateOverallStats("user123")).resolves.not.toThrow();
        });
    });
});