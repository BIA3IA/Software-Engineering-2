import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/index.js";
import { TripSegments, TripStatistics, WeatherData, PathWithSegments, Coordinates } from "../../types/index.js";


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
    async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
        return await prisma.refreshToken.create({
            data: {
                userId,
                token: tokenHash,
                expiresAt,
            },
        });
    }

    // get refresh token
    async getRefreshToken(tokenHash: string) {
        return await prisma.refreshToken.findUnique({
            where: { token: tokenHash },
        });
    }

    // delete refresh token
    async deleteRefreshToken(tokenHash: string) {
        return await prisma.refreshToken.delete({
            where: { token: tokenHash },
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

        return trip as TripSegments | null;
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

        return trips as TripSegments[];
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
    async createPath(
        userId: string,
        origin: Coordinates,
        destination: Coordinates, 
        pathSegments: Array<{ segmentId: string; nextSegmentId: string | null }>,
        visibility: boolean,
        creationMode: string,
        title?: string | null,
        description?: string | null,
        distanceKm?: number | null
    ) {
        return await prisma.path.create({
            data: {
                userId,
                origin,
                destination,
                visibility,
                creationMode,
                title,
                description,
                distanceKm,
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
    async getPathById(pathId: string): Promise<PathWithSegments | null> {
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

        return path as PathWithSegments | null;
    }

    // get paths by user id
    async getPathsByUserId(userId: string): Promise<PathWithSegments[]> {
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

        return paths as PathWithSegments[];
    }

    // get path by segments given by the user
    async getPathByOriginDestination(
        userId: string, 
        origin: Coordinates, 
        destination: Coordinates
    ): Promise<PathWithSegments | null> {
        const tolerance = 0.00002; // approx 2 meter

        const paths = await prisma.path.findMany({
            where: { userId },
            include: {
                pathSegments: {
                    include: {
                        segment: true,
                    },
                },
            },
        });

        // find path matching origin and destination within tolerance
        const matchingPath = paths.find(path => {
            const pathOrigin = path.origin as Coordinates;
            const pathDestination = path.destination as Coordinates;

            const originMatch = 
                Math.abs(pathOrigin.lat - origin.lat) <= tolerance &&
                Math.abs(pathOrigin.lng - origin.lng) <= tolerance;

            const destinationMatch = 
                Math.abs(pathDestination.lat - destination.lat) <= tolerance &&
                Math.abs(pathDestination.lng - destination.lng) <= tolerance;

            return originMatch && destinationMatch;
        });

        if (!matchingPath) {
            return null;
        }

        return matchingPath as PathWithSegments;
    }

    async searchPathsByOriginDestination(userId?: string): Promise<PathWithSegments[]> {
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        return paths as PathWithSegments[];
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

    // update path status
    async updatePathStatus(pathId: string, status: string) {
        return await prisma.path.update({
            where: { pathId },
            data: { status } as Prisma.PathUpdateInput,
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

    // get segment by id
    async getSegmentById(segmentId: string) {
        return await prisma.segment.findUnique({
            where: { segmentId },
        });
    }

    // get path segment by id
    async getPathSegmentById(pathSegmentId: string) {
        return await prisma.pathSegment.findUnique({
            where: { id: pathSegmentId },
        });
    }

    // update path segment status
    async updatePathSegmentStatus(pathSegmentId: string, status: string) {
        return await prisma.pathSegment.update({
            where: { id: pathSegmentId },
            data: { status },
        });
    }

    // REPORTS

    // create report
    async createReport(data: {
        userId: string;
        pathSegmentId: string;
        tripId: string;
        obstacleType: string;
        pathStatus: string;
        position: any; // Coordinates JSON
        status: string;
    }) {
        return await prisma.report.create({
            data: {
                userId: data.userId,
                pathSegmentId: data.pathSegmentId,
                tripId: data.tripId,
                obstacleType: data.obstacleType,
                pathStatus: data.pathStatus,
                position: data.position,
                status: data.status,
            },
        });
    }

    // get report by id
    async getReportById(reportId: string) {
        return await prisma.report.findUnique({
            where: { reportId },
        });
    }

    // get reports by trip id
    async getReportsByTripId(tripId: string) {
        return await prisma.report.findMany({
            where: { tripId },
            include: {
                user: {
                    select: { username: true } // Identify reporter
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // get reports by path id
    async getReportsByPathId(pathId: string) {
        return await prisma.report.findMany({
            where: {
                pathSegment: {
                    pathId,
                },
            },
            include: {
                user: {
                    select: { username: true },
                },
                pathSegment: {
                    select: { pathId: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // get reports by path segment id
    async getReportsByPathSegmentId(pathSegmentId: string) {
        return await prisma.report.findMany({
            where: { pathSegmentId },
            orderBy: { createdAt: 'desc' },
        });
    }

}


export const queryManager = new QueryManager();
