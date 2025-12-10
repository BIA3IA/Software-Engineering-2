// Custom error classes for structured error handling

export const HttpStatus = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// Base application error class. All custom errors extend this. 
// Includes HTTP status code and optional error code (like 'NOT_FOUND' etc...).
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code?: string;

    constructor(message: string, statusCode: number, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// 400 - Bad Request (validation errors, missing fields)
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request', code?: string) {
        super(message, HttpStatus.BAD_REQUEST, code || 'BAD_REQUEST');
    }
}

// 401 - Unauthorized (missing or invalid authentication)
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized', code?: string) {
        super(message, HttpStatus.UNAUTHORIZED, code || 'UNAUTHORIZED');
    }
}

// 403 - Forbidden (authenticated but not allowed)
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden', code?: string) {
        super(message, HttpStatus.FORBIDDEN, code || 'FORBIDDEN');
    }
}

// 404 - Not Found
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', code?: string) {
        super(message, HttpStatus.NOT_FOUND, code || 'NOT_FOUND');
    }
}

// 500 - Internal Server Error
export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error', code?: string) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, code || 'INTERNAL_SERVER_ERROR');
    }
}