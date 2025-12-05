import { queryManager } from "../query/index.js";
import { Request, Response } from 'express';

export class UserManager {
    
    // Logic to get user profile from the database using userId from the JWT payload (at the moment with fake data)
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const user = await queryManager.getUserById(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                data: {
                    bio: 'Is this working?',
                    trips: 'Yes it is',
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

}

export const userManager = new UserManager();
