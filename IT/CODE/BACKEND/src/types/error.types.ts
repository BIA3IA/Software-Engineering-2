// Error type definitions for custom error handling (sent in API responses)
export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
    };
}