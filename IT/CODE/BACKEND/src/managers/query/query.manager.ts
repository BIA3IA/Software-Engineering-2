import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/index.js";
import { TripSegments, TripStatistics, WeatherData, PathWithSegments, Coordinates } from "../../types/index.js";
import { SEGMENT_MATCH_TOLERANCE_DEG } from "../../constants/appConfig.js";


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

    async getSegmentsByPolylineCoordinates(segments: Coordinates[][]) {
        const tolerance = SEGMENT_MATCH_TOLERANCE_DEG;
        const result = new Map<string, string>();

        await Promise.all(
            segments.map(async (polyline) => {
                if (polyline.length < 2) {
                    return;
                }
                const start = polyline[0];
                const end = polyline[polyline.length - 1];
                const rows = await prisma.$queryRaw<
                    Array<{ segmentId: string; polylineCoordinates: Coordinates[] }>
                >(Prisma.sql`
                    SELECT "segmentId", "polylineCoordinates"
                    FROM "Segment"
                    WHERE jsonb_array_length("polylineCoordinates") = 2
                      AND (
                        (
                          abs(("polylineCoordinates"->0->>'lat')::double precision - ${start.lat}) <= ${tolerance}
                          AND abs(("polylineCoordinates"->0->>'lng')::double precision - ${start.lng}) <= ${tolerance}
                          AND abs(("polylineCoordinates"->1->>'lat')::double precision - ${end.lat}) <= ${tolerance}
                          AND abs(("polylineCoordinates"->1->>'lng')::double precision - ${end.lng}) <= ${tolerance}
                        )
                        OR
                        (
                          abs(("polylineCoordinates"->0->>'lat')::double precision - ${end.lat}) <= ${tolerance}
                          AND abs(("polylineCoordinates"->0->>'lng')::double precision - ${end.lng}) <= ${tolerance}
                          AND abs(("polylineCoordinates"->1->>'lat')::double precision - ${start.lat}) <= ${tolerance}
                          AND abs(("polylineCoordinates"->1->>'lng')::double precision - ${start.lng}) <= ${tolerance}
                        )
                      )
                    LIMIT 1
                `);

                if (rows[0]) {
                    result.set(JSON.stringify(polyline), rows[0].segmentId);
                }
            })
        );

        return result;
    }

    // get path segment by id
    async getPathSegmentById(pathSegmentId: string) {
        return await prisma.pathSegment.findUnique({
            where: { id: pathSegmentId },
        });
    }

    async getPathSegmentByPathAndSegment(pathId: string, segmentId: string) {
        return await prisma.pathSegment.findFirst({
            where: {
                pathId,
                segmentId,
            },
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
        segmentId: string;
        tripId?: string | null;
        sessionId?: string | null;
        obstacleType: string;
        pathStatus: string;
        position: any; // Coordinates JSON
        status: string;
    }) {
        return await prisma.report.create({
            data: {
                userId: data.userId,
                segmentId: data.segmentId,
                tripId: data.tripId ?? null,
                sessionId: data.sessionId ?? null,
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

    // get reports by path id
    async getReportsByPathId(pathId: string) {
        const pathSegments = await prisma.pathSegment.findMany({
            where: { pathId },
            select: { segmentId: true },
        });
        const segmentIds = pathSegments.map(ps => ps.segmentId);
        if (!segmentIds.length) {
            return [];
        }
        return await prisma.report.findMany({
            where: {
                segmentId: {
                    in: segmentIds,
                },
            },
            include: {
                user: {
                    select: { username: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getRecentReportByUserAndSegment(userId: string, segmentId: string, since: Date) {
        return await prisma.report.findFirst({
            where: {
                userId,
                segmentId,
                createdAt: {
                    gte: since,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                reportId: true,
                createdAt: true,
            },
        });
    }

    async countReportsByUserSince(userId: string, since: Date) {
        return await prisma.report.count({
            where: {
                userId,
                createdAt: {
                    gte: since,
                },
            },
        });
    }

    // get reports by segment id
    async getReportsBySegmentId(segmentId: string) {
        return await prisma.report.findMany({
            where: { segmentId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getReportsBySegmentIds(segmentIds: string[], statuses?: string[]) {
        if (!segmentIds.length) {
            return [];
        }
        return await prisma.report.findMany({
            where: {
                segmentId: {
                    in: segmentIds,
                },
                ...(statuses?.length
                    ? {
                          status: {
                              in: statuses,
                          },
                      }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getPathSegmentsBySegmentId(segmentId: string) {
        return await prisma.pathSegment.findMany({
            where: { segmentId },
        });
    }

    async attachReportsToTrip(userId: string, sessionId: string, tripId: string) {
        const result = await prisma.report.updateMany({
            where: {
                userId,
                sessionId,
            },
            data: {
                tripId,
            },
        });

        return result.count;
    }
    async getStatByTripId(tripId: string) {
        return await prisma.stat.findUnique({
            where: { tripId }
        });
    }

    /**
     * UC20: Persists a newly computed per-trip metric
     */
    async createStatRecord(data: { 
        tripId: string; 
        userId: string; 
        avgSpeed: number; 
        duration: number; 
        kilometers: number 
    }) {
        return await prisma.stat.create({
            data: {
                tripId: data.tripId,
                userId: data.userId,
                avgSpeed: data.avgSpeed,
                duration: data.duration,
                kilometers: data.kilometers
            }
        });
    }

    /**
     * UC22: Fetches all individual stat records for a user to calculate averages
     */
    async getAllStatsByUserId(userId: string) {
        return await prisma.stat.findMany({
            where: { userId }
        });
    }

    // --- OVERALL STAT METHODS (Aggregates) ---

    /**
     * UC22: State-aware trigger - gets current number of trips
     */
    async getTripCountByUserId(userId: string): Promise<number> {
        return await prisma.trip.count({
            where: { userId }
        });
    }

    /**
     * UC22: Retrieves the cached global averages
     */
    async getOverallStatsByUserId(userId: string) {
        return await prisma.overallStat.findUnique({
            where: { userId }
        });
    }

    /**
     * UC22: Updates or creates the global average record
     */
    async upsertOverallStats(
        userId: string, 
        data: { 
            avgSpeed: number; 
            avgDuration: number; 
            avgKilometers: number; 
            lastTripCount: number 
        }
    ) {
        return await prisma.overallStat.upsert({
            where: { userId },
            update: {
                avgSpeed: data.avgSpeed,
                avgDuration: data.avgDuration,
                avgKilometers: data.avgKilometers,
                lastTripCount: data.lastTripCount,
                updatedAt: new Date()
            },
            create: {
                userId,
                avgSpeed: data.avgSpeed,
                avgDuration: data.avgDuration,
                avgKilometers: data.avgKilometers,
                lastTripCount: data.lastTripCount
            }
        });
    }

    async updateTripDistance(tripId: string, distanceKm: number): Promise<void> {
        await prisma.trip.update({
            where: { tripId },
            data: { distanceKm },
        });
    }

}



export const queryManager = new QueryManager();