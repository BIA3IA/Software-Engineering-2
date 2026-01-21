import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { geocodeAddress } from "../../services/geocoding.service";
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

describe("Geocoding Service Unit Tests", () => {
    beforeEach(() => {
        fetchWithTimeoutMock.mockReset();
    });

    test("Should return coordinates when geocoding succeeds", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: true,
            json: async () => [{ lat: "45.1", lon: "9.1" }],
        }));

        const result = await geocodeAddress("Piazza Duomo");

        expect(result).toEqual({ lat: 45.1, lng: 9.1 });
        expect(fetchWithTimeoutMock).toHaveBeenCalledTimes(1);
    });

    test("Should throw BadRequestError when address is not found", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: true,
            json: async () => [],
        }));

        await expect(geocodeAddress("unknown place")).rejects.toMatchObject({
            statusCode: 400,
            code: "GEOCODE_NOT_FOUND",
        });
    });

    test("Should throw InternalServerError when API returns non-ok", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: false,
            status: 500,
            json: async () => ({}),
        }));

        await expect(geocodeAddress("Piazza Duomo")).rejects.toMatchObject({
            statusCode: 500,
            code: "GEOCODE_ERROR",
        });
    });

    test("Should throw InternalServerError on timeout", async () => {
        const timeoutError = new Error("Aborted");
        timeoutError.name = "AbortError";
        fetchWithTimeoutMock.mockRejectedValue(timeoutError);

        await expect(geocodeAddress("Piazza Duomo")).rejects.toMatchObject({
            statusCode: 500,
            code: "GEOCODE_TIMEOUT",
        });
    });
});
