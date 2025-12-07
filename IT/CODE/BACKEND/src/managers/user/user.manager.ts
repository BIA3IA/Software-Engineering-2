import { queryManager } from "../query/index.js";
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError } from "../../errors/app.errors.js";

export class UserManager {
    
    // Logic to get user profile from the database using userId from the JWT payload
    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new UnauthorizedError('Unauthorized', 'USER_NOT_AUTHENTICATED');
            }

            const user = await queryManager.getUserById(userId);
            
            if (!user) {
                throw new NotFoundError('User not found', 'USER_NOT_FOUND');
            }

            res.json({
                success: true,
                data: {
                    userId: user.userId,
                    email: user.email,
                    username: user.username,
                }
            });
        } catch (error) {
            next(error);
        }
    }

}

export const userManager = new UserManager();
