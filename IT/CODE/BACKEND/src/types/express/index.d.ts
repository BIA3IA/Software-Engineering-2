// Extend Express Request interface to include user property for authenticated requests
import { JwtPayload } from '../jwt.types';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export {};