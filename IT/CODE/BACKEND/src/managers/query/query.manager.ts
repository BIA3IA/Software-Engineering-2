import prisma from "../../utils/prisma-client.js";

export class QueryManager {

    async createUser(data: {email: string, password: string; name?: string}) {
        return await prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                name: data.name || null,
            },
        });
    }
}

export const queryManager = new QueryManager();