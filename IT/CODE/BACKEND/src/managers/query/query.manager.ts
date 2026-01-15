import { Prisma } from "@prisma/client";
import { sortTripSegmentsByChain, sortPathSegmentsByChain, prisma } from "../../utils/index.js";
import { TripSegments, TripStatistics, WeatherData, PathSegments, Coordinates } from "../../types/index.js";
import { haversineDistanceMeters } from "../../utils/geo.js";


export class QueryManager {

    // CRUD methods to create a new user
    
    // create user
    async createUser(email: string, password: string, username: string, systemPreferences: string[] ) {
        return await prisma.user.create({
            data: {
                email,
                password,
                username,
                systemPreferences,
            },
        });
    }

    // read by email
    async getUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: { email },
        });
    }

    // read by id, string because is a cuid
    async getUserById(id: string) {
        return await prisma.user.findUnique({
            where: { userId: id },
        });
    }

    // read by username
    async getUserByUsername(username: string) {
        return await prisma.user.findUnique({
            where: { username },
        });
    }

    // update user profile
    async updateUserProfile(userId: string, data: {
        username?: string;
        email?: string;
        password?: string;
        systemPreferences?: string[];
    }) {
        return await prisma.user.update({
            where: { userId },
            data: {
                ...(data.username && { username: data.username }), // avoid overwriting with undefined
                ...(data.email && { email: data.email }),
                ...(data.password && { password: data.password }),
                ...(data.systemPreferences && { systemPreferences: data.systemPreferences }),
            },
        });
    }

    // CRUD methods to manage refresh tokens

    // create refresh token
    async createRefreshToken(userId: string, token: string, expiresAt: Date) {
        return await prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    // get refresh token
    async getRefreshToken(token: string) {
        return await prisma.refreshToken.findUnique({
            where: { token },
        });
    }

    // delete refresh token
    async deleteRefreshToken(token: string) {
        return await prisma.refreshToken.delete({
            where: { token },
        });
    }

    // TRIP

    // get trip by id with segments
    async getTripById(tripId: string): Promise<TripSegments | null> {
        const trip = await prisma.trip.findUnique({
            where: { tripId },
            include: {
                tripSegments: {
                    include: { segment: true },
                },
            },
        });

        if (!trip) {
            return null;
        }

        return {
            ...trip,
            tripSegments: sortTripSegmentsByChain(trip.tripSegments),
        };
    }

    // create trip
    async createTrip(
        userId: string,
        origin: Coordinates,
        destination: Coordinates,
        startedAt: Date,
        finishedAt: Date,
        statistics: TripStatistics | null,
        tripSegments: Array<{ segmentId: string; nextSegmentId: string | null }>,
        title?: string | null
    ) {
        return await prisma.trip.create({
            data: {
                userId,
                origin,
                destination,
                startedAt,
                finishedAt,
                title,
                statistics: statistics ?? Prisma.JsonNull,
                tripSegments: {
                    create: tripSegments.map(seg => ({
                        segmentId: seg.segmentId,
                        nextSegmentId: seg.nextSegmentId,
                    })),
                },
            },
            include: {
                tripSegments: {
                    include: { segment: true },
                },
            },
        });
    }

    // get trips by user id
    async getTripsByUserId(userId: string): Promise<TripSegments[]> {
        const trips = await prisma.trip.findMany({
            where: { userId },
            include: {
                tripSegments: {
                    include: { segment: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return trips.map(trip => ({
            ...trip,
            tripSegments: sortTripSegmentsByChain(trip.tripSegments),
        }));
    }

    // delete trip by id
    async deleteTripById(tripId: string) {
        return await prisma.trip.delete({
            where: { tripId },
        });
    }

    // WEATHER

    // update trip weather data
    async updateTripWeather(tripId: string, weather: WeatherData) {
        return await prisma.trip.update({
            where: { tripId },
            data: { weather },
        });
    }

    // PATH

    // create path
    async createPath(userId: string, origin: Coordinates, destination: Coordinates, 
                        pathSegments: Array<{ segmentId: string; nextSegmentId: string | null }>,
                        visibility: boolean, creationMode: string, title?: string | null, description?: string | null) {
        return await prisma.path.create({
            data: {
                userId,
                origin,
                destination,
                visibility,
                creationMode,
                title,
                description,
                pathSegments: {
                    create: pathSegments.map(seg => ({
                        segmentId: seg.segmentId,
                        nextSegmentId: seg.nextSegmentId,
                    })),
                },
            },
            include: {
                pathSegments: {
                    include: {
                        segment: true,
                    },
                },
            },
        });
    }

    // get path by id with segments

    // get path by id with segments
    async getPathById(pathId: string): Promise<PathSegments | null> {
        const path = await prisma.path.findUnique({
            where: { pathId },
            include: {
                pathSegments: {
                    include: {
                        segment: true,
                    },
                },
            },
        });

        if (!path) {
            return null;
        }

        return {
            ...path,
            pathSegments: sortPathSegmentsByChain(path.pathSegments),
        };
    }

    // get paths by user id
    async getPathsByUserId(userId: string): Promise<PathSegments[]> {
        const paths = await prisma.path.findMany({
            where: { userId },
            include: {
                pathSegments: {
                    include: {
                        segment: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return paths.map(path => ({
            ...path,
            pathSegments: sortPathSegmentsByChain(path.pathSegments),
        }));
    }

    async searchPathsByOriginDestination(origin: Coordinates, destination: Coordinates, userId?: string): Promise<PathSegments[]> {
        // Tolerance radius in degrees (approximately 200m)
        const tolerance = 0.002;
        const maxDistanceMeters = 200;
        const nearDistanceBufferMeters = 50;

        const paths = await prisma.path.findMany({
            where: {
                OR: [
                    { visibility: true },
                    ...(userId ? [{ userId, visibility: false }] : []),
                ],
            },
            include: {
                pathSegments: {
                    include: {
                        segment: true,
                    },
                },
            },
            orderBy: [
                { score: { sort: 'desc', nulls: 'last' } },
                { createdAt: 'desc' },
            ],
        });

        // Filter paths that match origin and destination within tolerance
        const matchingPaths: Array<{ path: PathSegments; maxDistance: number }> = [];

        for (const path of paths) {
            const pathOrigin = path.origin;
            const pathDestination = path.destination;

            const originMatch =
                Math.abs(pathOrigin.lat - origin.lat) <= tolerance &&
                Math.abs(pathOrigin.lng - origin.lng) <= tolerance;

            const destinationMatch =
                Math.abs(pathDestination.lat - destination.lat) <= tolerance &&
                Math.abs(pathDestination.lng - destination.lng) <= tolerance;

            if (!originMatch || !destinationMatch) {
                continue;
            }

            const originDistance = haversineDistanceMeters(origin, pathOrigin);
            const destinationDistance = haversineDistanceMeters(destination, pathDestination);
            const maxDistance = Math.max(originDistance, destinationDistance);

            matchingPaths.push({
                path,
                maxDistance,
            });
        }

        if (!matchingPaths.length) {
            return [];
        }

        const minDistance = Math.min(...matchingPaths.map(entry => entry.maxDistance));
        const distanceCutoff = Math.min(maxDistanceMeters, minDistance + nearDistanceBufferMeters);

        const filteredByDistance = matchingPaths
            .filter(entry => entry.maxDistance <= distanceCutoff)
            .sort((a, b) => a.maxDistance - b.maxDistance)
            .map(entry => entry.path);

        return filteredByDistance.map(path => ({
            ...path,
            pathSegments: sortPathSegmentsByChain(path.pathSegments),
        }));
    }

    // update path score
    async updatePathScore(pathId: string, score: number) {
        return await prisma.path.update({
            where: { pathId },
            data: { score },
        });
    }

    // update path status
    async updatePathStatus(pathId: string, status: string) {
        return await prisma.path.update({
            where: { pathId },
            data: { status },
        });
    }

    // delete path by id
    async deletePathById(pathId: string) {
        return await prisma.path.delete({
            where: { pathId },
        });
    }

    // change path visibility
    async changePathVisibility(pathId: string, visibility: boolean) {
        return await prisma.path.update({
            where: { pathId },
            data: { visibility },
        });
    }

    // create segment
    async createSegment(status: string, polylineCoordinates: Coordinates[]) {
        return await prisma.segment.create({
            data: {
                status,
                polylineCoordinates,
            },
        });
    }

    // create segment with provided id
    async createSegmentWithId(segmentId: string, status: string, polylineCoordinates: Coordinates[]) {
        return await prisma.segment.create({
            data: {
                segmentId,
                status,
                polylineCoordinates,
            },
        });
    }

    // get segments by ids
    async getSegmentsByIds(segmentIds: string[]) {
        return await prisma.segment.findMany({
            where: {
                segmentId: {
                    in: segmentIds,
                },
            },
            select: {
                segmentId: true,
            },
        });
    }


    // get segment statistics for path status calculation
    async getSegmentStatistics(segmentIds: string[]) {
        return await prisma.segment.findMany({
            where: {
                segmentId: {
                    in: segmentIds,
                },
            },
            select: {
                segmentId: true,
                status: true,
                createdAt: true,
            },
        });
    }

}

export const queryManager = new QueryManager();
