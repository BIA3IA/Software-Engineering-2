import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { fetchWeatherForCoordinates, fetchAndAggregateWeatherData } from "../../services/weather.service";
import { fetchWithTimeout } from "../../utils/fetch";

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock("../../utils/fetch", () => ({
    fetchWithTimeout: jest.fn(),
}));

const fetchWithTimeoutMock = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>;
const makeResponse = (value: { ok: boolean; status?: number; json: () => Promise<unknown> }) =>
    value as unknown as Response;

describe("Weather Service Unit Tests", () => {
    beforeEach(() => {
        fetchWithTimeoutMock.mockReset();
    });

    test("Should return weather data for coordinates", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: true,
            json: async () => ({
                current: {
                    temperature_2m: 10,
                    apparent_temperature: 9,
                    relative_humidity_2m: 50,
                    wind_speed_10m: 5,
                    wind_direction_10m: 90,
                    pressure_msl: 1010,
                    weather_code: 1,
                    precipitation: 0,
                },
            }),
        }));

        const result = await fetchWeatherForCoordinates({ lat: 45.1, lng: 9.1 });

        expect(result.temperature).toBe(10);
        expect(result.apparentTemperature).toBe(9);
        expect(result.humidity).toBe(50);
        expect(result.weatherDescription).toBe("Mainly clear");
    });

    test("Should throw InternalServerError when API returns non-ok", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: false,
            status: 500,
            json: async () => ({}),
        }));

        await expect(fetchWeatherForCoordinates({ lat: 45.1, lng: 9.1 })).rejects.toMatchObject({
            statusCode: 500,
            code: "WEATHER_FETCH_ERROR",
        });
    });

    test("Should throw InternalServerError on timeout", async () => {
        const timeoutError = new Error("Aborted");
        timeoutError.name = "AbortError";
        fetchWithTimeoutMock.mockRejectedValue(timeoutError);

        await expect(fetchWeatherForCoordinates({ lat: 45.1, lng: 9.1 })).rejects.toMatchObject({
            statusCode: 500,
            code: "WEATHER_TIMEOUT",
        });
    });

    test("Should aggregate weather data for multiple coordinates", async () => {
        fetchWithTimeoutMock
            .mockResolvedValueOnce(makeResponse({
                ok: true,
                json: async () => ({
                    current: {
                        temperature_2m: 10,
                        apparent_temperature: 9,
                        relative_humidity_2m: 40,
                        wind_speed_10m: 5,
                        wind_direction_10m: 90,
                        pressure_msl: 1010,
                        weather_code: 1,
                        precipitation: 0,
                    },
                }),
            }))
            .mockResolvedValueOnce(makeResponse({
                ok: true,
                json: async () => ({
                    current: {
                        temperature_2m: 12,
                        apparent_temperature: 11,
                        relative_humidity_2m: 60,
                        wind_speed_10m: 7,
                        wind_direction_10m: 100,
                        pressure_msl: 1012,
                        weather_code: 2,
                        precipitation: 1,
                    },
                }),
            }));

        const result = await fetchAndAggregateWeatherData([
            { lat: 45.1, lng: 9.1 },
            { lat: 45.2, lng: 9.2 },
        ]);

        expect(result.sampleCount).toBe(2);
        expect(result.averageTemperature).toBe(11);
        expect(result.averageHumidity).toBe(50);
        expect(result.totalPrecipitation).toBe(1);
    });
});
