import Joi from 'joi';

export const updateProfileSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20),      
    email: Joi.string().email(),
    password: Joi.string().min(8),
    systemPreferences: Joi.array().items(Joi.string())
});