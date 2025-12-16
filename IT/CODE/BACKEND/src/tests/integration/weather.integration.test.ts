import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../utils/prisma-client", () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
        },
        trip: {
            findUnique: jest.fn(),
            update: jest.fn(),
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

jest.mock("../../services/openmeteo.service", () => ({
    fetchAndAggregateWeatherData: jest.fn(),
}));

import { app } from "../../server";
import prisma from "../../utils/prisma-client";
import { fetchAndAggregateWeatherData } from "../../services/index";

describe("Weather Routes Integration Tests", () => {

    const generateValidAccessToken = (userId: string) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    });

    describe("Testing POST /api/v1/weather/trips/:tripId/enrich", () => {

        test("Should enrich trip with weather data successfully", async () => {
            const accessToken = generateValidAccessToken("user");
            const tripId = "trip";

            const mockTrip = {
                tripId: "trip",
                userId: "user",
                createdAt: new Date(),
                startedAt: new Date(),
                finishedAt: new Date(),
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4654, lng: 9.1859 },
                statistics: { speed: 15, maxSpeed: 20, distance: 5, time: 20 },
                weather: null,
                tripSegments: [
                    {
                        segmentId: "seg1",
                        nextSegmentId: null,
                        segment: {
                            segmentId: "seg1",
                            status: "OPTIMAL",
                            polylineCoordinates: [
                                { lat: 45.4645, lng: 9.1880 },
                                { lat: 45.4650, lng: 9.1870 }
                            ]
                        }
                    }
                ]
            };

            const mockWeatherData = {
                averageTemperature: 20.5,
                averageApparentTemperature: 19.8,
                averageHumidity: 65,
                averageWindSpeed: 10.2,
                averagePressure: 1013.2,
                totalPrecipitation: 0.5,
                dominantWeatherDescription: "Partly cloudy",
                sampleCount: 4,
                fetchedAt: new Date().toISOString(),
            };

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
            (fetchAndAggregateWeatherData as jest.Mock).mockResolvedValue(mockWeatherData);
            (prisma.trip.update as jest.Mock).mockResolvedValue({
                ...mockTrip,
                weather: mockWeatherData,
            });

            const response = await request(app)
                .post(`/api/v1/weather/trips/${tripId}/enrich`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockWeatherData);
            expect(prisma.trip.findUnique).toHaveBeenCalledWith({
                where: { tripId: "trip" },
                include: {
                    tripSegments: {
                        include: { 
                            segment: true 
                        },
                    },
                },
            });
            expect(fetchAndAggregateWeatherData).toHaveBeenCalled();
            expect(prisma.trip.update).toHaveBeenCalledWith({
                where: { tripId: "trip" },
                data: { weather: mockWeatherData },
            });
        });

        test("Should return 403 for invalid access token", async () => {
            const response = await request(app)
                .post("/api/v1/weather/trips/trip/enrich")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
        });

        test("Should return 404 for non-existent trip", async () => {
            const accessToken = generateValidAccessToken("user");

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post("/api/v1/weather/trips/nonexistent/enrich")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("TRIP_NOT_FOUND");
        });

        test("Should return 404 when trip belongs to different user", async () => {
            const accessToken = generateValidAccessToken("user2");

            const mockTrip = {
                tripId: "trip",
                userId: "user",
                createdAt: new Date(),
                startedAt: new Date(),
                finishedAt: new Date(),
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4654, lng: 9.1859 },
                statistics: { speed: 15, maxSpeed: 20, distance: 5, time: 20 },
                weather: null,
                tripSegments: []
            };

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

            const response = await request(app)
                .post("/api/v1/weather/trips/trip/enrich")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("TRIP_NOT_FOUND");
        });

    });

    describe("Testing GET /api/v1/weather/trips/:tripId", () => {

        test("Should return weather data for existing trip", async () => {
            const accessToken = generateValidAccessToken("user");

            const mockWeatherData = {
                averageTemperature: 20.5,
                averageApparentTemperature: 19.8,
                averageHumidity: 65,
                averageWindSpeed: 10.2,
                averagePressure: 1013.2,
                totalPrecipitation: 0.5,
                dominantWeatherDescription: "Partly cloudy",
                sampleCount: 3,
                fetchedAt: new Date().toISOString(),
            };

            const mockTrip = {
                tripId: "trip",
                userId: "user",
                createdAt: new Date(),
                startedAt: new Date(),
                finishedAt: new Date(),
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4654, lng: 9.1859 },
                statistics: { speed: 15, maxSpeed: 20, distance: 5, time: 20 },
                weather: mockWeatherData,
                tripSegments: []
            };

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

            const response = await request(app)
                .get("/api/v1/weather/trips/trip")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(mockWeatherData);
        });

        test("Should return 404 when trip has no weather data", async () => {
            const accessToken = generateValidAccessToken("user");

            const mockTrip = {
                tripId: "trip",
                userId: "user",
                createdAt: new Date(),
                startedAt: new Date(),
                finishedAt: new Date(),
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4654, lng: 9.1859 },
                statistics: { speed: 15, maxSpeed: 20, distance: 5, time: 20 },
                weather: null,
                tripSegments: []
            };

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

            const response = await request(app)
                .get("/api/v1/weather/trips/trip")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("WEATHER_NOT_FOUND");
        });

    });
});