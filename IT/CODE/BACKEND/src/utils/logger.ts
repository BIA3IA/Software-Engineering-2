import pino from 'pino';

// Logger configuration. Pino is a low overhead logging library for Node.js.
// This is pretty useful for both development and production environments. 
// In development: pretty print with colors and human-readable timestamps.
const isProd = process.env.NODE_ENV === 'production';

export const logger = isProd
  ? pino({
      level: process.env.LOG_LEVEL || 'info',
    })
  : pino({
      level: process.env.LOG_LEVEL || 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
                translateTime: 'SYS:standard', // Human readable timestamp
                ignore: 'pid,hostname',        // Cleaner output
            },
        }
});

export default logger;