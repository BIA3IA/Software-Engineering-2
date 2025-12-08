import { NextFunction, Request, Response } from 'express';
import { queryManager } from "../query/index.js";
import bcrypt from 'bcrypt';
import { generateTokens, verifyRefreshToken } from "../../middleware/jwt.auth.js";
import { UnauthorizedError, BadRequestError, NotFoundError, ForbiddenError } from '../../errors/app.errors.js';

export class AuthManager {
    
    // Handle user login. Generates access and refresh tokens, saves refresh token in DB, sets cookies.
    // Cookies are set to httpOnly and secure in production for security.
    // Responds with user info on successful login (maybe to be changed i don't know at the moment).
    // Uses bcrypt to compare hashed passwords.
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return next(new BadRequestError('Email and password are required', 'MISSING_CREDENTIALS'));
            }

            const user = await queryManager.getUserByEmail(email);
            if (!user) {
                return next(new NotFoundError('User not found', 'USER_NOT_FOUND'));
            }

            // Compare hashed passwords
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return next(new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS'));
            }

            const { accessToken, refreshToken } = generateTokens(user.userId);

            // Save refresh token to database. Set expiration to 1 hour from now.
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            await queryManager.createRefreshToken( user.userId, refreshToken, expiresAt);

            res.json({
                success: true,
                user: {
                    userId: user.userId,
                    email: user.email,
                    username: user.username
                },
                // Since our frontend is an app, we return tokens in response body instead of cookies,
                // then the app can store them as needed (e.g. secure storage) and send them in Authorization headers (Bearer).
                tokens: {
                    accessToken,
                    refreshToken
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Handle user logout. Deletes refresh token from DB.
    // Avoid to let user logout if no refresh token is present (should we?)
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = req.body.refreshToken;

            if (!refreshToken) {
                return next(new UnauthorizedError('No refresh token provided', 'MISSING_REFRESH_TOKEN'));
            }

            await queryManager.deleteRefreshToken(refreshToken);
            
            res.status(204).json({ });
        } catch (error) {
            next(error);
        }
    }

    // Handle token refresh. Verifies old refresh token, generates new tokens, updates DB and cookies.
    // Responds with success message on successful refresh. 
    // Ensures old refresh token is deleted from DB to prevent reuse.
    // Verifies both JWT validity and database existence/expiration of the refresh token.
    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const oldRefreshToken = req.body.refreshToken;

            if (!oldRefreshToken) {
                return next(new UnauthorizedError('Refresh token required', 'MISSING_REFRESH_TOKEN'));
            }

            // Verify JWT signature and expiration
            let decoded;
            try {
                decoded = verifyRefreshToken(oldRefreshToken);
            } catch (error) {
                return next(new ForbiddenError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN'));
            }

            // Check if token exists in database
            const tokenData = await queryManager.getRefreshToken(oldRefreshToken);
            
            if (!tokenData) {
                return next(new ForbiddenError('Refresh token not found', 'REFRESH_TOKEN_NOT_FOUND'));
            }

            // Check database expiration
            if (tokenData.expiresAt < new Date()) {
                await queryManager.deleteRefreshToken(oldRefreshToken);
                return next(new ForbiddenError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED'));
            }

            const user = await queryManager.getUserById(decoded.userId);
            if (!user) {
                return next(new NotFoundError('User not found', 'USER_NOT_FOUND'));
            }

            // Delete old refresh token
            await queryManager.deleteRefreshToken(oldRefreshToken);

            // Generate new tokens
            const { accessToken, refreshToken } = generateTokens(user.userId);

            // Save new refresh token
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            await queryManager.createRefreshToken(user.userId, refreshToken, expiresAt);

            res.json({ 
                success: true, 
                message: 'Tokens refreshed successfully', 
                tokens: { 
                    accessToken, 
                    refreshToken 
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const authManager = new AuthManager();