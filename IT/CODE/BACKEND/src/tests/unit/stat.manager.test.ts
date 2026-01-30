import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { StatsPeriod } from "@prisma/client";

jest.mock('../../managers/query', () => ({
    queryManager: {
        getTripCountByUserId: jest.fn(),
        getAllStatsByUserId: jest.fn(),
        upsertOverallStatsPeriod: jest.fn(),
        getStatsByTripId: jest.fn(),
        getTripById: jest.fn(),
        createStatsRecord: jest.fn(),
        getPathCountByUserIdInRange: jest.fn(),
        getStatsTotalsByUserId: jest.fn(),
        getTripsForStatsByUserId: jest.fn(),
    }
}));

jest.mock('../../utils/cache', () => ({
    getCachedTripCount: jest.fn(),
    getCachedOverallStats: jest.fn(),
    setCachedOverallStats: jest.fn(),
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
import { StatsManager } from "../../managers/stats/stats.manager";
import { getCachedTripCount, getCachedOverallStats, setCachedOverallStats } from "../../utils/cache";

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

    describe("Testing computeStats method", () => {

        test("Should skip computation if stats already exist", async () => {
            const existingStat = {
                statsId: "stat1",
                tripId: "trip1",
                userId: "user123",
                avgSpeed: 20,
                duration: 3600,
                kilometers: 15,
            };

            (queryManager.getStatsByTripId as jest.Mock).mockResolvedValue(existingStat);

            await new StatsManager().computeStats("trip1");

            expect(queryManager.getStatsByTripId).toHaveBeenCalledWith("trip1");
            expect(queryManager.getTripById).not.toHaveBeenCalled();
            expect(queryManager.createStatsRecord).not.toHaveBeenCalled();
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

            (queryManager.getStatsByTripId as jest.Mock).mockResolvedValue(null);
            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);
            (queryManager.createStatsRecord as jest.Mock).mockResolvedValue({});

            await new StatsManager().computeStats("trip1");

            expect(queryManager.getTripById).toHaveBeenCalledWith("trip1");
            expect(queryManager.createStatsRecord).toHaveBeenCalledWith({
                tripId: "trip1",
                userId: "user123",
                avgSpeed: expect.any(Number),
                duration: 3600,
                kilometers: 15.5,
            });
        });

        test("Should handle missing trip gracefully", async () => {
            (queryManager.getStatsByTripId as jest.Mock).mockResolvedValue(null);
            (queryManager.getTripById as jest.Mock).mockResolvedValue(null);

            await new StatsManager().computeStats("nonexistent");

            expect(queryManager.getTripById).toHaveBeenCalledWith("nonexistent");
            expect(queryManager.createStatsRecord).not.toHaveBeenCalled();
        });
    });

    describe("Testing computeOverallStats method", () => {

        test("Should compute overall stats successfully", async () => {
            const mockTrips = [
                {
                    tripId: "trip1",
                    startedAt: new Date("2025-01-15T10:00:00Z"),
                    finishedAt: new Date("2025-01-15T11:00:00Z"),
                    distanceKm: 15,
                    tripStats: { avgSpeed: 20, duration: 3600, kilometers: 15 }
                },
                {
                    tripId: "trip2",
                    startedAt: new Date("2025-01-16T10:00:00Z"),
                    finishedAt: new Date("2025-01-16T11:01:40Z"),
                    distanceKm: 16,
                    tripStats: { avgSpeed: 22, duration: 3700, kilometers: 16 }
                },
            ];

            const mockAllStats = [
                { avgSpeed: 20, duration: 3600, kilometers: 15 },
                { avgSpeed: 22, duration: 3700, kilometers: 16 },
            ];

            const mockTotals = {
                _sum: { kilometers: 31, duration: 7300 },
                _max: { kilometers: 16, duration: 3700 },
            };

            const mockUpdatedOverall = {
                userId: "user123",
                period: StatsPeriod.OVERALL,
                avgSpeed: 21,
                avgDuration: 3650,
                avgKilometers: 15.5,
                totalKilometers: 31,
                totalTime: 7300,
                longestKilometer: 16,
                longestTime: 3700,
                pathsCreated: 0,
                tripCount: 2,
                updatedAt: new Date(),
            };

            (getCachedTripCount as jest.Mock).mockResolvedValue(2);
            (queryManager.getTripsForStatsByUserId as jest.Mock).mockResolvedValue(mockTrips);
            (queryManager.getAllStatsByUserId as jest.Mock).mockResolvedValue(mockAllStats);
            (queryManager.getPathCountByUserIdInRange as jest.Mock).mockResolvedValue(0);
            (queryManager.getStatsTotalsByUserId as jest.Mock).mockResolvedValue(mockTotals);
            (queryManager.upsertOverallStatsPeriod as jest.Mock).mockResolvedValue(mockUpdatedOverall);
            (setCachedOverallStats as jest.Mock).mockResolvedValue(undefined);

            await new StatsManager().computeOverallStats("user123");

            expect(getCachedTripCount).toHaveBeenCalledWith("user123", expect.any(Function));
            expect(queryManager.getAllStatsByUserId).toHaveBeenCalledWith("user123");
            expect(queryManager.upsertOverallStatsPeriod).toHaveBeenCalledWith(
                "user123", 
                StatsPeriod.OVERALL,
                expect.objectContaining({
                    tripCount: 2,
                })
            );
            expect(setCachedOverallStats).toHaveBeenCalledWith("user123", StatsPeriod.OVERALL, mockUpdatedOverall);
        });

        test("Should handle no stats gracefully", async () => {
            (getCachedTripCount as jest.Mock).mockResolvedValue(0);
            (queryManager.getAllStatsByUserId as jest.Mock).mockResolvedValue([]);

            await new StatsManager().computeOverallStats("user123");

            expect(queryManager.upsertOverallStatsPeriod).not.toHaveBeenCalled();
        });
    });
});