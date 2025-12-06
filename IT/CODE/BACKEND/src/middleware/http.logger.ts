import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// HTTP request logger middleware (replaces Morgan)
export const httpLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl } = req;
        const { statusCode } = res;

        // Choose log level based on status code
        const logData = {
            method,
            url: originalUrl,
            status: statusCode,
            duration: `${duration}ms`,
        };

        if (statusCode >= 500) {
            logger.error(logData, 'Request failed');
        } else if (statusCode >= 400) {
            logger.warn(logData, 'Request error');
        } else {
            logger.info(logData, 'Request completed');
        }
    });

    next();
};