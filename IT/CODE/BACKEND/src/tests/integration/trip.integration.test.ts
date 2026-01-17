import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../utils/prisma-client", () => ({
    __esModule: true,
    default: {
        trip: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        segment: {
            findMany: jest.fn(),
            create: jest.fn(),
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

jest.mock("../../managers/weather/index", () => ({
    weatherManager: {
        enrichTripWithWeather: jest.fn().mockResolvedValue({}),
        enrichTrip: jest.fn().mockImplementation((req, res) => res.json({ success: true })),
        getTripWeather: jest.fn().mockImplementation((req, res) => res.json({ success: true })),
    },
}));

import { app } from "../../server";
import prisma from "../../utils/prisma-client";

describe("Trip Routes Integration Tests", () => {

    const generateValidAccessToken = (userId: string) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    });

    describe("Testing POST /api/v1/trips/create", () => {

        test("Should create trip successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockTrip = {
                tripId: "trip1",
                userId: "user123",
                createdAt: new Date(),
                startedAt: new Date("2025-01-15T10:00:00Z"),
                finishedAt: new Date("2025-01-15T11:00:00Z"),
                title: "Morning Ride",
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                statistics: null,
                weather: null,
                tripSegments: [
                    {
                        segmentId: "segment1",
                        nextSegmentId: null,
                        segment: { polylineCoordinates: [] }
                    }
                ]
            };

            (prisma.segment.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.segment.create as jest.Mock).mockResolvedValue({ segmentId: "segment1" });
            (prisma.trip.create as jest.Mock).mockResolvedValue(mockTrip);

            const response = await request(app)
                .post("/api/v1/trips/create")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    origin: { lat: 45.4642, lng: 9.1900 },
                    destination: { lat: 45.4700, lng: 9.1950 },
                    startedAt: "2025-01-15T10:00:00Z",
                    finishedAt: "2025-01-15T11:00:00Z",
                    tripSegments: [
                        {
                            segmentId: "segment1",
                            polylineCoordinates: [
                                { lat: 45.4642, lng: 9.1900 },
                                { lat: 45.4700, lng: 9.1950 }
                            ]
                        }
                    ],
                    title: "Morning Ride"
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("tripId");
            expect(response.body.data.title).toBe("Morning Ride");
        });

        test("Should return 400 for missing required fields", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .post("/api/v1/trips/create")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    origin: { lat: 45.4642, lng: 9.1900 }
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

    });

    describe("Testing GET /api/v1/trips/my-trips", () => {

        test("Should return all user trips with full data", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockTrips = [
                {
                    tripId: "trip1",
                    userId: "user123",
                    createdAt: new Date(),
                    startedAt: new Date("2025-01-15T10:00:00Z"),
                    finishedAt: new Date("2025-01-15T11:00:00Z"),
                    title: "Morning Ride",
                    origin: { lat: 45.4642, lng: 9.1900 },
                    destination: { lat: 45.4700, lng: 9.1950 },
                    statistics: { distance: 5.2, avgSpeed: 20 },
                    weather: { temp: 18, conditions: "sunny" },
                    tripSegments: [
                        {
                            segmentId: "segment1",
                            nextSegmentId: null,
                            segment: {
                                polylineCoordinates: [
                                    { lat: 45.4642, lng: 9.1900 },
                                    { lat: 45.4700, lng: 9.1950 }
                                ]
                            }
                        }
                    ]
                }
            ];

            (prisma.trip.findMany as jest.Mock).mockResolvedValue(mockTrips);

            const response = await request(app)
                .get("/api/v1/trips/my-trips")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(1);
            expect(response.body.data.trips[0]).toHaveProperty("tripId", "trip1");
            expect(response.body.data.trips[0]).toHaveProperty("tripSegments");
            expect(response.body.data.trips[0]).toHaveProperty("weather");
        });

        test("Should return empty array when user has no trips", async () => {
            const accessToken = generateValidAccessToken("user123");

            (prisma.trip.findMany as jest.Mock).mockResolvedValue([]);

            const response = await request(app)
                .get("/api/v1/trips/my-trips")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.count).toBe(0);
            expect(response.body.data.trips).toEqual([]);
        });

    });

    describe("Testing DELETE /api/v1/trips/:tripId", () => {

        test("Should delete trip successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockTrip = {
                tripId: "trip1",
                userId: "user123",
                tripSegments: []
            };

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
            (prisma.trip.delete as jest.Mock).mockResolvedValue({});

            const response = await request(app)
                .delete("/api/v1/trips/trip1")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(204);
        });

        test("Should return 403 when deleting other user's trip", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockTrip = {
                tripId: "trip1",
                userId: "otherUser",
                tripSegments: []
            };

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

            const response = await request(app)
                .delete("/api/v1/trips/trip1")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("FORBIDDEN");
        });

        test("Should return 404 when trip does not exist", async () => {
            const accessToken = generateValidAccessToken("user123");

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete("/api/v1/trips/nonexistent123!")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("NOT_FOUND");
        });

    });

});