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
        getUserByUsername: jest.fn(),
        createUser: jest.fn(),
        updateUserProfile: jest.fn(),
    }
}));

import bcrypt from 'bcrypt';
import { queryManager } from "../../managers/query";
import { UserManager } from "../../managers/user/user.manager";

describe("Testing UserManager business logic", () => {

    const mockRequest = () => ({
        method: 'POST',
        body: {},
        originalUrl: '/api/user',
        params: {},
        query: {},
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

    describe("Testing register method", () => {

        test("Successful registration returns created user", async () => {
            const req = mockRequest();
            req.body = {
                email: "test@email.com",
                password: "password123",
                username: "testuser",
                systemPreferences: ["pref1", "pref2"],
            };

            (queryManager.getUserByEmail as jest.Mock).mockResolvedValue(null);
            (queryManager.getUserByUsername as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
            (queryManager.createUser as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                systemPreferences: ["pref1", "pref2"],
            });

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().register(req, res, next);

            expect(queryManager.getUserByEmail).toHaveBeenCalledWith("test@email.com");
            expect(queryManager.getUserByUsername).toHaveBeenCalledWith("testuser");
            expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
            expect(queryManager.createUser).toHaveBeenCalledWith(
                "test@email.com",
                "hashedPassword",
                "testuser",
                ["pref1", "pref2"]
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                user: {
                    userId: "cuid123",
                    email: "test@email.com",
                    username: "testuser",
                    systemPreferences: ["pref1", "pref2"],
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Missing credentials calls next with BadRequestError", async () => {
            const req = mockRequest();
            req.body = { email: "test@email.com" };

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().register(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_CREDENTIALS",
                })
            );
            expect(res.status).not.toHaveBeenCalled();
        });

        test("Existing email calls next with ConflictError", async () => {
            const req = mockRequest();
            req.body = {
                email: "existing@email.com",
                password: "password123",
                username: "testuser",
            };

            (queryManager.getUserByEmail as jest.Mock).mockResolvedValue({
                userId: "existingUserId",
                email: "existing@email.com",
            });

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().register(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 409,
                    code: "EMAIL_ALREADY_IN_USE",
                })
            );
        });

    });

    describe("Testing getProfile method", () => {

        test("Successful getProfile returns user data", async () => {
            const req = mockRequest();
            req.user = { userId: "cuid123", iat: 0, exp: 0 };

            (queryManager.getUserById as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
            });

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().getProfile(req, res, next);

            expect(queryManager.getUserById).toHaveBeenCalledWith("cuid123");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    userId: "cuid123",
                    email: "test@email.com",
                    username: "testuser",
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Missing userId calls next with UnauthorizedError", async () => {
            const req = mockRequest();
            req.user = undefined;

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().getProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    code: "USER_NOT_AUTHENTICATED",
                })
            );
        });

        test("User not found calls next with NotFoundError", async () => {
            const req = mockRequest();
            req.user = { userId: "nonexistent", iat: 0, exp: 0 };

            (queryManager.getUserById as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().getProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                })
            );
        });
    });

    describe("Testing updateProfile method", () => {

        test("Successful profile update returns success message", async () => {
            const req = mockRequest();
            req.user = { userId: "cuid123", iat: 0, exp: 0 };
            req.body = { username: "newusername" };

            (queryManager.getUserById as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "oldusername",
            });
            (queryManager.getUserByUsername as jest.Mock).mockResolvedValue(null);
            (queryManager.updateUserProfile as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().updateProfile(req, res, next);

            expect(queryManager.updateUserProfile).toHaveBeenCalledWith("cuid123", {
                username: "newusername",
                email: undefined,
                password: undefined,
                systemPreferences: undefined,
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Profile updated successfully",
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Update with new password hashes the password", async () => {
            const req = mockRequest();
            req.user = { userId: "cuid123", iat: 0, exp: 0 };
            req.body = { currentPassword: "oldpassword123", password: "newpassword123" };

            (queryManager.getUserById as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                password: "hashedPassword",
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue("newHashedPassword");
            (queryManager.updateUserProfile as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().updateProfile(req, res, next);

            expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 10);
            expect(queryManager.updateUserProfile).toHaveBeenCalledWith("cuid123", {
                username: undefined,
                email: undefined,
                password: "newHashedPassword",
                systemPreferences: undefined,
            });
        });

        test("Email already in use throws ConflictError", async () => {
            const req = mockRequest();
            req.user = { userId: "cuid123", iat: 0, exp: 0 };
            req.body = { email: "taken@email.com" };

            (queryManager.getUserById as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                password: "hashedPassword",
            });
            (queryManager.getUserByEmail as jest.Mock).mockResolvedValue({
                userId: "otherUser",
                email: "taken@email.com",
            });

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().updateProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 409,
                    code: "EMAIL_ALREADY_IN_USE",
                })
            );
        });

        test("Incorrect current password throws BadRequestError", async () => {
            const req = mockRequest();
            req.user = { userId: "cuid123", iat: 0, exp: 0 };
            req.body = { currentPassword: "wrong-password", password: "newpassword123" };

            (queryManager.getUserById as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                password: "hashedPassword",
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().updateProfile(req, res, next);

            expect(bcrypt.compare).toHaveBeenCalledWith("wrong-password", "hashedPassword");
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "INCORRECT_PASSWORD",
                })
            );
        });

        test("Missing userId calls next with UnauthorizedError", async () => {
            const req = mockRequest();
            req.user = undefined;
            req.body = { username: "newusername" };

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().updateProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    code: "USER_NOT_AUTHENTICATED",
                })
            );
        });

        test("Empty payload calls next with BadRequestError", async () => {
            const req = mockRequest();
            req.user = { userId: "cuid123", iat: 0, exp: 0 };
            req.body = {};

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().updateProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "EMPTY_PAYLOAD",
                })
            );
        });

        test("User not found calls next with NotFoundError", async () => {
            const req = mockRequest();
            req.user = { userId: "nonexistent", iat: 0, exp: 0 };
            req.body = { username: "newusername" };

            (queryManager.getUserById as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new UserManager().updateProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "USER_NOT_FOUND",
                })
            );
        });

    });
});
