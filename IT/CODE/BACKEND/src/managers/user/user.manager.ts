import { queryManager } from "../query/index.js";

export class UserManager {
    async createUser(data: {email: string, password: string; name?: string}) {

    const user = await queryManager.createUser(data);

    // exclude password from returned user object
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
    }
}

export const userManager = new UserManager();
