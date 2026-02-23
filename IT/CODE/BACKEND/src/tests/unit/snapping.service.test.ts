import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { snapToRoad } from "../../services/snapping.service";
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

describe("Snapping Service Unit Tests", () => {
    beforeEach(() => {
        fetchWithTimeoutMock.mockReset();
    });

    test("Should return snapped coordinates when OSRM succeeds", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: true,
            json: async () => ({
                code: "Ok",
                routes: [
                    {
                        geometry: {
                            coordinates: [
                                [9.1, 45.1],
                                [9.2, 45.2],
                            ],
                        },
                    },
                ],
            }),
        }));

        const result = await snapToRoad([
            { lat: 45.1, lng: 9.1 },
            { lat: 45.2, lng: 9.2 },
        ]);

        expect(result).toEqual([
            { lat: 45.1, lng: 9.1 },
            { lat: 45.2, lng: 9.2 },
        ]);
    });

    test("Should throw BadRequestError when fewer than 2 coordinates provided", async () => {
        await expect(snapToRoad([{ lat: 45.1, lng: 9.1 }])).rejects.toMatchObject({
            statusCode: 400,
            code: "MISSING_COORDINATES",
        });
    });

    test("Should throw InternalServerError when OSRM returns non-ok", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: false,
            status: 500,
            json: async () => ({}),
        }));

        await expect(
            snapToRoad([
                { lat: 45.1, lng: 9.1 },
                { lat: 45.2, lng: 9.2 },
            ])
        ).rejects.toMatchObject({
            statusCode: 500,
            code: "OSRM_ERROR",
        });
    });

    test("Should throw InternalServerError when OSRM returns non-Ok code", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: true,
            json: async () => ({
                code: "InvalidQuery",
            }),
        }));

        await expect(
            snapToRoad([
                { lat: 45.1, lng: 9.1 },
                { lat: 45.2, lng: 9.2 },
            ])
        ).rejects.toMatchObject({
            statusCode: 500,
            code: "OSRM_RESPONSE_ERROR",
        });
    });

    test("Should throw BadRequestError when OSRM returns empty route", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: true,
            json: async () => ({
                code: "Ok",
                routes: [
                    {
                        geometry: {
                            coordinates: [],
                        },
                    },
                ],
            }),
        }));

        await expect(
            snapToRoad([
                { lat: 45.1, lng: 9.1 },
                { lat: 45.2, lng: 9.2 },
            ])
        ).rejects.toMatchObject({
            statusCode: 400,
            code: "NO_ROUTE",
        });
    });

    test("Should throw BadRequestError when snapped route is too far from requested endpoints", async () => {
        fetchWithTimeoutMock.mockResolvedValue(makeResponse({
            ok: true,
            json: async () => ({
                code: "Ok",
                routes: [
                    {
                        geometry: {
                            coordinates: [
                                [10.1, 46.1],
                                [10.2, 46.2],
                            ],
                        },
                    },
                ],
            }),
        }));

        await expect(
            snapToRoad([
                { lat: 45.1, lng: 9.1 },
                { lat: 45.2, lng: 9.2 },
            ])
        ).rejects.toMatchObject({
            statusCode: 400,
            code: "NO_ROUTE",
        });
    });

    test("Should throw InternalServerError on timeout", async () => {
        const timeoutError = new Error("Aborted");
        timeoutError.name = "AbortError";
        fetchWithTimeoutMock.mockRejectedValue(timeoutError);

        await expect(
            snapToRoad([
                { lat: 45.1, lng: 9.1 },
                { lat: 45.2, lng: 9.2 },
            ])
        ).rejects.toMatchObject({
            statusCode: 500,
            code: "OSRM_TIMEOUT",
        });
    });
});
