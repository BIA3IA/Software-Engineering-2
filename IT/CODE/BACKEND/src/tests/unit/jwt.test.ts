import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

jest.mock('../../utils/utils', () => ({
    getJwtSecrets: jest.fn(() => ({
        accessTokenSecret: "test-access-secret",
        refreshTokenSecret: "test-refresh-secret",
    })),
}));

import { generateTokens, verifyAccessToken, verifyRefreshToken } from "../../middleware/jwt.auth";

describe("Testing JWT auth middleware", () => {

    const mockRequest = () => ({
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

    describe("Testing generateTokens", () => {

        test("Should generate access and refresh tokens", () => {
            const userId = "cuid123";

            const tokens = generateTokens(userId);

            expect(tokens).toHaveProperty("accessToken");
            expect(tokens).toHaveProperty("refreshToken");
            expect(typeof tokens.accessToken).toBe("string");
            expect(typeof tokens.refreshToken).toBe("string");
        });

        test("Generated tokens should contain userId in payload", () => {
            const userId = "cuid123";

            const { accessToken, refreshToken } = generateTokens(userId);

            const decodedAccess = jwt.decode(accessToken) as any;
            const decodedRefresh = jwt.decode(refreshToken) as any;

            expect(decodedAccess.userId).toBe(userId);
            expect(decodedRefresh.userId).toBe(userId);
        });

        test("Generated tokens should have expiration", () => {
            const userId = "cuid123";

            const { accessToken, refreshToken } = generateTokens(userId);

            const decodedAccess = jwt.decode(accessToken) as any;
            const decodedRefresh = jwt.decode(refreshToken) as any;

            expect(decodedAccess).toHaveProperty("exp");
            expect(decodedAccess).toHaveProperty("iat");
            expect(decodedRefresh).toHaveProperty("exp");
            expect(decodedRefresh).toHaveProperty("iat");
        });
    });

    describe("Testing verifyAccessToken middleware", () => {

        test("Should call next with UnauthorizedError when no token provided", () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = jest.fn();

            verifyAccessToken(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    code: "ACCESS_TOKEN_MISSING",
                })
            );
        });

        test("Should call next with UnauthorizedError when Authorization header has no Bearer prefix", () => {
            const req = mockRequest();
            req.headers.authorization = "InvalidToken";
            const res = mockResponse();
            const next = jest.fn();

            verifyAccessToken(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    code: "ACCESS_TOKEN_MISSING",
                })
            );
        });

        test("Should call next with ForbiddenError when token is invalid", () => {
            const req = mockRequest();
            req.headers.authorization = "Bearer invalid-token";
            const res = mockResponse();
            const next = jest.fn();

            verifyAccessToken(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "INVALID_ACCESS_TOKEN",
                })
            );
        });

        test("Should attach decoded payload to req.user and call next on valid token", () => {
            const userId = "cuid123";
            const { accessToken } = generateTokens(userId);

            const req = mockRequest();
            req.headers.authorization = `Bearer ${accessToken}`;
            const res = mockResponse();
            const next = jest.fn();

            verifyAccessToken(req, res, next);

            expect(req.user).toBeDefined();
            expect(req.user?.userId).toBe(userId);
            expect(next).toHaveBeenCalledWith();
        });

        test("Should call next with ForbiddenError when token is expired", () => {
            const expiredToken = jwt.sign(
                { userId: "cuid123" },
                "test-access-secret",
                { expiresIn: "-1s" }
            );

            const req = mockRequest();
            req.headers.authorization = `Bearer ${expiredToken}`;
            const res = mockResponse();
            const next = jest.fn();

            verifyAccessToken(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "INVALID_ACCESS_TOKEN",
                })
            );
        });
    });

    describe("Testing verifyRefreshToken", () => {

        test("Should return decoded payload for valid refresh token", () => {
            const userId = "cuid123";
            const { refreshToken } = generateTokens(userId);

            const decoded = verifyRefreshToken(refreshToken);

            expect(decoded.userId).toBe(userId);
            expect(decoded).toHaveProperty("iat");
            expect(decoded).toHaveProperty("exp");
        });

        test("Should throw ForbiddenError for invalid refresh token", () => {
            expect(() => verifyRefreshToken("invalid-token")).toThrow(
                expect.objectContaining({
                    statusCode: 403,
                    code: "INVALID_REFRESH_TOKEN",
                })
            );
        });

        test("Should throw ForbiddenError for expired refresh token", () => {
            const expiredToken = jwt.sign(
                { userId: "cuid123" },
                "test-refresh-secret",
                { expiresIn: "-1s" }
            );

            expect(() => verifyRefreshToken(expiredToken)).toThrow(
                expect.objectContaining({
                    statusCode: 403,
                    code: "INVALID_REFRESH_TOKEN",
                })
            );
        });
    });
});