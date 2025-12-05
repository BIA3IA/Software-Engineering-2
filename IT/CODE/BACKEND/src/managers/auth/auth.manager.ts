import { Request, Response } from 'express';
import { queryManager } from "../query/index.js";
import bcrypt from 'bcrypt';
import { generateTokens, verifyRefreshToken } from "../../middleware/jwt.auth.js";

export class AuthManager {
    
    // Handle user login. Generates access and refresh tokens, saves refresh token in DB, sets cookies.
    // Cookies are set to httpOnly and secure in production for security.
    // Responds with user info on successful login (maybe to be changed i don't know at the moment).
    // Uses bcrypt to compare hashed passwords.
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const user = await queryManager.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Compare hashed passwords
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const { accessToken, refreshToken } = generateTokens(user.userId);

            // Save refresh token to database. Set expiration to 1 hour from now.
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            await queryManager.createRefreshToken( user.userId, refreshToken, expiresAt);

            // Set cookies, secure only in production
            res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 1000 });

            res.json({
                success: true,
                user: {
                    userId: user.userId,
                    email: user.email,
                    username: user.username
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Handle user registration. Checks for existing user/email, hashes password, creates user.
    // Responds with created user info (excluding password).
    // Uses bcrypt to hash passwords before storing.
    async register(req: Request, res: Response) {
        try {
            const { email, password, username } = req.body;
            
            if (!email || !password || !username) {
                return res.status(400).json({ error: 'Email, password and username are required' });
            }

            const existingUser = await queryManager.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            const existingUsername = await queryManager.getUserByUsername(username);
            if (existingUsername) {
                return res.status(400).json({ error: 'Username already taken' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await queryManager.createUser(email, hashedPassword, username);

            res.status(201).json({
                success: true,
                user: {
                    userId: user.userId,
                    email: user.email,
                    username: user.username
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Handle user logout. Deletes refresh token from DB and clears cookies.
    async logout(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies.refreshToken;
            
            if (refreshToken) {
                await queryManager.deleteRefreshToken(refreshToken);
            }

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Handle token refresh. Verifies old refresh token, generates new tokens, updates DB and cookies.
    // Responds with success message on successful refresh. 
    // Ensures old refresh token is deleted from DB to prevent reuse.
    // Verifies both JWT validity and database existence/expiration of the refresh token.
    async refresh(req: Request, res: Response) {
        try {
            const oldRefreshToken = req.cookies.refreshToken;

            if (!oldRefreshToken) {
                return res.status(401).json({ error: 'Refresh token required' });
            }

            // Verify JWT signature and expiration
            let decoded;
            try {
                decoded = verifyRefreshToken(oldRefreshToken);
            } catch (error) {
                return res.status(403).json({ error: 'Invalid or expired refresh token' });
            }

            // Check if token exists in database
            const tokenData = await queryManager.getRefreshToken(oldRefreshToken);
            
            if (!tokenData) {
                return res.status(403).json({ error: 'Refresh token not found' });
            }

            // Check database expiration
            if (tokenData.expiresAt < new Date()) {
                await queryManager.deleteRefreshToken(oldRefreshToken);
                return res.status(403).json({ error: 'Refresh token expired' });
            }

            const user = await queryManager.getUserById(decoded.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Delete old refresh token
            await queryManager.deleteRefreshToken(oldRefreshToken);

            // Generate new tokens
            const { accessToken, refreshToken } = generateTokens(user.userId);

            // Save new refresh token
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);

            await queryManager.createRefreshToken(user.userId, refreshToken, expiresAt);

            // Set new cookies
            res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 1000 });

            res.json({ success: true, message: 'Tokens refreshed successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const authManager = new AuthManager();