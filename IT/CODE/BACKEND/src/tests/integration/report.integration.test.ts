import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

jest.mock("../../utils/prisma-client", () => ({
    __esModule: true,
    default: {
        segment: {
            findUnique: jest.fn(),
        },
        report: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            updateMany: jest.fn(),
        },
        trip: {
            findUnique: jest.fn(),
        },
        pathSegment: {
            findMany: jest.fn(),
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

jest.mock("../../managers/path/path.manager", () => ({
    pathManager: {
        recalculateSegmentStatusForAllPaths: jest.fn(),
        createPath: jest.fn(),
        getPathById: jest.fn(),
        getPaths: jest.fn(),
        searchPath: jest.fn(),
        recalculatePathSegmentStatuses: jest.fn(),
        snapPath: jest.fn(),
        getUserPaths: jest.fn(),
        deletePath: jest.fn(),
        changePathVisibility: jest.fn(),
    },
}));

import { app } from "../../server";
import prisma from "../../utils/prisma-client";

describe("Report Routes Integration Tests", () => {

    const generateValidAccessToken = (userId: string) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    });

    describe("Testing POST /api/v1/reports", () => {

        test("Should create report successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockSegment = {
                segmentId: "segment1",
                status: "OPTIMAL",
                polylineCoordinates: [],
            };

            const mockReport = {
                reportId: "report1",
                createdAt: new Date(),
                userId: "user123",
                segmentId: "segment1",
                obstacleType: "POTHOLE",
                status: "CREATED",
            };

            (prisma.segment.findUnique as jest.Mock).mockResolvedValue(mockSegment);
            (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);
            (prisma.report.count as jest.Mock).mockResolvedValue(0);
            (prisma.report.create as jest.Mock).mockResolvedValue(mockReport);

            const response = await request(app)
                .post("/api/v1/reports")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    segmentId: "segment1",
                    sessionId: "session123",
                    obstacleType: "POTHOLE",
                    position: { lat: 45.4642, lng: 9.1900 },
                    pathStatus: "REQUIRES_MAINTENANCE",
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("reportId");
            expect(response.body.message).toBe("Report submitted successfully");
        });

        test("Should return 401 for missing access token", async () => {
            const response = await request(app)
                .post("/api/v1/reports")
                .send({
                    segmentId: "segment1",
                    sessionId: "session123",
                    obstacleType: "POTHOLE",
                    position: { lat: 45.4642, lng: 9.1900 },
                });

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("ACCESS_TOKEN_MISSING");
        });

        test("Should return 400 for missing required fields", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .post("/api/v1/reports")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    segmentId: "segment1",
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("Should return 404 for non-existent segment", async () => {
            const accessToken = generateValidAccessToken("user123");

            (prisma.segment.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post("/api/v1/reports")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    segmentId: "nonexistent",
                    sessionId: "session123",
                    obstacleType: "POTHOLE",
                    position: { lat: 45.4642, lng: 9.1900 },
                    pathStatus: "CLOSED",
                });

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("SEGMENT_NOT_FOUND");
        });

    });

    describe("Testing POST /api/v1/reports/:reportId/confirm", () => {

        test("Should confirm report successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockReport = {
                reportId: "report1",
                segmentId: "segment1",
                obstacleType: "POTHOLE",
                pathStatus: "BLOCKED",
                position: { lat: 45.4642, lng: 9.1900 },
                sessionId: "session123",
            };

            const mockConfirmation = {
                reportId: "report2",
                status: "CONFIRMED",
            };

            (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
            (prisma.report.create as jest.Mock).mockResolvedValue(mockConfirmation);

            const response = await request(app)
                .post("/api/v1/reports/report1/confirm")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    decision: "CONFIRMED",
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("reportId");
        });

        test("Should return 400 for missing decision", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .post("/api/v1/reports/report1/confirm")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("Should return 404 for non-existent report", async () => {
            const accessToken = generateValidAccessToken("user123");

            (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post("/api/v1/reports/nonexistent/confirm")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    decision: "CONFIRMED",
                });

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("NOT_FOUND");
        });
    });

    describe("Testing GET /api/v1/reports?pathId=...", () => {

        test("Should return reports for a path", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockReports = [
                {
                    reportId: "report1",
                    segmentId: "segment1",
                    status: "CREATED",
                    createdAt: new Date(),
                    obstacleType: "POTHOLE",
                },
            ];

            (prisma.pathSegment.findMany as jest.Mock).mockResolvedValue([
                { segmentId: "segment1" },
            ]);
            (prisma.report.findMany as jest.Mock).mockResolvedValue(mockReports);

            const response = await request(app)
                .get("/api/v1/reports?pathId=path1")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        test("Should return 400 for missing path ID", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .get("/api/v1/reports")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });
    });

    describe("Testing POST /api/v1/reports/attach", () => {

        test("Should attach reports to trip successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockTrip = {
                tripId: "trip1",
                userId: "user123",
            };

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
            (prisma.report.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

            const response = await request(app)
                .post("/api/v1/reports/attach")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    sessionId: "session123",
                    tripId: "trip1",
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.updatedCount).toBe(5);
        });

        test("Should return 400 for missing session ID", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .post("/api/v1/reports/attach")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    tripId: "trip1",
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("Should return 404 for non-existent trip", async () => {
            const accessToken = generateValidAccessToken("user123");

            (prisma.trip.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .post("/api/v1/reports/attach")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    sessionId: "session123",
                    tripId: "nonexistent",
                });

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("TRIP_NOT_FOUND");
        });
    });
});