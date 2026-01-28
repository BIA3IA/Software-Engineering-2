import Joi from 'joi';

const coordinatesSchema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
});

export const createTripSchema = Joi.object({
    origin: coordinatesSchema.required(),
    destination: coordinatesSchema.required(),
    startedAt: Joi.date().iso().required(),
    finishedAt: Joi.date().iso().required(),
    title: Joi.string().max(100).allow(null).optional(),
    tripSegments: Joi.array().items(
        Joi.object({
            segmentId: Joi.string().trim().min(1).required(),
            polylineCoordinates: Joi.array().items(coordinatesSchema).min(2).required(),
        })
    ).min(1).required(),
});

export const tripIdParamsSchema = Joi.object({
    tripId: Joi.string().trim().min(1).required(),
});
