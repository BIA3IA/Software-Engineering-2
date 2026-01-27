import { describe, test, expect } from "@jest/globals";
import { sampleCoordinates, fetchWeatherForCoordinates, aggregateWeatherData, fetchAndAggregateWeatherData } from "../../services/weather.service";
import { Coordinates, PointWeatherData } from "../../types/index";

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

const runLive = process.env.RUN_LIVE_TESTS === "1";
const describeLive = runLive ? describe : describe.skip;

describe("OpenMeteo Service Integration Tests", () => {

    describe("Testing sampleCoordinates function", () => {

        test("Should return single coordinate for single point", () => {
            const coords: Coordinates[] = [{ lat: 45.4642, lng: 9.1900 }];
            const result = sampleCoordinates(coords);
            expect(result).toEqual(coords);
        });

        test("Should sample start and end for short routes (<10km)", () => {
            const coords: Coordinates[] = [
                { lat: 45.4642, lng: 9.1900 },  
                { lat: 45.4700, lng: 9.1950 },  
                { lat: 45.4750, lng: 9.2000 },  
            ];
            const result = sampleCoordinates(coords);
            expect(result.length).toBe(2);
            expect(result[0]).toEqual(coords[0]);
            expect(result[1]).toEqual(coords[2]);
        });

        test("Should sample start, middle, and end for medium routes (10-50km)", () => {
            const coords: Coordinates[] = [
                { lat: 45.4642, lng: 9.1900 },  
                { lat: 45.5000, lng: 9.2000 },
                { lat: 45.5500, lng: 9.2500 },
                { lat: 45.6000, lng: 9.3000 },
                { lat: 45.6500, lng: 9.3500 },  
            ];
            const result = sampleCoordinates(coords);
            expect(result.length).toBe(3);
            expect(result[0]).toEqual(coords[0]);
            expect(result[1]).toEqual(coords[2]); 
            expect(result[2]).toEqual(coords[4]);
        });

        test("Should sample by distance for long routes (>50km)", () => {
            const coords: Coordinates[] = [];
            for (let i = 0; i <= 20; i++) {
                coords.push({
                    lat: 45.4642 + (i * 0.03),
                    lng: 9.1900 + (i * 0.03)
                });
            }
            
            const result = sampleCoordinates(coords);
            
            expect(result.length).toBeGreaterThan(3);
            expect(result.length).toBeLessThanOrEqual(10);
            expect(result[0]).toEqual(coords[0]);
            expect(result[result.length - 1]).toEqual(coords[coords.length - 1]);
        });
    });

    describe("Testing aggregateWeatherData function", () => {

        test("Should correctly average multiple points", () => {
            const points: PointWeatherData[] = [
                {
                    temperature: 20.0,
                    apparentTemperature: 19.0,
                    humidity: 60,
                    windSpeed: 10.0,
                    windDirection: 180,
                    pressure: 1013.0,
                    weatherDescription: "Clear sky",
                    precipitation: 0.0,
                },
                {
                    temperature: 22.0,
                    apparentTemperature: 21.0,
                    humidity: 70,
                    windSpeed: 12.0,
                    windDirection: 190,
                    pressure: 1015.0,
                    weatherDescription: "Clear sky",
                    precipitation: 0.5,
                }
            ];

            const result = aggregateWeatherData(points);

            expect(result.averageTemperature).toBe(21.0);
            expect(result.averageApparentTemperature).toBe(20.0);
            expect(result.averageHumidity).toBe(65);
            expect(result.averageWindSpeed).toBe(11.0);
            expect(result.averagePressure).toBe(1014.0);
            expect(result.totalPrecipitation).toBe(0.5);
            expect(result.sampleCount).toBe(2);
        });

        test("Should find most frequent weather description", () => {
            const points: PointWeatherData[] = [
                {
                    temperature: 20.0,
                    apparentTemperature: 19.0,
                    humidity: 60,
                    windSpeed: 10.0,
                    windDirection: 180,
                    pressure: 1013.0,
                    weatherDescription: "Clear sky",
                    precipitation: 0.0,
                },
                {
                    temperature: 21.0,
                    apparentTemperature: 20.0,
                    humidity: 65,
                    windSpeed: 11.0,
                    windDirection: 185,
                    pressure: 1014.0,
                    weatherDescription: "Partly cloudy",
                    precipitation: 0.0,
                },
                {
                    temperature: 22.0,
                    apparentTemperature: 21.0,
                    humidity: 70,
                    windSpeed: 12.0,
                    windDirection: 190,
                    pressure: 1015.0,
                    weatherDescription: "Clear sky",
                    precipitation: 0.0,
                }
            ];

            const result = aggregateWeatherData(points);

            expect(result.dominantWeatherDescription).toBe("Clear sky");
        });
    });

    describeLive("Testing fetchWeatherForCoordinates function", () => {

        test("Should fetch real weather data from OpenMeteo API", async () => {
            const coord: Coordinates = { lat: 45.4642, lng: 9.1900 };

            const result = await fetchWeatherForCoordinates(coord);

            expect(result).toHaveProperty("temperature");
            expect(result).toHaveProperty("apparentTemperature");
            expect(result).toHaveProperty("humidity");
            expect(result).toHaveProperty("windSpeed");
            expect(result).toHaveProperty("windDirection");
            expect(result).toHaveProperty("pressure");
            expect(result).toHaveProperty("weatherDescription");
            expect(result).toHaveProperty("precipitation");

            expect(typeof result.temperature).toBe("number");
            expect(typeof result.humidity).toBe("number");
            expect(result.humidity).toBeGreaterThanOrEqual(0);
            expect(result.humidity).toBeLessThanOrEqual(100);
            expect(typeof result.weatherDescription).toBe("string");
            expect(result.weatherDescription).not.toBe("Unknown");
        }, 10000);

    });

    describeLive("Testing fetchAndAggregateWeatherData function (end-to-end)", () => {

        test("Should fetch and aggregate weather for a short route", async () => {
            const coords: Coordinates[] = [
                { lat: 45.4642, lng: 9.1900 },
                { lat: 45.4700, lng: 9.1950 },
            ];

            const result = await fetchAndAggregateWeatherData(coords);

            expect(result).toBeDefined();
            expect(result.sampleCount).toBeGreaterThan(0);
            expect(Number.isFinite(result.averageTemperature)).toBe(true);
            expect(result.dominantWeatherDescription).not.toBe("Unknown");
            expect(typeof result.fetchedAt).toBe("string");
            expect(new Date(result.fetchedAt).toString()).not.toBe("Invalid Date");
        }, 15000);

        test("Should handle empty coordinates array", async () => {
            const coords: Coordinates[] = [];

            const result = await fetchAndAggregateWeatherData(coords);

            expect(result.sampleCount).toBe(0);
            expect(result.averageTemperature).toBe(0);
            expect(result.dominantWeatherDescription).toBe("Unknown");
        });

        test("Should fetch and aggregate weather for a medium route", async () => {
            const coords: Coordinates[] = [
                { lat: 45.4642, lng: 9.1900 }, 
                { lat: 45.5000, lng: 9.2000 },
                { lat: 45.5500, lng: 9.2500 },
            ];

            const result = await fetchAndAggregateWeatherData(coords);

            expect(result.sampleCount).toBeGreaterThanOrEqual(2);
            expect(result.sampleCount).toBeLessThanOrEqual(3);
            expect(Number.isFinite(result.averageTemperature)).toBe(true);
            expect(result.averageHumidity).toBeGreaterThanOrEqual(0);
            expect(result.averageHumidity).toBeLessThanOrEqual(100);
        }, 20000);
    });
});
