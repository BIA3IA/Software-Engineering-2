import { describe, test, expect } from "@jest/globals";
import { geocodeAddress } from "../../services/geocoding.service";

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe("Geocoding Service Integration Tests", () => {

    describe("geocodeAddress", () => {

        test("Should geocode address successfully with real Nominatim", async () => {
            const result = await geocodeAddress("Piazza Duomo, Milano");

            expect(result).toBeDefined();
            expect(result).toHaveProperty('lat');
            expect(result).toHaveProperty('lng');
            expect(typeof result.lat).toBe('number');
            expect(typeof result.lng).toBe('number');
            expect(result.lat).toBeCloseTo(45.464, 1);
            expect(result.lng).toBeCloseTo(9.190, 1);
        }, 10000);

        test("Should throw BadRequestError for empty address", async () => {
            await expect(geocodeAddress("")).rejects.toMatchObject({
                statusCode: 400,
                code: "MISSING_ADDRESS"
            });
        });

        test("Should throw BadRequestError for whitespace only", async () => {
            await expect(geocodeAddress("   ")).rejects.toMatchObject({
                statusCode: 400,
                code: "MISSING_ADDRESS"
            });
        });

        test("Should throw BadRequestError when address not found", async () => {
            await expect(geocodeAddress("nonexistentplace123!")).rejects.toMatchObject({
                statusCode: 400,
                code: "GEOCODE_NOT_FOUND"
            });
        }, 10000);

    });

});