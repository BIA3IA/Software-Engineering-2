import { Router } from 'express';
import { userManager } from '../../managers/user/index.js';
import { verifyAccessToken } from '../../middleware/jwt.auth.js';

const userRouter = Router();

// define /profile route to get user profile. Note the use of verifyAccessToken middleware and the binding of userManager method in order 
// to preserve the correct 'this' context. This is because we are delegating the request handling to a class method.
userRouter.get('/profile', verifyAccessToken, userManager.getProfile.bind(userManager));

export { userRouter };