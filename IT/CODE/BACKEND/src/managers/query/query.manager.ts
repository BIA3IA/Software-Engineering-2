import { sortTripSegmentsByChain, sortPathSegmentsByChain, prisma } from "../../utils/index.js";
import { TripSegments, WeatherData, PathSegments, Coordinates} from "../../types/index.js";


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
    async createPath(...){ origin: Coordinates, destination: Coordinates ...
    }

    // get path by id with segments
    async getPathById(pathId: string): Promise<PathSegments | null> {
        const path = await prisma.path.findUnique({
            where: { pathId },
            include: {
                pathSegments: true,
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

    // update path score
    async updatePathScore(pathId: string, score: number) {
        return await prisma.path.update({
            where: { pathId },
            data: { score },
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

}

export const queryManager = new QueryManager();