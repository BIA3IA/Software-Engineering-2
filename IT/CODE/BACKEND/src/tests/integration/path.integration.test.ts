import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

const geocodeAddressMock = jest.fn();
const snapToRoadMock = jest.fn();

jest.mock("../../utils/prisma-client", () => ({
    __esModule: true,
    default: {
        segment: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        path: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        $queryRaw: jest.fn(),
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

jest.mock("../../services/index.js", () => ({
    geocodeAddress: geocodeAddressMock,
    snapToRoad: snapToRoadMock,
}));
jest.mock("../../services/index", () => ({
    geocodeAddress: geocodeAddressMock,
    snapToRoad: snapToRoadMock,
}));

import { app } from "../../server";
import prisma from "../../utils/prisma-client";

describe("Path Routes Integration Tests", () => {
    const assertStatus = (response: { status: number; body: unknown }, expected: number) => {
        if (response.status !== expected) {
            throw new Error(`Expected ${expected}, got ${response.status}: ${JSON.stringify(response.body)}`);
        }
    };

    const generateValidAccessToken = (userId: string) => {
        return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "15m" });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        process.env.JWT_SECRET = "test-access-secret";
        process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
        
        // Set default mock implementations to avoid undefined errors
        (prisma.path.findUnique as jest.Mock).mockReset();
        (prisma.path.findMany as jest.Mock).mockReset();
        (prisma.path.create as jest.Mock).mockReset();
        (prisma.path.update as jest.Mock).mockReset();
        (prisma.path.delete as jest.Mock).mockReset();
        (prisma.segment.create as jest.Mock).mockReset();
        (prisma.segment.findMany as jest.Mock).mockReset();
        (prisma.$queryRaw as jest.Mock).mockReset();
        geocodeAddressMock.mockReset();
        snapToRoadMock.mockReset();
    });

    describe("Testing POST /api/v1/paths", () => {

        test("Should create a manual path successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockSegment = {
                segmentId: "segment1",
                status: "OPTIMAL",
                polylineCoordinates: [
                    { lat: 45.4642, lng: 9.1900 },
                    { lat: 45.4700, lng: 9.1950 }
                ],
                createdAt: new Date()
            };

            const mockPathSegments = [
                {
                    segmentId: "segment1",
                    nextSegmentId: null,
                    pathId: "path1",
                    segment: mockSegment
                }
            ];

            const mockPath = {
                pathId: "path1",
                userId: "user123",
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                visibility: true,
                creationMode: "manual",
                createdAt: new Date(),
                title: "Test Path",
                description: "Test description",
                distanceKm: 0.64,
                pathSegments: mockPathSegments
            };

            // Mock sequence for path creation flow:
            // 1. createSegment - called by path manager for each segment
            (prisma.segment.create as jest.Mock).mockResolvedValue(mockSegment);
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
            
            // 2. getPathByOriginDestination - uses findMany to check existing paths
            (prisma.path.findMany as jest.Mock).mockResolvedValueOnce([]);
            
            // 3. createPath - creates the path
            (prisma.path.create as jest.Mock).mockResolvedValue(mockPath);
            
            // 4. getPathById - final call to get updated path
            (prisma.path.findUnique as jest.Mock).mockResolvedValueOnce(mockPath);

            const response = await request(app)
                .post("/api/v1/paths")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    pathSegments: [
                        { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                    ],
                    visibility: true,
                    creationMode: "manual",
                    title: "Test Path",
                    description: "Test description"
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("pathId");
        });

        test("Should return 401 for missing access token", async () => {
            const response = await request(app)
                .post("/api/v1/paths")
                .send({
                    pathSegments: [
                        { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                    ],
                    visibility: true,
                    creationMode: "manual",
                    title: "Test Path",
                    description: "Test description"
                });

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("ACCESS_TOKEN_MISSING");
        });

        test("Should return 400 for missing required fields", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .post("/api/v1/paths")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    pathSegments: [
                        { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                    ]
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("Should return 409 when path already exists", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockSegment = {
                segmentId: "segment1",
                status: "OPTIMAL",
                polylineCoordinates: [
                    { lat: 45.4642, lng: 9.1900 },
                    { lat: 45.4700, lng: 9.1950 }
                ],
                createdAt: new Date()
            };

            const existingPath = {
                pathId: "existing1",
                userId: "user123",
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                pathSegments: [
                    {
                        segmentId: "segment1",
                        nextSegmentId: null,
                        segment: mockSegment
                    }
                ]
            };

            // Mock sequence:
            // 1. createSegment - called first
            (prisma.segment.create as jest.Mock).mockResolvedValue(mockSegment);
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);
            
            // 2. getPathByOriginDestination - uses findMany and should return existing path
            (prisma.path.findMany as jest.Mock).mockResolvedValue([existingPath]);

            const response = await request(app)
                .post("/api/v1/paths")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    pathSegments: [
                        { start: { lat: 45.4642, lng: 9.1900 }, end: { lat: 45.4700, lng: 9.1950 } }
                    ],
                    visibility: true,
                    creationMode: "manual",
                    title: "Existing Path",
                    description: "Existing description"
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

    });

    describe("Testing GET /api/v1/paths/search", () => {

        test("Should return 400 when origin is missing", async () => {
            const response = await request(app)
                .get("/api/v1/paths/search")
                .query({
                    destination: "Stazione Centrale, Milano"
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("Should return 400 when destination is missing", async () => {
            const response = await request(app)
                .get("/api/v1/paths/search")
                .query({
                    origin: "Piazza Duomo, Milano"
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

        test("Should find matching public paths", async () => {
            const mockPath = {
                pathId: "path1",
                userId: "user456",
                title: "Public Route",
                description: "A public cycling route",
                visibility: true,
                origin: { lat: 45.4642, lng: 9.1900 },
                destination: { lat: 45.4700, lng: 9.1950 },
                distanceKm: 0.64,
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
            };

            geocodeAddressMock.mockResolvedValueOnce({ lat: 45.4642, lng: 9.1900 });
            geocodeAddressMock.mockResolvedValueOnce({ lat: 45.4700, lng: 9.1950 });
            (prisma.path.findMany as jest.Mock).mockResolvedValue([mockPath]);

            const originQuery = encodeURIComponent("Piazza Duomo, Milano");
            const destinationQuery = encodeURIComponent("Stazione Centrale, Milano");
            const response = await request(app)
                .get(`/api/v1/paths/search?origin=${originQuery}&destination=${destinationQuery}`);

            assertStatus(response, 200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBeGreaterThan(0);
            expect(response.body.data.paths[0]).toHaveProperty("pathId");
        });

        test("Should return 200 with empty list when no paths found", async () => {
            geocodeAddressMock.mockResolvedValueOnce({ lat: 45.4642, lng: 9.1900 });
            geocodeAddressMock.mockResolvedValueOnce({ lat: 45.4700, lng: 9.1950 });
            (prisma.path.findMany as jest.Mock).mockResolvedValue([]);

            const originQuery = encodeURIComponent("Nonexistent Place");
            const destinationQuery = encodeURIComponent("Another Nonexistent Place");
            const response = await request(app)
                .get(`/api/v1/paths/search?origin=${originQuery}&destination=${destinationQuery}`);

            assertStatus(response, 200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(0);
            expect(response.body.data.paths).toEqual([]);
        });

    });

    describe("Testing POST /api/v1/paths/snap", () => {

        test("Should snap coordinates to road successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const snappedCoords = [
                { lat: 45.4642, lng: 9.1900 },
                { lat: 45.4665, lng: 9.1920 },
                { lat: 45.4700, lng: 9.1950 }
            ];

            snapToRoadMock.mockResolvedValue(snappedCoords);

            const response = await request(app)
                .post("/api/v1/paths/snap")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    coordinates: [
                        { lat: 45.4642, lng: 9.1900 },
                        { lat: 45.4700, lng: 9.1950 }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.coordinates).toHaveLength(3);
        });

        test("Should return 400 for less than 2 coordinates", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .post("/api/v1/paths/snap")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    coordinates: [{ lat: 45.4642, lng: 9.1900 }]
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

    });

    describe("Testing GET /api/v1/paths?owner=me", () => {

        test("Should return all user paths", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockPaths = [
                {
                    pathId: "path1",
                    userId: "user123",
                    title: "My Route",
                    description: "My cycling route",
                    visibility: true,
                    origin: { lat: 45.4642, lng: 9.1900 },
                    destination: { lat: 45.4700, lng: 9.1950 },
                    distanceKm: 0.64,
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

            (prisma.path.findMany as jest.Mock).mockResolvedValue(mockPaths);

            const response = await request(app)
                .get("/api/v1/paths?owner=me")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(1);
            expect(response.body.data.paths[0]).toHaveProperty("pathId", "path1");
        });

        test("Should return empty array when user has no paths", async () => {
            const accessToken = generateValidAccessToken("user123");

            (prisma.path.findMany as jest.Mock).mockResolvedValue([]);

            const response = await request(app)
                .get("/api/v1/paths?owner=me")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.count).toBe(0);
            expect(response.body.data.paths).toEqual([]);
        });

        test("Should return 401 for missing access token", async () => {
            const response = await request(app)
                .get("/api/v1/paths?owner=me");

            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe("ACCESS_TOKEN_MISSING");
        });

        test("Should return 403 for invalid access token", async () => {
            const response = await request(app)
                .get("/api/v1/paths?owner=me")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("INVALID_ACCESS_TOKEN");
        });

    });

    describe("Testing DELETE /api/v1/paths/:pathId", () => {

        test("Should delete path successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockPath = {
                pathId: "path1",
                userId: "user123",
                pathSegments: []
            };

            (prisma.path.findUnique as jest.Mock).mockResolvedValue(mockPath);
            (prisma.path.delete as jest.Mock).mockResolvedValue(mockPath);

            const response = await request(app)
                .delete("/api/v1/paths/path1")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(204);
        });

        test("Should return 403 when deleting other user's path", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockPath = {
                pathId: "path1",
                userId: "otherUser",
                pathSegments: []
            };

            (prisma.path.findUnique as jest.Mock).mockResolvedValue(mockPath);

            const response = await request(app)
                .delete("/api/v1/paths/path1")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("FORBIDDEN");
        });

        test("Should return 404 when path does not exist", async () => {
            const accessToken = generateValidAccessToken("user123");

            (prisma.path.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app)
                .delete("/api/v1/paths/nonexistent")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("NOT_FOUND");
        });

    });

    describe("Testing PATCH /api/v1/paths/:pathId/visibility", () => {

        test("Should change visibility successfully", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockPath = {
                pathId: "path1",
                userId: "user123",
                visibility: true,
                pathSegments: []
            };

            (prisma.path.findUnique as jest.Mock).mockResolvedValue(mockPath);
            (prisma.path.update as jest.Mock).mockResolvedValue({ ...mockPath, visibility: false });

            const response = await request(app)
                .patch("/api/v1/paths/path1/visibility")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ visibility: false });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.visibility).toBe(false);
        });

        test("Should return 403 when changing other user's path", async () => {
            const accessToken = generateValidAccessToken("user123");

            const mockPath = {
                pathId: "path1",
                userId: "otherUser",
                pathSegments: []
            };

            (prisma.path.findUnique as jest.Mock).mockResolvedValue(mockPath);

            const response = await request(app)
                .patch("/api/v1/paths/path1/visibility")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ visibility: false });

            expect(response.status).toBe(403);
            expect(response.body.error.code).toBe("FORBIDDEN");
        });

        test("Should return 400 for missing visibility field", async () => {
            const accessToken = generateValidAccessToken("user123");

            const response = await request(app)
                .patch("/api/v1/paths/path1/visibility")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("VALIDATION_ERROR");
        });

    });

});
