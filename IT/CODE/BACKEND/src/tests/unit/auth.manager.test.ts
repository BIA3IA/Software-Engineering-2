import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

jest.mock('../../managers/query', () => ({
    queryManager: {
        getUserByEmail: jest.fn(),
        getUserById: jest.fn(),
        createRefreshToken: jest.fn(),
        deleteRefreshToken: jest.fn(),
        getRefreshToken: jest.fn(),
    }
}));

jest.mock('../../middleware/jwt.auth', () => ({
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
}));

import bcrypt from 'bcrypt';
import { queryManager } from "../../managers/query";
import { generateTokens, verifyRefreshToken } from "../../middleware/jwt.auth";
import { AuthManager } from "../../managers/auth/auth.manager";

describe("Testing AuthManager business logic", () => {

    const mockRequest = () => ({
        method: 'POST',
        body: {},
        originalUrl: '/api/auth/login',
        params: {},
        query: {},
        headers: {},
    }) as unknown as Request;

    const mockResponse = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    }) as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing login method", () => {
        
        test("Successful login returns user and tokens", async () => {
            const req = mockRequest();
            req.body = { 
                email: "test@email.com", 
                password: "password123" 
            };

            const fakeUser = {
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                password: "hashedPassword",
            };

            (queryManager.getUserByEmail as jest.Mock).mockResolvedValue(fakeUser);
            (queryManager.createRefreshToken as jest.Mock).mockResolvedValue({});
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (generateTokens as jest.Mock).mockReturnValue({
                accessToken: "access123",
                refreshToken: "refresh123",
            });

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().login(req, res, next);

            expect(queryManager.getUserByEmail).toHaveBeenCalledWith("test@email.com");
            expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedPassword");
            expect(generateTokens).toHaveBeenCalledWith("cuid123");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                user: { userId: "cuid123", email: "test@email.com", username: "testuser" },
                tokens: { accessToken: "access123", refreshToken: "refresh123" }
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Missing credentials calls next with BadRequestError", async () => {
            const req = mockRequest();
            req.body = { email: "test@email.com" }; 

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().login(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_CREDENTIALS"
                })
            );
            expect(res.json).not.toHaveBeenCalled();
        });

        test("User not found calls next with NotFoundError", async () => {
            const req = mockRequest();
            req.body = { email: "notfound@email.com", password: "password123" };

            (queryManager.getUserByEmail as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().login(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "USER_NOT_FOUND"
                })
            );
        });

        test("invalid password calls next with UnauthorizedError", async () => {
            const req = mockRequest();
            req.body = { email: "test@email.com", password: "wrongpassword" };

            (queryManager.getUserByEmail as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                password: "hashedPassword",
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().login(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    code: "INVALID_CREDENTIALS"
                })
            );
        });
    });


    describe("Testing logout method", () => {

        test("Successfull logout returns 204", async () => {
            const req = mockRequest();
            req.body = { refreshToken: "refresh123" };

            (queryManager.deleteRefreshToken as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().logout(req, res, next);

            expect(queryManager.deleteRefreshToken).toHaveBeenCalledWith("refresh123");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.json).toHaveBeenCalledWith({});
            expect(next).not.toHaveBeenCalled();
        });

        test("Missing refresh token calls next with UnauthorizedError", async () => {
            const req = mockRequest();
            req.body = { };

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().logout(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    code: "MISSING_REFRESH_TOKEN"
                })
            );
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

    });

    describe("Testing refresh method", () => {

        test("Successful token refresh returns new tokens", async () => {
            const req = mockRequest();
            req.body = { refreshToken: "oldRefreshToken" };

            const fakeUser = {
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
            };

            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 1);

            (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: "cuid123" });
            (queryManager.getRefreshToken as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                token: "oldRefreshToken",
                expiresAt: futureDate,
            });
            (queryManager.getUserById as jest.Mock).mockResolvedValue(fakeUser);
            (queryManager.deleteRefreshToken as jest.Mock).mockResolvedValue({});
            (queryManager.createRefreshToken as jest.Mock).mockResolvedValue({});
            (generateTokens as jest.Mock).mockReturnValue({
                accessToken: "newAccessToken",
                refreshToken: "newRefreshToken",
            });

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().refresh(req, res, next);

            expect(verifyRefreshToken).toHaveBeenCalledWith("oldRefreshToken");
            expect(queryManager.getRefreshToken).toHaveBeenCalledWith("oldRefreshToken");
            expect(queryManager.getUserById).toHaveBeenCalledWith("cuid123");
            expect(queryManager.deleteRefreshToken).toHaveBeenCalledWith("oldRefreshToken");
            expect(generateTokens).toHaveBeenCalledWith("cuid123");
            expect(queryManager.createRefreshToken).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Tokens refreshed successfully",
                tokens: {
                    accessToken: "newAccessToken",
                    refreshToken: "newRefreshToken",
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Missing refresh token calls next with UnauthorizedError", async () => {
            const req = mockRequest();
            req.body = {};

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().refresh(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    code: "MISSING_REFRESH_TOKEN"
                })
            );
            expect(res.json).not.toHaveBeenCalled();
        });

        test("Invalid refresh token calls next with ForbiddenError", async () => {
            const req = mockRequest();
            req.body = { refreshToken: "invalidToken" };

            (verifyRefreshToken as jest.Mock).mockImplementation(() => {
                throw new Error("Invalid token");
            });

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().refresh(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "INVALID_REFRESH_TOKEN"
                })
            );
            expect(res.json).not.toHaveBeenCalled();
        });

        test("Nonexistent refresh token calls next with ForbiddenError", async () => {
            const req = mockRequest();
            req.body = { refreshToken: "nonexistentToken" };

            (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: "cuid123" });
            (queryManager.getRefreshToken as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().refresh(req, res, next);

            expect(verifyRefreshToken).toHaveBeenCalledWith("nonexistentToken");
            expect(queryManager.getRefreshToken).toHaveBeenCalledWith("nonexistentToken");
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "REFRESH_TOKEN_NOT_FOUND"
                })
            );
            expect(res.json).not.toHaveBeenCalled();
        });

        test("Expired refresh token calls next with ForbiddenError", async () => {
            const req = mockRequest();
            req.body = { refreshToken: "expiredToken" };

            const pastDate = new Date();
            pastDate.setHours(pastDate.getHours() - 1);

            (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: "cuid123" });
            (queryManager.getRefreshToken as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                token: "expiredToken",
                expiresAt: pastDate,
            });
            (queryManager.deleteRefreshToken as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new AuthManager().refresh(req, res, next);

            expect(queryManager.deleteRefreshToken).toHaveBeenCalledWith("expiredToken");
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "REFRESH_TOKEN_EXPIRED"
                })
            );
            expect(res.json).not.toHaveBeenCalled();
        });

    });

});