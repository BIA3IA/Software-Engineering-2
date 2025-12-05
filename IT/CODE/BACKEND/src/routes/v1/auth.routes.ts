import { Router, Request, Response } from 'express';
import { authManager } from '../../managers/auth/index.js';

const authRouter = Router();

// define /auth routes. See in user.routes.ts for explanation about the use of 'bind'.
authRouter.post('/register', authManager.register.bind(authManager));
authRouter.post('/login', authManager.login.bind(authManager));
authRouter.post('/logout', authManager.logout.bind(authManager));
authRouter.post('/refresh', authManager.refresh.bind(authManager));

export { authRouter };