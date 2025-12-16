import { describe, expect, test } from "@jest/globals";
import { getJwtSecrets } from "../../utils/utils";

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
