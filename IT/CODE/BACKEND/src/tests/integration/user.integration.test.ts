import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

// see auth.integration.test.ts for explanation

jest.mock("../../utils/prisma-client", () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        refreshToken: {
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

jest.mock("../../utils/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

import { app } from "../../server";
import prisma from "../../utils/prisma-client";

describe("User Routes Integration Tests", () => {

    const generateValidAccessToken = (userId: string) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    });

    describe("Testing POST /api/v1/users/register", () => {

        test("Should register a new user successfully", async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "newuser@email.com",
                username: "newuser",
                systemPreferences: ["pref1"],
            });

            const response = await request(app)
                .post("/api/v1/users/register")
                .send({
                    email: "newuser@email.com",
                    password: "password123",
                    username: "newuser",
                    systemPreferences: ["pref1"],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toEqual({
                userId: "cuid123",
                email: "newuser@email.com",
                username: "newuser",
                systemPreferences: ["pref1"],
            });
        });

        test("Should return 400 for invalid registration data", async () => {
            const response = await request(app)
                .post("/api/v1/users/register")
                .send({
                    email: "invalid-email",
                    password: "short",
                    username: "ab",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("Should return 409 for existing email", async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                userId: "existing",
                email: "existing@email.com",
            });

            const response = await request(app)
                .post("/api/v1/users/register")
                .send({
                    email: "existing@email.com",
                    password: "password123",
                    username: "newuser",
                });

            expect(response.status).toBe(409);
            expect(response.body.error.code).toBe("EMAIL_ALREADY_IN_USE");
        });

        test("Should return 409 for existing username", async () => {
            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ userId: "existing", username: "existinguser" });

            const response = await request(app)
                .post("/api/v1/users/register")
                .send({
                    email: "new@email.com",
                    password: "password123",
                    username: "existinguser",
                });

            expect(response.status).toBe(409);
            expect(response.body.error.code).toBe("USERNAME_ALREADY_IN_USE");
        });
    });


    describe("Testing GET /api/v1/users/profile", () => {

        test("Should return user profile with valid access token", async () => {
            const accessToken = generateValidAccessToken("cuid123");

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
            });

            const response = await request(app)
                .get("/api/v1/users/profile")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
            });
        });

        test("Should return 401 for missing access token", async () => {
            const response = await request(app)
                .get("/api/v1/users/profile");

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("ACCESS_TOKEN_MISSING");
        });

        test("Should return 403 for invalid access token", async () => {
            const response = await request(app)
                .get("/api/v1/users/profile")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
        });

        test("Should return 404 for non-existent user", async () => {
            const accessToken = generateValidAccessToken("nonexistent");

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .get("/api/v1/users/profile")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("USER_NOT_FOUND");
        });
    });

    describe("Testing PATCH /api/v1/users/update-profile", () => {

        test("Should update profile successfully", async () => {
            const accessToken = generateValidAccessToken("cuid123");

            (prisma.user.findUnique as jest.Mock)
                .mockResolvedValueOnce({
                    userId: "cuid123",
                    email: "test@email.com",
                    username: "oldusername",
                })
                .mockResolvedValueOnce(null);

            (prisma.user.update as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "newusername",
            });

            const response = await request(app)
                .patch("/api/v1/users/update-profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ username: "newusername" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Profile updated successfully");
        });

        test("Should return 401 for missing access token", async () => {
            const response = await request(app)
                .patch("/api/v1/users/update-profile")
                .send({ username: "newusername" });

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("ACCESS_TOKEN_MISSING");
        });

        test("Should return 400 for empty payload", async () => {
            const accessToken = generateValidAccessToken("cuid123");

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
            });

            const response = await request(app)
                .patch("/api/v1/users/update-profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("EMPTY_PAYLOAD");
        });

        test("Should return 409 for username conflict", async () => {
            const accessToken = generateValidAccessToken("cuid123");

            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                    userId: "cuid123",
                    email: "test@email.com",
                    username: "oldusername",
                })
                .mockResolvedValueOnce({
                    userId: "otherUser",
                    username: "takenusername",
                });

            const response = await request(app)
                .patch("/api/v1/users/update-profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ username: "takenusername" });

            expect(response.status).toBe(409);
            expect(response.body.error.code).toBe("USERNAME_ALREADY_IN_USE");
        });
    });

    describe("Testing 404 Not Found", () => {

        test("Should return 404 for undefined routes", async () => {
            const response = await request(app)
                .get("/api/v1/nonexistent");

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
        });
    });
});