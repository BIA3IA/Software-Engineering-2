import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../utils/prisma-client", () => ({
    __esModule: true,
    default: {
        trip: {
            count: jest.fn(),
        },
        stat: {
            findMany: jest.fn(),
        },
        overallStat: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
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
    getCachedOverallStat: jest.fn(),
    setCachedOverallStat: jest.fn(),
}));

import { app } from "../../server";
import prisma from "../../utils/prisma-client";
import { getCachedTripCount, getCachedOverallStat, setCachedOverallStat } from "../../utils/cache";

describe("Stats Routes Integration Tests", () => {

    const generateValidAccessToken = (userId: string) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    });

    describe("Testing GET /api/v1/stats/overall", () => {

        test("Should return overall stats from cache", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockCachedStats = {
                userId: "user123",
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
                lastTripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            (getCachedOverallStat as jest.Mock).mockResolvedValue(mockCachedStats);

            const response = await request(app)
                .get("/api/v1/stats/overall")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("avgSpeed", 20.5);
            expect(response.body.data).toHaveProperty("avgDuration", 3600);
            expect(response.body.data).toHaveProperty("avgKilometers", 15.2);
        });

        test("Should return overall stats from DB when cache miss", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockDbStats = {
                userId: "user123",
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
                lastTripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            (getCachedOverallStat as jest.Mock).mockResolvedValue(null);
            (prisma.overallStat.findUnique as jest.Mock).mockResolvedValue(mockDbStats);
            (setCachedOverallStat as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .get("/api/v1/stats/overall")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("avgSpeed", 20.5);
        });

        test("Should recompute stats when trip count changed", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockOldDbStats = {
                userId: "user123",
                avgSpeed: 20,
                avgDuration: 3500,
                avgKilometers: 15,
                lastTripCount: 4,
                updatedAt: new Date(),
            };

            const mockAllStats = [
                { avgSpeed: 20, duration: 3600, kilometers: 15 },
                { avgSpeed: 21, duration: 3700, kilometers: 15.5 },
                { avgSpeed: 20, duration: 3500, kilometers: 15 },
                { avgSpeed: 21, duration: 3600, kilometers: 15.3 },
                { avgSpeed: 20.5, duration: 3650, kilometers: 15.2 },
            ];

            const mockNewDbStats = {
                userId: "user123",
                avgSpeed: 20.5,
                avgDuration: 3610,
                avgKilometers: 15.2,
                lastTripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            (getCachedOverallStat as jest.Mock).mockResolvedValue(null);
            (prisma.overallStat.findUnique as jest.Mock).mockResolvedValue(mockOldDbStats);
            (prisma.stat.findMany as jest.Mock).mockResolvedValue(mockAllStats);
            (prisma.overallStat.upsert as jest.Mock).mockResolvedValue(mockNewDbStats);
            (setCachedOverallStat as jest.Mock).mockResolvedValue(undefined);

            const response = await request(app)
                .get("/api/v1/stats/overall")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.lastTripCount).toBe(5);
        });

        test("Should return 401 for missing access token", async () => {
            const response = await request(app)
                .get("/api/v1/stats/overall");

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("ACCESS_TOKEN_MISSING");
        });

        test("Should return 404 when user has no trips", async () => {
            const accessToken = generateValidAccessToken("user123");

            (getCachedTripCount as jest.Mock).mockResolvedValue(0);

            const response = await request(app)
                .get("/api/v1/stats/overall")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("TRIPS_NOT_FOUND");
        });

        test("Should return 403 for invalid access token", async () => {
            const response = await request(app)
                .get("/api/v1/stats/overall")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
        });
    });
});