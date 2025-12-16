import { Router } from 'express';
import { authManager } from '../../managers/auth/index.js';
import { loginSchema } from '../../schemas/index.js';
import { validate } from '../../middleware/index.js';

const authRouter = Router();

// define /auth routes. See in user.routes.ts for explanation about the use of 'bind'.

// Validate middleware can be used to validate request data against Joi schemas
authRouter.post('/login', validate(loginSchema), authManager.login.bind(authManager));
// authRouter.post('/login', authManager.login.bind(authManager));
authRouter.post('/logout', authManager.logout.bind(authManager));
authRouter.post('/refresh', authManager.refresh.bind(authManager));

export { authRouter };