import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { StatsPeriod } from "@prisma/client";

jest.mock("../../utils/prisma-client", () => ({
    __esModule: true,
    default: {
        stats: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            aggregate: jest.fn(),
        },
        overallStatsPeriod: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            findMany: jest.fn(),
        },
        trip: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        path: {
            count: jest.fn(),
        },
    },
}));

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock("../../utils/cache", () => ({
    getCachedTripCount: jest.fn(),
    getCachedOverallStats: jest.fn(),
    setCachedOverallStats: jest.fn(),
}));

import { app } from "../../server";
import prisma from "../../utils/prisma-client";
import { getCachedTripCount, getCachedOverallStats, setCachedOverallStats } from "../../utils/cache";

describe("Stats Routes Integration Tests", () => {

    const generateValidAccessToken = (userId: string) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    });

    describe("Testing GET /api/v1/stats", () => {

        test("Should return stats for all periods from cache", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockCachedDay = {
                userId: "user123",
                period: StatsPeriod.DAY,
                avgSpeed: 18.5,
                avgDuration: 3200,
                avgKilometers: 14.2,
                totalKilometers: 28.4,
                totalTime: 6400,
                longestKilometer: 15.0,
                longestTime: 3500,
                pathsCreated: 0,
                tripCount: 2,
                updatedAt: new Date(),
            };

            const mockCachedOverall = {
                userId: "user123",
                period: StatsPeriod.OVERALL,
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
                totalKilometers: 76.0,
                totalTime: 18000,
                longestKilometer: 18.5,
                longestTime: 4200,
                pathsCreated: 2,
                tripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            (getCachedOverallStats as jest.Mock)
                .mockResolvedValueOnce(mockCachedDay) // DAY
                .mockResolvedValueOnce(null) // WEEK
                .mockResolvedValueOnce(null) // MONTH
                .mockResolvedValueOnce(null) // YEAR
                .mockResolvedValueOnce(mockCachedOverall); // OVERALL

            (prisma.trip.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.path.count as jest.Mock).mockResolvedValue(0);
            (prisma.overallStatsPeriod.upsert as jest.Mock).mockResolvedValue({});
            (setCachedOverallStats as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("day");
            expect(response.body.data).toHaveProperty("overall");
            expect(response.body.data.overall.tripCount).toBe(5);
        });

        test("Should return empty stats when user has no trips", async () => {
            const accessToken = generateValidAccessToken("user123");

            (getCachedTripCount as jest.Mock).mockResolvedValue(0);

            const response = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.overall.tripCount).toBe(0);
        });

        test("Should return 401 for missing access token", async () => {
            const response = await request(app)
                .get("/api/v1/stats");

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("ACCESS_TOKEN_MISSING");
        });

        test("Should return 403 for invalid access token", async () => {
            const response = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
        });

        test("Should recompute overall stats when trip count changed", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockOldOverall = {
                userId: "user123",
                period: StatsPeriod.OVERALL,
                avgSpeed: 20.0,
                avgDuration: 3500,
                avgKilometers: 15.0,
                totalKilometers: 60.0,
                totalTime: 14000,
                longestKilometer: 17.0,
                longestTime: 3900,
                pathsCreated: 1,
                tripCount: 4,
                updatedAt: new Date(),
            };

            const mockAllStats = [
                { avgSpeed: 20, duration: 3600, kilometers: 15 },
                { avgSpeed: 21, duration: 3700, kilometers: 15.5 },
                { avgSpeed: 20, duration: 3500, kilometers: 15 },
                { avgSpeed: 21, duration: 3600, kilometers: 15.3 },
                { avgSpeed: 20.5, duration: 3650, kilometers: 15.2 },
            ];

            const mockTotals = {
                _sum: { kilometers: 76.0, duration: 18050 },
                _max: { kilometers: 15.5, duration: 3700 },
            };

            const mockNewOverall = {
                userId: "user123",
                period: StatsPeriod.OVERALL,
                avgSpeed: 20.5,
                avgDuration: 3610,
                avgKilometers: 15.2,
                totalKilometers: 76.0,
                totalTime: 18050,
                longestKilometer: 15.5,
                longestTime: 3700,
                pathsCreated: 2,
                tripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            
            (getCachedOverallStats as jest.Mock)
                .mockResolvedValueOnce(null) // DAY
                .mockResolvedValueOnce(null) // WEEK
                .mockResolvedValueOnce(null) // MONTH
                .mockResolvedValueOnce(null) // YEAR
                .mockResolvedValueOnce(mockOldOverall); 

            (prisma.stats.findMany as jest.Mock).mockResolvedValue(mockAllStats);
            (prisma.path.count as jest.Mock).mockResolvedValue(2);
            (prisma.stats.aggregate as jest.Mock).mockResolvedValue(mockTotals);
            (prisma.overallStatsPeriod.upsert as jest.Mock).mockResolvedValue(mockNewOverall);
            (setCachedOverallStats as jest.Mock).mockResolvedValue(undefined);

            (prisma.trip.findMany as jest.Mock).mockResolvedValue([]);
            (getCachedOverallStats as jest.Mock).mockResolvedValueOnce(mockNewOverall); 

            const response = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.overall.tripCount).toBe(5);
        });
    });
});