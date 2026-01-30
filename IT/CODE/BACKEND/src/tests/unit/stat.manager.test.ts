import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

jest.mock('../../managers/query', () => ({
    queryManager: {
        getTripCountByUserId: jest.fn(),
        getOverallStatsByUserId: jest.fn(),
        getAllStatsByUserId: jest.fn(),
        upsertOverallStats: jest.fn(),
        getStatByTripId: jest.fn(),
        getTripById: jest.fn(),
        createStatRecord: jest.fn(),
    }
}));

jest.mock('../../utils/cache', () => ({
    getCachedTripCount: jest.fn(),
    getCachedOverallStat: jest.fn(),
    setCachedOverallStat: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

import { queryManager } from "../../managers/query";
import { StatsManager } from "../../managers/stat/stat.manager";
import { getCachedTripCount, getCachedOverallStat, setCachedOverallStat } from "../../utils/cache";

describe("Testing StatsManager business logic", () => {

    const mockRequest = () => ({
        method: 'GET',
        params: {},
        query: {},
        user: undefined,
    }) as unknown as Request;

    const mockResponse = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    }) as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing getOverallStats method", () => {

        test("Should return cached overall stats when trip count matches", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockCachedOverall = {
                userId: "user123",
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
                lastTripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            (getCachedOverallStat as jest.Mock).mockResolvedValue(mockCachedOverall);

            const res = mockResponse();
            const next = jest.fn();

            await new StatsManager().getOverallStats(req, res, next);

            expect(getCachedTripCount).toHaveBeenCalledWith("user123", expect.any(Function));
            expect(getCachedOverallStat).toHaveBeenCalledWith("user123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockCachedOverall,
            });
            expect(queryManager.getOverallStatsByUserId).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        test("Should fetch from DB when cache miss", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockDbOverall = {
                userId: "user123",
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
                lastTripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            (getCachedOverallStat as jest.Mock).mockResolvedValue(null);
            (queryManager.getOverallStatsByUserId as jest.Mock).mockResolvedValue(mockDbOverall);
            (setCachedOverallStat as jest.Mock).mockResolvedValue(undefined);

            const res = mockResponse();
            const next = jest.fn();

            await new StatsManager().getOverallStats(req, res, next);

            expect(queryManager.getOverallStatsByUserId).toHaveBeenCalledWith("user123");
            expect(setCachedOverallStat).toHaveBeenCalledWith("user123", mockDbOverall);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockDbOverall,
            });
        });

        test("Should recompute when trip count changed", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockDbOverall = {
                userId: "user123",
                avgSpeed: 20.5,
                avgDuration: 3600,
                avgKilometers: 15.2,
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

            const mockUpdatedOverall = {
                userId: "user123",
                avgSpeed: 20.5,
                avgDuration: 3610,
                avgKilometers: 15.2,
                lastTripCount: 5,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(5);
            (getCachedOverallStat as jest.Mock).mockResolvedValue(null);
            (queryManager.getOverallStatsByUserId as jest.Mock).mockResolvedValue(mockDbOverall);
            (queryManager.getAllStatsByUserId as jest.Mock).mockResolvedValue(mockAllStats);
            (queryManager.upsertOverallStats as jest.Mock).mockResolvedValue(mockUpdatedOverall);
            (setCachedOverallStat as jest.Mock).mockResolvedValue(undefined);

            const res = mockResponse();
            const next = jest.fn();

            await new StatsManager().getOverallStats(req, res, next);

            expect(queryManager.getAllStatsByUserId).toHaveBeenCalledWith("user123");
            expect(queryManager.upsertOverallStats).toHaveBeenCalledWith("user123", {
                avgSpeed: 20.5,
                avgDuration: 3610,
                avgKilometers: 15.2,
                lastTripCount: 5,
            });
            expect(setCachedOverallStat).toHaveBeenCalledWith("user123", mockUpdatedOverall);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("Should return error for unauthenticated user", async () => {
            const req = mockRequest();

            const res = mockResponse();
            const next = jest.fn();

            await new StatsManager().getOverallStats(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "UNAUTHORIZED",
                })
            );
        });

        test("Should return error when no trips found", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };

            (getCachedTripCount as jest.Mock).mockResolvedValue(0);

            const res = mockResponse();
            const next = jest.fn();

            await new StatsManager().getOverallStats(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "TRIPS_NOT_FOUND",
                })
            );
        });
    });

    describe("Testing computeStats method", () => {

        test("Should skip computation if stats already exist", async () => {
            const existingStat = {
                statId: "stat1",
                tripId: "trip1",
                userId: "user123",
                avgSpeed: 20,
                duration: 3600,
                kilometers: 15,
            };

            (queryManager.getStatByTripId as jest.Mock).mockResolvedValue(existingStat);

            await new StatsManager().computeStats("trip1");

            expect(queryManager.getStatByTripId).toHaveBeenCalledWith("trip1");
            expect(queryManager.getTripById).not.toHaveBeenCalled();
            expect(queryManager.createStatRecord).not.toHaveBeenCalled();
        });

        test("Should compute and create stats for a trip", async () => {
            const mockTrip = {
                tripId: "trip1",
                userId: "user123",
                startedAt: new Date("2025-01-15T10:00:00Z"),
                finishedAt: new Date("2025-01-15T11:00:00Z"),
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                distanceKm: 15.5,
                tripSegments: [],
            };

            (queryManager.getStatByTripId as jest.Mock).mockResolvedValue(null);
            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);
            (queryManager.createStatRecord as jest.Mock).mockResolvedValue({});

            await new StatsManager().computeStats("trip1");

            expect(queryManager.getTripById).toHaveBeenCalledWith("trip1");
            expect(queryManager.createStatRecord).toHaveBeenCalledWith({
                tripId: "trip1",
                userId: "user123",
                avgSpeed: expect.any(Number),
                duration: 3600,
                kilometers: 15.5,
            });
        });

        test("Should handle missing trip gracefully", async () => {
            (queryManager.getStatByTripId as jest.Mock).mockResolvedValue(null);
            (queryManager.getTripById as jest.Mock).mockResolvedValue(null);

            await new StatsManager().computeStats("nonexistent");

            expect(queryManager.getTripById).toHaveBeenCalledWith("nonexistent");
            expect(queryManager.createStatRecord).not.toHaveBeenCalled();
        });
    });

    describe("Testing computeOverallStats method", () => {

        test("Should compute overall stats successfully", async () => {
            const mockAllStats = [
                { avgSpeed: 20, duration: 3600, kilometers: 15 },
                { avgSpeed: 22, duration: 3700, kilometers: 16 },
            ];

            const mockUpdatedOverall = {
                userId: "user123",
                avgSpeed: 21,
                avgDuration: 3650,
                avgKilometers: 15.5,
                lastTripCount: 2,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(2);
            (queryManager.getAllStatsByUserId as jest.Mock).mockResolvedValue(mockAllStats);
            (queryManager.upsertOverallStats as jest.Mock).mockResolvedValue(mockUpdatedOverall);
            (setCachedOverallStat as jest.Mock).mockResolvedValue(undefined);

            await new StatsManager().computeOverallStats("user123");

            expect(getCachedTripCount).toHaveBeenCalledWith("user123", expect.any(Function));
            expect(queryManager.getAllStatsByUserId).toHaveBeenCalledWith("user123");
            expect(queryManager.upsertOverallStats).toHaveBeenCalledWith("user123", {
                avgSpeed: 21,
                avgDuration: 3650,
                avgKilometers: 15.5,
                lastTripCount: 2,
            });
            expect(setCachedOverallStat).toHaveBeenCalledWith("user123", mockUpdatedOverall);
        });

        test("Should handle no stats gracefully", async () => {
            (getCachedTripCount as jest.Mock).mockResolvedValue(0);
            (queryManager.getAllStatsByUserId as jest.Mock).mockResolvedValue([]);

            await new StatsManager().computeOverallStats("user123");

            expect(queryManager.upsertOverallStats).not.toHaveBeenCalled();
        });
    });
});