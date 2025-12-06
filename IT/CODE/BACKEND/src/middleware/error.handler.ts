import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/error.types.js';
import { HttpStatus, AppError } from '../errors/index.js';
import logger from '../utils/logger.js';

// Type guard: if it has statusCode, it's our custom error
// There are different ways to implement type guards.. this is a simple one
const isAppError = (error: unknown): error is AppError => {
    return (
        error !== null &&
        typeof error === 'object' &&
        'statusCode' in error &&
        typeof (error as any).statusCode === 'number'
    );
};

// Main error handler middleware. Logs error and sends structured response. 
// This is useful for both expected (custom) and unexpected errors. 
// Expected errors are logged as warnings, unexpected as errors.
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { method, originalUrl, body, params, query } = req;

    // Log error details with Pino
    if (isAppError(err)) {
        // Expected errors logged as warning, use stack if needed for debugging
        logger.warn({
            err: { message: err.message, code: err.code, statusCode: err.statusCode, /*stack: err.stack*/ },
            request: { method, url: originalUrl },
        }, 'Handled error');

        const response: ErrorResponse = {
            success: false,
            error: {
                message: err.message,
                code: err.code,
            },
        };

        res.status(err.statusCode).json(response);
        return;
    }

    // Unexpected errors, log full details for debugging
    logger.error({
        err: { 
            message: err.message, 
            name: err.name,
            stack: err.stack,
        },
        request: { method, url: originalUrl, body, params, query },
    }, 'Unexpected error');

    // Generic response, never expose internal details
    const response: ErrorResponse = {
        success: false,
        error: {
            message: 'Something went wrong',
            code: 'INTERNAL_ERROR',
        },
    };

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
};

// 404 handler for undefined routes to avoid "cannot GET /something" responses
export const notFoundHandler = (req: Request, res: Response): void => {
    logger.warn({
        request: { method: req.method, url: req.originalUrl },
    }, 'Route not found');

    const response: ErrorResponse = {
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'ROUTE_NOT_FOUND',
        },
    };

    res.status(HttpStatus.NOT_FOUND).json(response);
};