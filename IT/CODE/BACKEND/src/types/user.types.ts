// User-related type definitions for TypeScript type checking purposes
export interface UpdateProfilePayload {
    username?: string;
    email?: string;
    password?: string;
    systemPreferences?: string[];
}