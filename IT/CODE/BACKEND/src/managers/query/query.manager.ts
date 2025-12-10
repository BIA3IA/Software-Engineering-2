import prisma from "../../utils/prisma-client.js";

export class QueryManager {

    // CRUD methods to create a new user
    
    // create user
    async createUser(email: string, password: string, username: string) {
        return await prisma.user.create({
            data: {
                email,
                password,
                username,
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

}

export const queryManager = new QueryManager();