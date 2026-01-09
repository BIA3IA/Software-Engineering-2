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
    title: Joi.string().max(100).allow(null).optional(),
    description: Joi.string().max(500).allow(null).optional(),
});

export const changePathVisibilitySchema = Joi.object({
    visibility: Joi.boolean().required(),
});