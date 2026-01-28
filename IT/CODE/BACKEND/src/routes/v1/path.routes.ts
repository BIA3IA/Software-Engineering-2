import { Router } from 'express';
import { pathManager } from '../../managers/path/index.js';
import { verifyAccessToken } from '../../middleware/index.js';
import { validate } from '../../middleware/validator.js';
import {
    createPathSchema,
    changePathVisibilitySchema,
    snapPathSchema,
    searchPathSchema,
    pathIdParamsSchema,
} from '../../schemas/path.schema.js';

const pathRouter = Router();

pathRouter.post(
    '/', 
    verifyAccessToken, 
    validate(createPathSchema, 'body'), 
    pathManager.createPath.bind(pathManager)
);


pathRouter.get(
    '/search', 
    validate(searchPathSchema, 'query'), 
    pathManager.searchPath.bind(pathManager)
);

pathRouter.post(
    '/snap',
    verifyAccessToken,
    validate(snapPathSchema, 'body'), 
    pathManager.snapPath.bind(pathManager)
);

pathRouter.get(
    '/',
    verifyAccessToken,
    pathManager.getUserPaths.bind(pathManager)
);

pathRouter.delete(
    '/:pathId', verifyAccessToken,
    validate(pathIdParamsSchema, 'params'),
    pathManager.deletePath.bind(pathManager)
);

pathRouter.patch(
    '/:pathId/visibility',
    verifyAccessToken,
    validate(pathIdParamsSchema, 'params'),
    validate(changePathVisibilitySchema, 'body'),
    pathManager.changePathVisibility.bind(pathManager)
);

export { pathRouter };
