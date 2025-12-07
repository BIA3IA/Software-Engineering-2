// Utility function to get JWT secrets from environment variables
export const getJwtSecrets = () => {
    const accessTokenSecret = process.env.JWT_SECRET;
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessTokenSecret || !refreshTokenSecret) {
        throw new Error('JWT secrets are not defined in environment variables');
    }

    return { accessTokenSecret, refreshTokenSecret };
};
