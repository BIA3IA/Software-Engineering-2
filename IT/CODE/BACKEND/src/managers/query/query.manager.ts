import { sortSegmentsByChain, prisma } from "../../utils/index";
import { TripSegments, WeatherData} from "../../types/index";


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
            tripSegments: sortSegmentsByChain(trip.tripSegments),
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

}

export const queryManager = new QueryManager();