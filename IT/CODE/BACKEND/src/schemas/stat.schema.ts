import Joi from 'joi';

/**
 * Validates the parameters for GET /stats/trip/:tripId
 * Ensures the tripId is a non-empty string before querying the database.
 */
export const getTripStatsSchema = Joi.object({
    tripId: Joi.string().trim().min(1).required().messages({
        'string.empty': 'Trip ID cannot be an empty string',
        'any.required': 'Trip ID is required to retrieve statistics'
    }),
});