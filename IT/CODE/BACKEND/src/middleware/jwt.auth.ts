import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, } from '../types/index.js';
import { getJwtSecrets } from '../utils/utils.js'

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
        // unauthorized
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, accessTokenSecret) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        // forbidden
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Function to verify refresh token. Returns decoded payload if valid, otherwise throws an error.
export const verifyRefreshToken = (token: string): JwtPayload => {
    const { refreshTokenSecret } = getJwtSecrets();
    return jwt.verify(token, refreshTokenSecret) as JwtPayload;
};