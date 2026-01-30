import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";

jest.mock('../../managers/query', () => ({
    queryManager: {
        createTrip: jest.fn(),
        getTripById: jest.fn(),
        getTripsByUserId: jest.fn(),
        deleteTripById: jest.fn(),
        getSegmentsByIds: jest.fn(),
        createSegmentWithId: jest.fn(),
        updateTripWeather: jest.fn(),
        getReportsBySegmentIds: jest.fn(),
        updateTripDistance: jest.fn(),
        getStatsByTripId: jest.fn(),
    }
}));

jest.mock('../../services/index', () => ({
    fetchAndAggregateWeatherData: jest.fn(),
}));

jest.mock('../../utils/cache', () => ({
    incrementTripCount: jest.fn().mockResolvedValue(undefined),
    decrementTripCount: jest.fn().mockResolvedValue(undefined),
    getCachedTripStats: jest.fn().mockResolvedValue(null),
    setCachedTripStats: jest.fn().mockResolvedValue(undefined),
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

jest.mock('../../managers/stats/stats.manager', () => ({
    statsManager: {
        computeStats: jest.fn(),
        computeOverallStats: jest.fn(),
    },
}));

import { TripManager } from "../../managers/trip/trip.manager";
import { queryManager } from "../../managers/query";
import { fetchAndAggregateWeatherData } from "../../services/index";
import logger from "../../utils/logger";
import { incrementTripCount, decrementTripCount, getCachedTripStats, setCachedTripStats } from "../../utils/cache";
import { statsManager } from "../../managers/stats/stats.manager";

describe("Testing TripManager business logic", () => {

    const mockRequest = (method: string = 'GET', url: string = '/api/trips') => ({
        method,
        body: {},
        originalUrl: url,
        params: {},
        query: {},
        headers: {},
        user: undefined,
    }) as unknown as Request;

    const mockResponse = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
    }) as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing createTrip method", () => {

        test("Should create trip successfully", async () => {
            const req = mockRequest('POST', '/api/trips');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "2025-01-15T10:00:00Z",
                finishedAt: "2025-01-15T11:00:00Z",
                tripSegments: [
                    { segmentId: "segment1", polylineCoordinates: [{ lat: 45.4642, lng: 9.1900 }] }
                ],
                title: "Morning Ride"
            };

            const mockTrip = {
                tripId: "trip1",
                userId: "user123",
                createdAt: new Date(),
                startedAt: new Date("2025-01-15T10:00:00Z"),
                finishedAt: new Date("2025-01-15T11:00:00Z"),
                title: "Morning Ride",
                tripSegments: []
            };

            (queryManager.getSegmentsByIds as jest.Mock).mockResolvedValue([]);
            (queryManager.createSegmentWithId as jest.Mock).mockResolvedValue({});
            (queryManager.createTrip as jest.Mock).mockResolvedValue(mockTrip);
            (queryManager.getTripById as jest.Mock).mockResolvedValue({
                ...mockTrip,
                tripSegments: [{ segment: { polylineCoordinates: [] } }]
            });
            (queryManager.updateTripDistance as jest.Mock).mockResolvedValue({});
            (statsManager.computeStats as jest.Mock).mockResolvedValue(undefined);
            (queryManager.getStatsByTripId as jest.Mock).mockResolvedValue({
                statsId: "stat1",
                tripId: "trip1",
                userId: "user123",
                avgSpeed: 20,
                duration: 3600,
                kilometers: 15,
            });
            (setCachedTripStats as jest.Mock).mockResolvedValue(undefined);
            (statsManager.computeOverallStats as jest.Mock).mockResolvedValue(undefined);
            (incrementTripCount as jest.Mock).mockResolvedValue(undefined);
            (fetchAndAggregateWeatherData as jest.Mock).mockResolvedValue({});
            (queryManager.updateTripWeather as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(queryManager.createTrip).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Trip created successfully',
                data: expect.objectContaining({
                    tripId: "trip1",
                    title: "Morning Ride"
                })
            });
        });

        test("Should create missing segments and link them", async () => {
            const req = mockRequest('POST', '/api/trips');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "2025-01-15T10:00:00Z",
                finishedAt: "2025-01-15T11:00:00Z",
                tripSegments: [
                    { segmentId: "segment1", polylineCoordinates: [{ lat: 45.4642, lng: 9.1900 }] },
                    { segmentId: "segment2", polylineCoordinates: [{ lat: 45.4650, lng: 9.1910 }] }
                ],
                title: "Morning Ride"
            };

            (queryManager.getSegmentsByIds as jest.Mock).mockResolvedValue([
                { segmentId: "segment1" }
            ]);
            (queryManager.createSegmentWithId as jest.Mock).mockResolvedValue({});
            (queryManager.createTrip as jest.Mock).mockResolvedValue({
                tripId: "trip1",
                userId: "user123",
                createdAt: new Date(),
                startedAt: new Date("2025-01-15T10:00:00Z"),
                finishedAt: new Date("2025-01-15T11:00:00Z"),
                title: "Morning Ride",
                tripSegments: []
            });
            (queryManager.getTripById as jest.Mock).mockResolvedValue({
                tripId: "trip1",
                origin: req.body.origin,
                destination: req.body.destination,
                tripSegments: [
                    { segment: { polylineCoordinates: req.body.tripSegments[0].polylineCoordinates } },
                    { segment: { polylineCoordinates: req.body.tripSegments[1].polylineCoordinates } }
                ]
            });
            (queryManager.updateTripDistance as jest.Mock).mockResolvedValue({});
            (statsManager.computeStats as jest.Mock).mockResolvedValue(undefined);
            (queryManager.getStatsByTripId as jest.Mock).mockResolvedValue({
                statsId: "stat1",
                tripId: "trip1",
                userId: "user123",
                avgSpeed: 20,
                duration: 3600,
                kilometers: 15,
            });
            (setCachedTripStats as jest.Mock).mockResolvedValue(undefined);
            (statsManager.computeOverallStats as jest.Mock).mockResolvedValue(undefined);
            (incrementTripCount as jest.Mock).mockResolvedValue(undefined);
            (fetchAndAggregateWeatherData as jest.Mock).mockResolvedValue({ averageTemperature: 20 });
            (queryManager.updateTripWeather as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(queryManager.createSegmentWithId).toHaveBeenCalledWith(
                "segment2",
                "OPTIMAL",
                req.body.tripSegments[1].polylineCoordinates
            );
            expect(queryManager.createTrip).toHaveBeenCalledWith(
                "user123",
                req.body.origin,
                req.body.destination,
                expect.any(Date),
                expect.any(Date),
                [
                    { segmentId: "segment1", nextSegmentId: "segment2" },
                    { segmentId: "segment2", nextSegmentId: null }
                ],
                "Morning Ride"
            );
        });

        test("Should log warning when weather enrichment fails", async () => {
            const req = mockRequest('POST', '/api/trips');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "2025-01-15T10:00:00Z",
                finishedAt: "2025-01-15T11:00:00Z",
                tripSegments: [
                    { segmentId: "segment1", polylineCoordinates: [{ lat: 45.4642, lng: 9.1900 }] }
                ]
            };

            (queryManager.getSegmentsByIds as jest.Mock).mockResolvedValue([]);
            (queryManager.createSegmentWithId as jest.Mock).mockResolvedValue({});
            (queryManager.createTrip as jest.Mock).mockResolvedValue({
                tripId: "trip1",
                userId: "user123",
                createdAt: new Date(),
                startedAt: new Date("2025-01-15T10:00:00Z"),
                finishedAt: new Date("2025-01-15T11:00:00Z"),
                title: null,
                tripSegments: []
            });
            (queryManager.getTripById as jest.Mock).mockResolvedValue({
                tripId: "trip1",
                origin: req.body.origin,
                destination: req.body.destination,
                tripSegments: [
                    { segment: { polylineCoordinates: req.body.tripSegments[0].polylineCoordinates } }
                ]
            });
            (queryManager.updateTripDistance as jest.Mock).mockResolvedValue({});
            (statsManager.computeStats as jest.Mock).mockResolvedValue(undefined);
            (queryManager.getStatsByTripId as jest.Mock).mockResolvedValue({
                statsId: "stat1",
                tripId: "trip1",
                userId: "user123",
                avgSpeed: 20,
                duration: 3600,
                kilometers: 15,
            });
            (setCachedTripStats as jest.Mock).mockResolvedValue(undefined);
            (statsManager.computeOverallStats as jest.Mock).mockResolvedValue(undefined);
            (incrementTripCount as jest.Mock).mockResolvedValue(undefined);
            (fetchAndAggregateWeatherData as jest.Mock).mockRejectedValue(new Error("Weather error"));

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(logger.warn).toHaveBeenCalledWith(
                expect.objectContaining({ err: expect.any(Error), tripId: "trip1" }),
                "Trip weather enrichment failed"
            );
        });

        test("Should throw BadRequestError when user not authenticated", async () => {
            const req = mockRequest();
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "2025-01-15T10:00:00Z",
                finishedAt: "2025-01-15T11:00:00Z",
                tripSegments: [{ segmentId: "segment1" }]
            };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "UNAUTHORIZED"
                })
            );
        });

        test("Should throw BadRequestError for missing origin/destination", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                startedAt: "2025-01-15T10:00:00Z",
                finishedAt: "2025-01-15T11:00:00Z",
                tripSegments: [{ segmentId: "segment1" }]
            };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_ORIGIN_DESTINATION"
                })
            );
        });

        test("Should throw BadRequestError for missing dates", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                tripSegments: [{ segmentId: "segment1" }]
            };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_DATES"
                })
            );
        });

        test("Should throw BadRequestError for invalid dates", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "invalid-date",
                finishedAt: "also-invalid",
                tripSegments: [{ segmentId: "segment1" }]
            };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "INVALID_DATES"
                })
            );
        });

        test("Should throw BadRequestError for invalid date range", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "2025-01-15T12:00:00Z",
                finishedAt: "2025-01-15T10:00:00Z",
                tripSegments: [{ segmentId: "segment1" }]
            };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "INVALID_DATE_RANGE"
                })
            );
        });

        test("Should throw BadRequestError for duplicate segment IDs", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "2025-01-15T10:00:00Z",
                finishedAt: "2025-01-15T11:00:00Z",
                tripSegments: [
                    { segmentId: "segment1" },
                    { segmentId: "segment1" }
                ]
            };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "DUPLICATE_SEGMENT_IDS"
                })
            );
        });

        test("Should throw BadRequestError for missing trip segments", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                startedAt: "2025-01-15T10:00:00Z",
                finishedAt: "2025-01-15T11:00:00Z",
                tripSegments: []
            };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().createTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_TRIP_SEGMENTS"
                })
            );
        });

    });

    describe("Testing getTripsByUser method", () => {

        test("Should return all user trips", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockTrips = [
                {
                    tripId: "trip1",
                    userId: "user123",
                    createdAt: new Date(),
                    startedAt: new Date(),
                    finishedAt: new Date(),
                    title: "Trip 1",
                    origin: { lat: 45.4642, lng: 9.1900 },
                    destination: { lat: 45.4700, lng: 9.1950 },
                    statistics: null,
                    weather: { temp: 20 },
                    tripSegments: [
                        { segmentId: "segment1", segment: { polylineCoordinates: [] } }
                    ]
                }
            ];

            (queryManager.getTripsByUserId as jest.Mock).mockResolvedValue(mockTrips);
            (queryManager.getReportsBySegmentIds as jest.Mock).mockResolvedValue([]);
            (getCachedTripStats as jest.Mock).mockResolvedValue({
                statsId: "stat1",
                tripId: "trip1",
                userId: "user123",
                avgSpeed: 20,
                duration: 3600,
                kilometers: 15,
            });

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().getTripsByUser(req, res, next);

            expect(queryManager.getTripsByUserId).toHaveBeenCalledWith("user123");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    count: 1,
                    trips: expect.arrayContaining([
                        expect.objectContaining({ 
                            tripId: "trip1",
                            stats: expect.objectContaining({
                                avgSpeed: 20,
                                duration: 3600,
                                kilometers: 15,
                            })
                        })
                    ])
                })
            });
        });

        test("Should throw BadRequestError when user not authenticated", async () => {
            const req = mockRequest();

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().getTripsByUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "UNAUTHORIZED"
                })
            );
        });

        test("Should enrich trips missing weather data", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockTrips = [
                {
                    tripId: "trip1",
                    userId: "user123",
                    createdAt: new Date(),
                    startedAt: new Date(),
                    finishedAt: new Date(),
                    title: "Trip 1",
                    origin: { lat: 45.4642, lng: 9.1900 },
                    destination: { lat: 45.4700, lng: 9.1950 },
                    statistics: null,
                    weather: null,
                    tripSegments: [
                        {
                            segmentId: "segment1",
                            segment: { polylineCoordinates: [{ lat: 45.4642, lng: 9.1900 }] }
                        }
                    ]
                }
            ];

            const mockWeatherData = {
                averageTemperature: 21,
                averageApparentTemperature: 20,
                averageHumidity: 60,
                averageWindSpeed: 9,
                averagePressure: 1012,
                totalPrecipitation: 0.2,
                dominantWeatherDescription: "Sunny",
                sampleCount: 2,
                fetchedAt: new Date().toISOString(),
            };

            (queryManager.getTripsByUserId as jest.Mock).mockResolvedValue(mockTrips);
            (fetchAndAggregateWeatherData as jest.Mock).mockResolvedValue(mockWeatherData);
            (queryManager.updateTripWeather as jest.Mock).mockResolvedValue({});
            (queryManager.getReportsBySegmentIds as jest.Mock).mockResolvedValue([]);
            (getCachedTripStats as jest.Mock).mockResolvedValue({
                statsId: "stat1",
                tripId: "trip1",
                userId: "user123",
                avgSpeed: 20,
                duration: 3600,
                kilometers: 15,
            });

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().getTripsByUser(req, res, next);

            expect(fetchAndAggregateWeatherData).toHaveBeenCalled();
            expect(queryManager.updateTripWeather).toHaveBeenCalledWith("trip1", mockWeatherData);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    count: 1,
                    trips: [
                        expect.objectContaining({
                            tripId: "trip1",
                            weather: mockWeatherData,
                        })
                    ]
                }
            });
        });

    });

    describe("Testing deleteTrip method", () => {

        test("Should delete trip successfully", async () => {
            const req = mockRequest();
            req.params = { tripId: "trip1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockTrip = {
                tripId: "trip1",
                userId: "user123"
            };

            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);
            (queryManager.deleteTripById as jest.Mock).mockResolvedValue({});
            (decrementTripCount as jest.Mock).mockResolvedValue(undefined);

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().deleteTrip(req, res, next);

            expect(queryManager.deleteTripById).toHaveBeenCalledWith("trip1");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        test("Should throw ForbiddenError when deleting other user's trip", async () => {
            const req = mockRequest();
            req.params = { tripId: "trip1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockTrip = {
                tripId: "trip1",
                userId: "otherUser"
            };

            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().deleteTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "FORBIDDEN"
                })
            );
            expect(queryManager.deleteTripById).not.toHaveBeenCalled();
        });

        test("Should throw NotFoundError when trip does not exist", async () => {
            const req = mockRequest();
            req.params = { tripId: "trip1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };

            (queryManager.getTripById as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().deleteTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "NOT_FOUND"
                })
            );
            expect(queryManager.deleteTripById).not.toHaveBeenCalled();
        });

        test("Should throw BadRequestError when user is not authenticated", async () => {
            const req = mockRequest();
            req.params = { tripId: "trip1" };
            req.user = undefined;

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().deleteTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "UNAUTHORIZED"
                })
            );
        });

        test("Should throw BadRequestError when tripId is missing", async () => {
            const req = mockRequest();
            req.params = {};
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const res = mockResponse();
            const next = jest.fn();

            await new TripManager().deleteTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_TRIP_ID"
                })
            );
        });

    });

});