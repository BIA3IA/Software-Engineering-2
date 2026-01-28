import Joi from 'joi';

const coordinatesSchema = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
});

const pathStatusSchema = Joi.string().valid(
    'OPTIMAL',
    'MEDIUM',
    'SUFFICIENT',
    'REQUIRES_MAINTENANCE',
    'CLOSED'
);

const obstacleTypeSchema = Joi.string().valid(
    'POTHOLE',
    'WORK_IN_PROGRESS',
    'FLOODING',
    'OBSTACLE',
    'OTHER'
);

export const createReportSchema = Joi.object({
    pathSegmentId: Joi.string().trim().min(1).optional(),
    pathId: Joi.string().trim().min(1).optional(),
    segmentId: Joi.string().trim().min(1).optional(),
    tripId: Joi.string().trim().min(1).optional(),
    sessionId: Joi.string().trim().min(1).required(),
    obstacleType: obstacleTypeSchema.required(),
    position: coordinatesSchema.required(),
    pathStatus: pathStatusSchema.optional(),
    condition: pathStatusSchema.optional(),
}).or('pathStatus', 'condition')
  .or('pathSegmentId', 'segmentId')
  .with('segmentId', 'pathId');

export const confirmReportParamsSchema = Joi.object({
    reportId: Joi.string().trim().min(1).required(),
});

export const confirmReportSchema = Joi.object({
    decision: Joi.string().valid('CONFIRMED', 'REJECTED').required(),
    tripId: Joi.string().trim().min(1).optional(),
});

export const getReportsByPathSchema = Joi.object({
    pathId: Joi.alternatives().try(
        Joi.string().trim().min(1),
        Joi.array().items(Joi.string().trim().min(1)).min(1)
    ).required(),
}).unknown(true);

export const attachReportsSchema = Joi.object({
    sessionId: Joi.string().trim().min(1).required(),
    tripId: Joi.string().trim().min(1).required(),
});
