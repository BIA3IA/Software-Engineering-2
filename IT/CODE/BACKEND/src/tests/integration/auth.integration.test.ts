import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { app } from "../../server";

// In order to import default modules correctly with jest.mock 
// we need to mock the entire module as an object with a default property. Remember __esModule: true to indicate 
// it's an ES module. Also the mocks need to be defined before importing the actual modules.
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

import prisma from "../../utils/prisma-client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generateTokens } from "../../middleware/jwt.auth";

describe("Auth Routes Integration Tests", () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    });

    describe("POST /api/v1/auth/login", () => {

        test("Should login successfully with valid credentials", async () => {
            const hashedPassword = await bcrypt.hash("password123", 10);
            
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                password: hashedPassword,
            });

            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                token: "refresh-token",
                expiresAt: new Date(Date.now() + 3600000),
            });

            // Using supertest to make the request, it uses the exported app from server.ts
            // This avoids starting the server on a port and allows direct testing of the app instance
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "test@email.com",
                    password: "password123",
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toEqual({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
            });
            expect(response.body.tokens).toHaveProperty("accessToken");
            expect(response.body.tokens).toHaveProperty("refreshToken");
        });

        test("should return 400 for missing credentials", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: "test@email.com" });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("should return 400 for invalid email format", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "invalid-email",
                    password: "password123",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("should return 404 for non-existent user", async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "notfound@email.com",
                    password: "password123",
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe("USER_NOT_FOUND");
        });

        test("should return 401 for invalid password", async () => {
            const hashedPassword = await bcrypt.hash("correctpassword", 10);

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                password: hashedPassword,
            });

            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "test@email.com",
                    password: "wrongpassword",
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
        });
    });

    describe("POST /api/v1/auth/logout", () => {

        test("should logout successfully with valid refresh token", async () => {
            const { refreshToken } = generateTokens("cuid123");
            const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

            (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                token: tokenHash,
                expiresAt: new Date(Date.now() + 3600000),
            });
            (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});

            const response = await request(app)
                .post("/api/v1/auth/logout")
                .send({ refreshToken });

            expect(response.status).toBe(204);
            expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
                where: { token: tokenHash },
            });
            expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
                where: { token: tokenHash },
            });
        });

        test("should return 400 for missing refresh token", async () => {
            const response = await request(app)
                .post("/api/v1/auth/logout")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("should return 400 for empty refresh token", async () => {
            const response = await request(app)
                .post("/api/v1/auth/logout")
                .send({ refreshToken: "" });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });
    });

    describe("POST /api/v1/auth/refresh", () => {

        test("should refresh tokens successfully", async () => {
            const hashedPassword = await bcrypt.hash("password123", 10);

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                email: "test@email.com",
                username: "testuser",
                password: hashedPassword,
            });

            (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

            const loginResponse = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "test@email.com",
                    password: "password123",
                });

            const { refreshToken } = loginResponse.body.tokens;

            const futureDate = new Date();
            futureDate.setHours(futureDate.getHours() + 1);

            (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
                userId: "cuid123",
                token: refreshToken,
                expiresAt: futureDate,
            });

            (prisma.refreshToken.delete as jest.Mock).mockResolvedValue({});

            const response = await request(app)
                .post("/api/v1/auth/refresh")
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.tokens).toHaveProperty("accessToken");
            expect(response.body.tokens).toHaveProperty("refreshToken");
        });

        test("should return 400 for missing refresh token", async () => {
            const response = await request(app)
                .post("/api/v1/auth/refresh")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("should return 400 for empty refresh token", async () => {
            const response = await request(app)
                .post("/api/v1/auth/refresh")
                .send({ refreshToken: "" });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("should return 403 for invalid refresh token", async () => {
            const response = await request(app)
                .post("/api/v1/auth/refresh")
                .send({ refreshToken: "invalid-token" });

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
        });
    });
});
