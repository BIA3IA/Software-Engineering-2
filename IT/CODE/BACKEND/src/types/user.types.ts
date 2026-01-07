// User-related type definitions for TypeScript type checking purposes
export interface UpdateProfilePayload {
    username?: string;
    email?: string;
    currentPassword?: string;
    password?: string;
    systemPreferences?: string[];
}