import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

jest.mock('../../managers/query', () => ({
    queryManager: {
        getSegmentById: jest.fn(),
        getRecentReportByUserAndSegment: jest.fn(),
        countReportsByUserSince: jest.fn(),
        createReport: jest.fn(),
        getReportById: jest.fn(),
        getTripById: jest.fn(),
        getReportsByPathId: jest.fn(),
        getReportsBySegmentId: jest.fn(),
        attachReportsToTrip: jest.fn(),
    }
}));

jest.mock('../../utils/index', () => ({
    computeReportSignals: jest.fn(),
}));

jest.mock('../../managers/path/path.manager', () => ({
    pathManager: {
        recalculateSegmentStatusForAllPaths: jest.fn(),
        createPath: jest.fn(),
        getPathById: jest.fn(),
        getPaths: jest.fn(),
        searchPath: jest.fn(),
        recalculatePathSegmentStatuses: jest.fn(),
    }
}));

import { queryManager } from "../../managers/query";
import { ReportManager } from "../../managers/report/report.manager";
import { pathManager } from "../../managers/path/path.manager";
import { computeReportSignals } from "../../utils/index";

describe("Testing ReportManager business logic", () => {

    const mockRequest = () => ({
        method: 'POST',
        body: {},
        params: {},
        query: {},
        user: undefined,
    }) as unknown as Request;

    const mockResponse = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    }) as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing createReport method", () => {

        test("Should create report successfully", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                segmentId: "segment1",
                sessionId: "session123",
                obstacleType: "POTHOLE",
                position: { lat: 45.4642, lng: 9.1900 },
                pathStatus: "BLOCKED",
            };

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
            };

            (queryManager.getSegmentById as jest.Mock).mockResolvedValue(mockSegment);
            (queryManager.getRecentReportByUserAndSegment as jest.Mock).mockResolvedValue(null);
            (queryManager.countReportsByUserSince as jest.Mock).mockResolvedValue(0);
            (queryManager.createReport as jest.Mock).mockResolvedValue(mockReport);
            (pathManager.recalculateSegmentStatusForAllPaths as jest.Mock).mockResolvedValue(undefined);

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().createReport(req, res, next);

            expect(queryManager.getSegmentById).toHaveBeenCalledWith("segment1");
            expect(queryManager.createReport).toHaveBeenCalledWith({
                userId: "user123",
                segmentId: "segment1",
                tripId: undefined,
                sessionId: "session123",
                obstacleType: "POTHOLE",
                pathStatus: "BLOCKED",
                position: { lat: 45.4642, lng: 9.1900 },
                status: "CREATED",
            });
            expect(pathManager.recalculateSegmentStatusForAllPaths).toHaveBeenCalledWith("segment1");
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Report submitted successfully",
                data: {
                    reportId: "report1",
                    createdAt: mockReport.createdAt,
                }
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Should return error for missing authentication", async () => {
            const req = mockRequest();
            req.body = {
                segmentId: "segment1",
                sessionId: "session123",
                obstacleType: "POTHOLE",
                position: { lat: 45.4642, lng: 9.1900 },
            };

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().createReport(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "UNAUTHORIZED",
                })
            );
        });

        test("Should return error for missing segment ID", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                sessionId: "session123",
                obstacleType: "POTHOLE",
                position: { lat: 45.4642, lng: 9.1900 },
            };

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().createReport(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_SEGMENT_ID",
                })
            );
        });

        test("Should return error for non-existent segment", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                segmentId: "nonexistent",
                sessionId: "session123",
                obstacleType: "POTHOLE",
                position: { lat: 45.4642, lng: 9.1900 },
            };

            (queryManager.getSegmentById as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().createReport(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "SEGMENT_NOT_FOUND",
                })
            );
        });

        test("Should return error for rate limit exceeded", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                segmentId: "segment1",
                sessionId: "session123",
                obstacleType: "POTHOLE",
                position: { lat: 45.4642, lng: 9.1900 },
            };

            const mockSegment = { segmentId: "segment1" };

            (queryManager.getSegmentById as jest.Mock).mockResolvedValue(mockSegment);
            (queryManager.getRecentReportByUserAndSegment as jest.Mock).mockResolvedValue(null);
            (queryManager.countReportsByUserSince as jest.Mock).mockResolvedValue(10);

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().createReport(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 429,
                    code: "REPORT_RATE_LIMIT",
                })
            );
        });
    });

    describe("Testing confirmReport method", () => {

        test("Should confirm report successfully", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.params = { reportId: "report1" };
            req.body = {
                decision: "CONFIRMED",
                tripId: "trip1",
                sessionId: "session123",
            };

            const mockReport = {
                reportId: "report1",
                segmentId: "segment1",
                obstacleType: "POTHOLE",
                pathStatus: "BLOCKED",
                position: { lat: 45.4642, lng: 9.1900 },
            };

            const mockTrip = { tripId: "trip1" };
            const mockConfirmation = {
                reportId: "report2",
                status: "CONFIRMED",
            };

            (queryManager.getReportById as jest.Mock).mockResolvedValue(mockReport);
            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);
            (queryManager.createReport as jest.Mock).mockResolvedValue(mockConfirmation);
            (pathManager.recalculateSegmentStatusForAllPaths as jest.Mock).mockResolvedValue(undefined);

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().confirmReport(req, res, next);

            expect(queryManager.getReportById).toHaveBeenCalledWith("report1");
            expect(queryManager.createReport).toHaveBeenCalledWith({
                userId: "user123",
                segmentId: "segment1",
                tripId: "trip1",
                sessionId: "session123",
                obstacleType: "POTHOLE",
                pathStatus: "BLOCKED",
                position: { lat: 45.4642, lng: 9.1900 },
                status: "CONFIRMED",
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(next).not.toHaveBeenCalled();
        });

        test("Should return error for non-existent report", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.params = { reportId: "nonexistent" };
            req.body = { decision: "CONFIRMED" };

            (queryManager.getReportById as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().confirmReport(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "NOT_FOUND",
                })
            );
        });
    });

    describe("Testing getReportsByPath method", () => {

        test("Should return active reports for a path", async () => {
            const req = mockRequest();
            req.query = { pathId: "path1" };

            const mockReports = [
                {
                    reportId: "report1",
                    segmentId: "segment1",
                    status: "CREATED",
                    createdAt: new Date(),
                },
                {
                    reportId: "report2",
                    segmentId: "segment1",
                    status: "CREATED",
                    createdAt: new Date(Date.now() + 1000),
                },
            ];

            (queryManager.getReportsByPathId as jest.Mock).mockResolvedValue(mockReports);
            (computeReportSignals as jest.Mock).mockReturnValue({
                reliability: 0.8,
                freshness: 30,
            });

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().getReportsByPath(req, res, next);

            expect(queryManager.getReportsByPathId).toHaveBeenCalledWith("path1");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        reportId: "report2",
                        segmentId: "segment1",
                    })
                ]),
            });
            expect(next).not.toHaveBeenCalled();
        });

    });

    describe("Testing attachReportsToTrip method", () => {

        test("Should attach reports to trip successfully", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                sessionId: "session123",
                tripId: "trip1",
            };

            const mockTrip = {
                tripId: "trip1",
                userId: "user123",
            };

            (queryManager.getTripById as jest.Mock).mockResolvedValue(mockTrip);
            (queryManager.attachReportsToTrip as jest.Mock).mockResolvedValue(5);

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().attachReportsToTrip(req, res, next);

            expect(queryManager.getTripById).toHaveBeenCalledWith("trip1");
            expect(queryManager.attachReportsToTrip).toHaveBeenCalledWith("user123", "session123", "trip1");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    updatedCount: 5,
                },
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Should return error for missing session ID", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = { tripId: "trip1" };

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().attachReportsToTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_SESSION_ID",
                })
            );
        });

        test("Should return error for non-existent or unauthorized trip", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                sessionId: "session123",
                tripId: "trip1",
            };

            (queryManager.getTripById as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new ReportManager().attachReportsToTrip(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "TRIP_NOT_FOUND",
                })
            );
        });
    });
});