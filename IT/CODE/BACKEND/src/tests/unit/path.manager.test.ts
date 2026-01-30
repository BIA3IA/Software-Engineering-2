import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response } from "express";

jest.mock('../../managers/query', () => ({
    queryManager: {
        createSegment: jest.fn(),
        createPath: jest.fn(),
        getPathByOriginDestination: jest.fn(),
        getPathById: jest.fn(),
        getPathsByUserId: jest.fn(),
        deletePathById: jest.fn(),
        changePathVisibility: jest.fn(),
        getSegmentsByPolylineCoordinates: jest.fn(),
    }
}));

jest.mock('../../services/index', () => ({
    snapToRoad: jest.fn(),
    geocodeAddress: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

import { PathManager } from "../../managers/path/path.manager";
import { queryManager } from "../../managers/query";
import { snapToRoad } from "../../services/index";

describe("Testing PathManager business logic", () => {

    const mockRequest = (method: string = 'GET', url: string = '/api/paths') => ({
        method,
        body: {},
        originalUrl: url,
        params: {},
        query: {},
        headers: {},
        user: undefined,
    }) as unknown as Request;

    const mockResponse = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
    }) as unknown as Response;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Testing createPath method", () => {

        test("Should create path successfully with manual mode", async () => {
            const req = mockRequest('POST', '/api/paths');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                pathSegments: [
                    { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                ],
                visibility: true,
                creationMode: "manual",
                title: "My Route"
            };

            const mockSegment = {
                segmentId: "segment1",
                status: "OPTIMAL",
                polylineCoordinates: [
                    { lat: 45.4642, lng: 9.1900 },
                    { lat: 45.4700, lng: 9.1950 }
                ],
                createdAt: new Date()
            };

            const mockPath = {
                pathId: "path1",
                userId: "user123",
                status: "OPTIMAL",
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                visibility: true,
                creationMode: "manual",
                title: "My Route",
                distanceKm: 0.5,
                createdAt: new Date(),
                pathSegments: [
                    {
                        segmentId: "segment1",
                        nextSegmentId: null,
                        status: "OPTIMAL",
                        segment: mockSegment
                    }
                ]
            };

            (queryManager.getPathByOriginDestination as jest.Mock).mockResolvedValue(null);
            (queryManager.getSegmentsByPolylineCoordinates as jest.Mock).mockResolvedValue(new Map());
            (queryManager.createSegment as jest.Mock).mockResolvedValue(mockSegment);
            (queryManager.createPath as jest.Mock).mockResolvedValue(mockPath);
            (queryManager.getPathById as jest.Mock).mockResolvedValue(mockPath);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(queryManager.createSegment).toHaveBeenCalled();
            expect(queryManager.createPath).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Path created successfully',
                data: expect.objectContaining({
                    pathId: "path1"
                })
            });
        });

        test("Should throw BadRequestError when user not authenticated", async () => {
            const req = mockRequest();
            req.body = {
                pathSegments: [{ start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }],
                visibility: true,
                creationMode: "manual"
            };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "UNAUTHORIZED"
                })
            );
        });

        test("Should throw BadRequestError for missing path segments", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                visibility: true,
                creationMode: "manual"
            };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_PATH_SEGMENTS"
                })
            );
        });

        test("Should throw BadRequestError for missing visibility", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                pathSegments: [{ start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }],
                creationMode: "manual"
            };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_VISIBILITY"
                })
            );
        });

        test("Should throw BadRequestError for missing creation mode", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                pathSegments: [{ start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }],
                visibility: true
            };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_CREATION_MODE"
                })
            );
        });

        test("Should return 409 when path already exists", async () => {
            const req = mockRequest('POST', '/api/paths');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                pathSegments: [
                    { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                ],
                visibility: true,
                creationMode: "manual"
            };

            const existingPath = {
                pathId: "existing1",
                userId: "user123",
                status: "OPTIMAL",
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                pathSegments: []
            };

            (queryManager.createSegment as jest.Mock).mockResolvedValue({ segmentId: "segment1" });
            (queryManager.getSegmentsByPolylineCoordinates as jest.Mock).mockResolvedValue(new Map());
            (queryManager.getPathByOriginDestination as jest.Mock).mockResolvedValue(existingPath);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Path with same origin and destination already exists',
                data: expect.objectContaining({
                    pathId: "existing1"
                })
            });
        });

        test("Should throw BadRequestError for invalid segment data", async () => {
            const req = mockRequest('POST', '/api/paths');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                pathSegments: [
                    { start: { lat: 45.4642, lng: 9.1900 } }
                ],
                visibility: true,
                creationMode: "manual"
            };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "INVALID_SEGMENT"
                })
            );
        });

        test("Should create path successfully with automatic mode", async () => {
            const req = mockRequest('POST', '/api/paths');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                pathSegments: [
                    { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                ],
                visibility: true,
                creationMode: "automatic",
                title: "Auto Route"
            };

            const mockSegment = {
                segmentId: "segment1",
                status: "OPTIMAL",
                polylineCoordinates: [
                    { lat: 45.4642, lng: 9.1900 },
                    { lat: 45.4700, lng: 9.1950 }
                ],
                createdAt: new Date()
            };

            const mockPath = {
                pathId: "pathAuto",
                userId: "user123",
                status: "OPTIMAL",
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                visibility: true,
                creationMode: "automatic",
                title: "Auto Route",
                distanceKm: 0.5,
                createdAt: new Date(),
                pathSegments: [
                    {
                        segmentId: "segment1",
                        nextSegmentId: null,
                        status: "OPTIMAL",
                        segment: mockSegment
                    }
                ]
            };

            (queryManager.getPathByOriginDestination as jest.Mock).mockResolvedValue(null);
            (queryManager.getSegmentsByPolylineCoordinates as jest.Mock).mockResolvedValue(new Map());
            (queryManager.createSegment as jest.Mock).mockResolvedValue(mockSegment);
            (queryManager.createPath as jest.Mock).mockResolvedValue(mockPath);
            (queryManager.getPathById as jest.Mock).mockResolvedValue(mockPath);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(queryManager.createSegment).toHaveBeenCalled();
            expect(queryManager.createPath).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Path created successfully',
                data: expect.objectContaining({
                    pathId: "pathAuto",
                    visibility: true,
                    distanceKm: 0.5,
                }),
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("Should throw BadRequestError for invalid creation mode", async () => {
            const req = mockRequest('POST', '/api/paths');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                pathSegments: [
                    { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                ],
                visibility: true,
                creationMode: "invalid"
            };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().createPath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "INVALID_CREATION_MODE"
                })
            );
        });

    });

    describe("Testing getUserPaths method", () => {

        test("Should return all user paths", async () => {
            const req = mockRequest();
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockPaths = [
                {
                    pathId: "path1",
                    userId: "user123",
                    title: "Route 1",
                    description: "Description",
                    visibility: true,
                    status: "OPTIMAL",
                    origin: { lat: 45.4642, lng: 9.1900 },
                    destination: { lat: 45.4700, lng: 9.1950 },
                    distanceKm: 0.5,
                    createdAt: new Date(),
                    pathSegments: [
                        {
                            segmentId: "segment1",
                            nextSegmentId: null,
                            status: "OPTIMAL",
                            segment: {
                                polylineCoordinates: [
                                    { lat: 45.4642, lng: 9.1900 },
                                    { lat: 45.4700, lng: 9.1950 }
                                ]
                            }
                        }
                    ]
                }
            ];

            (queryManager.getPathsByUserId as jest.Mock).mockResolvedValue(mockPaths);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().getUserPaths(req, res, next);

            expect(queryManager.getPathsByUserId).toHaveBeenCalledWith("user123");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    count: 1,
                    paths: expect.arrayContaining([
                        expect.objectContaining({ pathId: "path1" })
                    ])
                })
            });
        });

        test("Should throw BadRequestError when user not authenticated", async () => {
            const req = mockRequest();

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().getUserPaths(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "UNAUTHORIZED"
                })
            );
        });

    });

    describe("Testing snapPath method", () => {

        test("Should snap coordinates successfully", async () => {
            const req = mockRequest('POST', '/api/paths/snap');
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {
                coordinates: [
                    { lat: 45.4642, lng: 9.1900 },
                    { lat: 45.4700, lng: 9.1950 }
                ]
            };

            const snappedCoords = [
                { lat: 45.4642, lng: 9.1900 },
                { lat: 45.4665, lng: 9.1920 },
                { lat: 45.4700, lng: 9.1950 }
            ];

            (snapToRoad as jest.Mock).mockResolvedValue(snappedCoords);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().snapPath(req, res, next);

            expect(snapToRoad).toHaveBeenCalledWith(req.body.coordinates);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    coordinates: snappedCoords
                }
            });
        });

        test("Should throw BadRequestError for less than 2 coordinates", async () => {
            const req = mockRequest();
            req.body = {
                coordinates: [{ lat: 45.4642, lng: 9.1900 }]
            };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().snapPath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_COORDINATES"
                })
            );
        });

    });

    describe("Testing deletePath method", () => {

        test("Should delete path successfully", async () => {
            const req = mockRequest();
            req.params = { pathId: "path1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockPath = {
                pathId: "path1",
                userId: "user123",
                status: "OPTIMAL",
                pathSegments: []
            };

            (queryManager.getPathById as jest.Mock).mockResolvedValue(mockPath);
            (queryManager.deletePathById as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().deletePath(req, res, next);

            expect(queryManager.deletePathById).toHaveBeenCalledWith("path1");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        test("Should throw ForbiddenError when deleting other user's path", async () => {
            const req = mockRequest();
            req.params = { pathId: "path1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };

            const mockPath = {
                pathId: "path1",
                userId: "otherUser",
                status: "OPTIMAL",
                pathSegments: []
            };

            (queryManager.getPathById as jest.Mock).mockResolvedValue(mockPath);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().deletePath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "FORBIDDEN"
                })
            );
            expect(queryManager.deletePathById).not.toHaveBeenCalled();
        });

        test("Should throw NotFoundError when path does not exist", async () => {
            const req = mockRequest();
            req.params = { pathId: "nonexistent" };
            req.user = { userId: "user123", iat: 0, exp: 0 };

            (queryManager.getPathById as jest.Mock).mockResolvedValue(null);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().deletePath(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: "NOT_FOUND"
                })
            );
        });

    });

    describe("Testing changePathVisibility method", () => {

        test("Should change visibility successfully", async () => {
            const req = mockRequest();
            req.params = { pathId: "path1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = { visibility: false };

            const mockPath = {
                pathId: "path1",
                userId: "user123",
                status: "OPTIMAL",
                visibility: true,
                pathSegments: []
            };

            (queryManager.getPathById as jest.Mock).mockResolvedValue(mockPath);
            (queryManager.changePathVisibility as jest.Mock).mockResolvedValue({});

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().changePathVisibility(req, res, next);

            expect(queryManager.changePathVisibility).toHaveBeenCalledWith("path1", false);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Path visibility updated successfully',
                data: {
                    pathId: "path1",
                    visibility: false
                }
            });
        });

        test("Should throw BadRequestError for missing visibility", async () => {
            const req = mockRequest();
            req.params = { pathId: "path1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = {};

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().changePathVisibility(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "MISSING_VISIBILITY"
                })
            );
        });

        test("Should throw ForbiddenError when changing other user's path", async () => {
            const req = mockRequest();
            req.params = { pathId: "path1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = { visibility: false };

            const mockPath = {
                pathId: "path1",
                userId: "otherUser",
                status: "OPTIMAL",
                pathSegments: []
            };

            (queryManager.getPathById as jest.Mock).mockResolvedValue(mockPath);

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().changePathVisibility(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    code: "FORBIDDEN"
                })
            );
        });

        test("Should throw BadRequestError for invalid visibility type", async () => {
            const req = mockRequest();
            req.params = { pathId: "path1" };
            req.user = { userId: "user123", iat: 0, exp: 0 };
            req.body = { visibility: "yes" };

            const res = mockResponse();
            const next = jest.fn();

            await new PathManager().changePathVisibility(req, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    code: "INVALID_VISIBILITY"
                })
            );
        });

    });

});
