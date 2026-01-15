import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";

jest.mock('../../managers/query', () => ({
    queryManager: {
        getTripById: jest.fn(),
        updateTripWeather: jest.fn(),
    }
}));

jest.mock('../../services/index', () => ({
    fetchAndAggregateWeatherData: jest.fn(),
}));

import { WeatherManager } from "../../managers/weather/weather.manager";
import { fetchAndAggregateWeatherData } from "../../services/index";
import { queryManager } from "../../managers/query";

describe("Testing WeatherManager business logic", () => {

    const mockRequest = () => ({
        method: 'POST',
        body: {},
        originalUrl: '/api/weather/trips/trip/enrich',
        params: {},
        query: {},
        headers: {},
        user: undefined,
    }) as unknown as Request;

    const mockResponse = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    }) as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing enrichTripWithWeather method", () => {

        test("Should successfully enrich trip with weather data", async () => {
            const mockTrip = {
                tripId: "trip",
                userId: "user",
                createdAt: new Date(),
                startedAt: new Date(),
                finishedAt: new Date(),
                title: null,
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
                            status: "active",
                            polylineCoordinates: [
                                { lat: 45.4645, lng: 9.1880 },
                                { lat: 45.4650, lng: 9.1870 }
                            ],
                            createdAt: new Date()
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

            (fetchAndAggregateWeatherData as jest.Mock).mockResolvedValue(mockWeatherData);
            (queryManager.updateTripWeather as jest.Mock).mockResolvedValue({});

            const weatherManager = new WeatherManager();
            const result = await weatherManager.enrichTripWithWeather(mockTrip);

            expect(fetchAndAggregateWeatherData).toHaveBeenCalledWith([
                mockTrip.origin,
                ...mockTrip.tripSegments[0].segment.polylineCoordinates,
                mockTrip.destination
            ]);
            expect(queryManager.updateTripWeather).toHaveBeenCalledWith("trip", mockWeatherData);
            expect(result).toEqual(mockWeatherData);
        });

        test("Should throw BadRequestError when trip has no coordinates", async () => {
            const mockTrip = {
                tripId: "trip",
                userId: "user",
                createdAt: new Date(),
                startedAt: new Date(),
                finishedAt: new Date(),
                origin: null as any,
                destination: null as any,
                title: null,
                statistics: { speed: 0, maxSpeed: 0, distance: 0, time: 0 },
                weather: null,
                tripSegments: []
            };

            const weatherManager = new WeatherManager();

            await expect(weatherManager.enrichTripWithWeather(mockTrip))
                .rejects
                .toThrow(expect.objectContaining({
                    statusCode: 400,
                    code: "NO_COORDINATES"
                }));
        });
    });

    describe("Testing enrichTrip method", () => {

        test("Should successfully enrich trip and return weather data", async () => {
            const req = mockRequest();
            req.params = { tripId: "trip" };
            req.user = { userId: "user", iat: 0, exp: 0 };

            const mockTrip = {
                tripId: "trip",
                userId: "user",
                createdAt: new Date(),
                startedAt: new Date(),
                finishedAt: new Date(),
                title: null,
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
                            status: "active",
                            polylineCoordinates: [{ lat: 45.4645, lng: 9.1880 }],
                            createdAt: new Date()
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
                sampleCount: 3,
                fetchedAt: new Date().toISOString(),
            };

            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);
            (fetchAndAggregateWeatherData as jest.Mock).mockResolvedValue(mockWeatherData);
            (queryManager.updateTripWeather as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new WeatherManager().enrichTrip(req, res, next);

            expect(queryManager.getTripById).toHaveBeenCalledWith("trip");
            expect(fetchAndAggregateWeatherData).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockWeatherData,
            });
            expect(next).not.toHaveBeenCalled();
        });

    });

    describe("Testing getTripWeather method", () => {
        test("Should successfully return weather data for existing trip", async () => {
            const req = mockRequest();
            req.params = { tripId: "trip" };
            req.user = { userId: "user", iat: 0, exp: 0 };

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
                title: null,
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4654, lng: 9.1859 },
                statistics: { speed: 15, maxSpeed: 20, distance: 5, time: 20 },
                weather: mockWeatherData,
                tripSegments: []
            };

            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);

            const res = mockResponse();
            const next = jest.fn();

            await new WeatherManager().getTripWeather(req, res, next);

            expect(queryManager.getTripById).toHaveBeenCalledWith("trip");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockWeatherData,
            });
            expect(next).not.toHaveBeenCalled();
        });

    });

});
