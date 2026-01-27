import { queryManager } from "../query/index.js";
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError, BadRequestError, ConflictError} from "../../errors/index.js";
import bcrypt from 'bcrypt';
import { UpdateProfilePayload } from "../../types/index.js";

export class UserManager {
    
    // Handle user registration. Checks for existing user/email, hashes password, creates user.
    // Responds with created user info (excluding password).
    // Uses bcrypt to hash passwords before storing.
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, username, systemPreferences } = req.body;

            if (!email || !password || !username) {
                return next(new BadRequestError('Email, password and username are required', 'MISSING_CREDENTIALS'));
            }

            const existingUser = await queryManager.getUserByEmail(email);
            if (existingUser) {
                return next(new ConflictError('Email already in use', 'EMAIL_ALREADY_IN_USE'));
            }

            const existingUsername = await queryManager.getUserByUsername(username);
            if (existingUsername) {
                return next(new ConflictError('Username already in use', 'USERNAME_ALREADY_IN_USE'));
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await queryManager.createUser(email, hashedPassword, username, systemPreferences);

            res.status(201).json({
                success: true,
                user: {
                    userId: user.userId,
                    email: user.email,
                    username: user.username,
                    systemPreferences: user.systemPreferences
                }
            });
        } catch (error) {
            next(error);
        }
    }

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
                    systemPreferences: user.systemPreferences
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Logic to update user profile
    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;            
            const { username, email, currentPassword, password, systemPreferences } = req.body as UpdateProfilePayload;

            if (!userId) {
                throw new UnauthorizedError('Unauthorized', 'USER_NOT_AUTHENTICATED');
            }

            if (!username && !email && !password && !systemPreferences) {
                throw new BadRequestError('No fields to update', 'EMPTY_PAYLOAD');
            }

            const user = await queryManager.getUserById(userId);
            if (!user) {
                throw new NotFoundError('User not found', 'USER_NOT_FOUND');
            }

            // Check for email/username conflicts
            if (username !== undefined) {
                const existing = await queryManager.getUserByUsername(username);
                if (existing && existing.userId !== userId) {
                    throw new ConflictError('Username already in use', 'USERNAME_ALREADY_IN_USE');
                }
            }

            if (email !== undefined) {
                const existing = await queryManager.getUserByEmail(email);
                if (existing && existing.userId !== userId) {
                    throw new ConflictError('Email already in use', 'EMAIL_ALREADY_IN_USE');
                }
            }


            if (password !== undefined) {
                if (!currentPassword) {
                    throw new BadRequestError(
                        'Current password is required to set a new password',
                        'CURRENT_PASSWORD_REQUIRED'
                    );
                }

                const matches = await bcrypt.compare(currentPassword, user.password);
                if (!matches) {
                    throw new BadRequestError('Current password is incorrect', 'INCORRECT_PASSWORD');
                }
            }

            let hashedPassword: string | undefined;
            if (password !== undefined) {
                hashedPassword = await bcrypt.hash(password, 10);
            }

            await queryManager.updateUserProfile(userId, {
                username,
                email,
                password: hashedPassword,
                systemPreferences,
            });

            res.json({
                success: true,
                message: 'Profile updated successfully',
            });

        } catch (error) {
            next(error);
        }
    }

}

export const userManager = new UserManager();
