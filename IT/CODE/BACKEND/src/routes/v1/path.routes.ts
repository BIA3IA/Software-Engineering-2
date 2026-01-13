import { Router } from 'express';
import { pathManager } from '../../managers/path/index.js';
import { verifyAccessToken } from '../../middleware/index.js';
import { validate } from '../../middleware/validator.js';
import { createPathSchema, changePathVisibilitySchema } from '../../schemas/path.schema.js';

const pathRouter = Router();

pathRouter.post('/create', verifyAccessToken, validate(createPathSchema, 'body'), pathManager.createPath.bind(pathManager));

pathRouter.get('/search', pathManager.searchPath.bind(pathManager));

pathRouter.get('/my-paths', verifyAccessToken, pathManager.getUserPaths.bind(pathManager));

pathRouter.get('/:pathId', pathManager.getPathDetails.bind(pathManager));

pathRouter.delete('/:pathId', verifyAccessToken, pathManager.deletePath.bind(pathManager));

pathRouter.patch('/:pathId/visibility', verifyAccessToken, validate(changePathVisibilitySchema, 'body'), 
                pathManager.changePathVisibility.bind(pathManager));

export { pathRouter };