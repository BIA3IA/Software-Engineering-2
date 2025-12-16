import pino from 'pino';

// Logger configuration. Pino is a low overhead logging library for Node.js.
// This is pretty useful for both development and production environments. 
// In development: pretty print with colors and human-readable timestamps.
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' 
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard', // Human readable timestamp
                ignore: 'pid,hostname',        // Cleaner output
            },
        }
        : undefined, // JSON in production but nevermind (JSON is default)
});

export default logger;