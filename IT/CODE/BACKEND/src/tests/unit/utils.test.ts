import { describe, expect, test } from "@jest/globals";
import { getJwtSecrets, sortTripSegmentsByChain, sortPathSegmentsByChain } from "../../utils/index";

describe("Testing getJwtSecrets function", () => {

    test("Should return JWT secrets when environment variables are set", () => {
        process.env.JWT_SECRET = "testAccessTokenSecret";
        process.env.JWT_REFRESH_SECRET = "testRefreshTokenSecret";

        const secrets = getJwtSecrets();
        expect(secrets).toEqual({
            accessTokenSecret: "testAccessTokenSecret",
            refreshTokenSecret: "testRefreshTokenSecret",
        });
    });

    test("Should throw an error when JWT_SECRET is not set", () => {
        delete process.env.JWT_SECRET;
        process.env.JWT_REFRESH_SECRET = "testRefreshTokenSecret";

        expect(() => {
            getJwtSecrets();
        }).toThrow("JWT secrets are not defined in environment variables");
    });

    test("Should throw an error when JWT_REFRESH_SECRET is not set", () => {
        process.env.JWT_SECRET = "testAccessTokenSecret";
        delete process.env.JWT_REFRESH_SECRET;

        expect(() => {
            getJwtSecrets();
        }).toThrow("JWT secrets are not defined in environment variables");
    });

    test("Should throw an error when both JWT secrets are not set", () => {
        delete process.env.JWT_SECRET;
        delete process.env.JWT_REFRESH_SECRET;

        expect(() => {
            getJwtSecrets();
        }).toThrow("JWT secrets are not defined in environment variables");
    });

});

describe("Testing sortTripSegmentsByChain function", () => {

    test("Should return a single segment if there is only one segment", () => {
        const segments = [
            {
                segmentId: "seg1",
                nextSegmentId: null,
                segment: {
                    segmentId: "seg1",
                    status: "active",
                    polylineCoordinates: [],
                    createdAt: new Date(),
                }
            }
        ];

        const result = sortTripSegmentsByChain(segments);
        expect(result).toEqual(segments);
        expect(result.length).toBe(1);
    });

    test("Should return a sorted array of segments based on their nextSegmentId", () => {
        const baseDate = new Date();
        const segments = [
            {
                segmentId: "seg3",
                nextSegmentId: "seg1",
                segment: {
                    segmentId: "seg3",
                    status: "active",
                    polylineCoordinates: [],
                    createdAt: baseDate,
                }
            },
            {
                segmentId: "seg1",
                nextSegmentId: null,
                segment: {
                    segmentId: "seg1",
                    status: "active",
                    polylineCoordinates: [],
                    createdAt: baseDate,
                }
            },
            {
                segmentId: "seg2",
                nextSegmentId: "seg3",
                segment: {
                    segmentId: "seg2",
                    status: "active",
                    polylineCoordinates: [],
                    createdAt: baseDate,
                }
            }
        ];

        const result = sortTripSegmentsByChain(segments);
        
        expect(result.length).toBe(3);
        expect(result[0].segmentId).toBe("seg2");
        expect(result[1].segmentId).toBe("seg3");
        expect(result[2].segmentId).toBe("seg1");
        expect(result[2].nextSegmentId).toBeNull();
    });

});

describe("Testing sortPathSegmentsByChain function", () => {

    test("Should return a single segment if there is only one segment", () => {
        const segments = [
            {
                segmentId: "seg1",
                nextSegmentId: null,
                pathId: "path1",
                segment: {
                    segmentId: "seg1",
                    status: "OPTIMAL",
                    polylineCoordinates: [],
                    createdAt: new Date(),
                }
            }
        ];

        const result = sortPathSegmentsByChain(segments);
        expect(result).toEqual(segments);
        expect(result.length).toBe(1);
    });

    test("Should return a sorted array of segments based on their nextSegmentId", () => {
        const date = new Date();
        const segments = [
            {
                segmentId: "seg3",
                nextSegmentId: "seg1",
                pathId: "path1",
                segment: {
                    segmentId: "seg3",
                    status: "OPTIMAL",
                    polylineCoordinates: [],
                    createdAt: date,
                }
            },
            {
                segmentId: "seg1",
                nextSegmentId: null,
                pathId: "path1",
                segment: {
                    segmentId: "seg1",
                    status: "OPTIMAL",
                    polylineCoordinates: [],
                    createdAt: date,
                }
            },
            {
                segmentId: "seg2",
                nextSegmentId: "seg3",
                pathId: "path1",
                segment: {
                    segmentId: "seg2",
                    status: "OPTIMAL",
                    polylineCoordinates: [],
                    createdAt: date,
                }
            }
        ];

        const result = sortPathSegmentsByChain(segments);
        
        expect(result.length).toBe(3);
        expect(result[0].segmentId).toBe("seg2");
        expect(result[1].segmentId).toBe("seg3");
        expect(result[2].segmentId).toBe("seg1");
        expect(result[2].nextSegmentId).toBeNull();
    });

});