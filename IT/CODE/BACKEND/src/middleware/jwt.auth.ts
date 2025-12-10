import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, } from '../types/index.js';
import { getJwtSecrets } from '../utils/utils.js'
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';

// Function to generate access and refresh tokens. Set expiration times as needed, here 15 minutes for access and 1 hour for refresh.
// The sign method creates a JWT token by encoding the payload (userId) with the secret key. 
// Automatically includes iat and exp fields (exp field is defined in the options).
export const generateTokens = (userId: string) => {
    const { accessTokenSecret, refreshTokenSecret } = getJwtSecrets();

    const accessToken = jwt.sign( { userId }, accessTokenSecret, { expiresIn: '15m' } );

    const refreshToken = jwt.sign( { userId }, refreshTokenSecret, { expiresIn: '1h' } );
    
    return { accessToken, refreshToken };
};

// Function to verify access token from request cookies. If valid, attaches decoded payload to req.user and calls next().
// Next is used to pass control to the next middleware function in the stack. 
// If invalid or missing, responds with appropriate HTTP status codes (401 Unauthorized or 403 Forbidden).
// The verify method decodes and verifies the JWT token using the secret key.
export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
    const { accessTokenSecret } = getJwtSecrets();
    const token = req.cookies.accessToken;

    if (!token) {
        // Unauthorized
        // Now we can use the custom UnauthorizedError class, but we need to use next() to pass it to the error handler
        return next(new UnauthorizedError('Access token required', 'ACCESS_TOKEN_MISSING'));
    }

    try {
        const decoded = jwt.verify(token, accessTokenSecret) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        // Forbidden
        return next(new ForbiddenError('Invalid or expired token', 'INVALID_ACCESS_TOKEN'));
    }
};

// Function to verify refresh token. Returns decoded payload if valid, otherwise throws an error.
export const verifyRefreshToken = (token: string): JwtPayload => {
    const { refreshTokenSecret } = getJwtSecrets();
    try {
        return jwt.verify(token, refreshTokenSecret) as JwtPayload;
    } catch (error) {
        throw new ForbiddenError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }
};