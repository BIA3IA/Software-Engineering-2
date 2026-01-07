import { describe, expect, test } from "@jest/globals";
import { getJwtSecrets, sortSegmentsByChain } from "../../utils/index";

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

describe("Testing sortSegmentsByChain function", () => {

    test("Should return a single segment if there is only one segment", () => {
        const segments = [
            {
                segmentId: "seg1",
                nextSegmentId: null,
                segment: {
                    segmentId: "seg1",
                    status: "active",
                    polylineCoordinates: [],
                }
            }
        ];

        const result = sortSegmentsByChain(segments);
        expect(result).toEqual(segments);
        expect(result.length).toBe(1);
    });

    test("Should return a sorted array of segments based on their nextSegmentId", () => {
        const segments = [
            {
                segmentId: "seg3",
                nextSegmentId: "seg1",
                segment: {
                    segmentId: "seg3",
                    status: "active",
                    polylineCoordinates: [],
                }
            },
            {
                segmentId: "seg1",
                nextSegmentId: null,
                segment: {
                    segmentId: "seg1",
                    status: "active",
                    polylineCoordinates: [],
                }
            },
            {
                segmentId: "seg2",
                nextSegmentId: "seg3",
                segment: {
                    segmentId: "seg2",
                    status: "active",
                    polylineCoordinates: [],
                }
            }
        ];

        const result = sortSegmentsByChain(segments);
        
        expect(result.length).toBe(3);
        expect(result[0].segmentId).toBe("seg2");
        expect(result[1].segmentId).toBe("seg3");
        expect(result[2].segmentId).toBe("seg1");
        expect(result[2].nextSegmentId).toBeNull();
    });

});