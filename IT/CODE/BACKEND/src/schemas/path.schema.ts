import Joi from 'joi';

const coordinatesSchema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
});

const pathSegmentSchema = Joi.object({
    start: coordinatesSchema.required(),
    end: coordinatesSchema.required(),
});

export const createPathSchema = Joi.object({
    pathSegments: Joi.array().items(pathSegmentSchema).min(1).required(),
    visibility: Joi.boolean().required(),
    creationMode: Joi.string().valid('manual', 'automatic').required(),
    title: Joi.string().trim().min(3).required(),
    description: Joi.string().trim().min(1).max(280).required(),
});

export const changePathVisibilitySchema = Joi.object({
    visibility: Joi.boolean().required(),
});

export const snapPathSchema = Joi.object({
    coordinates: Joi.array().items(coordinatesSchema).min(2).required(),
});

export const searchPathSchema = Joi.object({
    origin: Joi.string().trim().min(1).required(),
    destination: Joi.string().trim().min(1).required(),
}).unknown(true);
