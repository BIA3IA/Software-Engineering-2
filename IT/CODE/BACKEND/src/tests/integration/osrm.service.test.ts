import { describe, test, expect } from "@jest/globals";
import { snapToRoad } from "../../services/osrm.service";

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe("OSRM Service Integration Tests", () => {

    describe("snapToRoad", () => {

        test("Should snap coordinates to road successfully with real OSRM", async () => {
            const coordinates = [
                { lat: 45.4642, lng: 9.1900 },
                { lat: 45.4700, lng: 9.1950 }
            ];

            const result = await snapToRoad(coordinates);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('lat');
            expect(result[0]).toHaveProperty('lng');
            expect(typeof result[0].lat).toBe('number');
            expect(typeof result[0].lng).toBe('number');
        }, 10000);

        test("Should throw BadRequestError for less than 2 coordinates", async () => {
            const coordinates = [{ lat: 45.4642, lng: 9.1900 }];

            await expect(snapToRoad(coordinates)).rejects.toMatchObject({
                statusCode: 400,
                code: "MISSING_COORDINATES"
            });
        });

        test("Should throw BadRequestError for empty array", async () => {
            const coordinates: Array<{ lat: number; lng: number }> = [];

            await expect(snapToRoad(coordinates)).rejects.toMatchObject({
                statusCode: 400,
                code: "MISSING_COORDINATES"
            });
        });

    });

});