// JWT payload structure definition for TypeScript type checking purposes
export interface JwtPayload {
    userId: string;
    iat: number;
    exp: number;
}