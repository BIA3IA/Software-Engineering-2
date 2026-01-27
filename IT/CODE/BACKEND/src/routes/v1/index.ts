import { Router } from 'express';
import { userRouter } from './user.routes.js';
import { authRouter } from './auth.routes.js';
import { pathRouter } from './path.routes.js';
import { tripRouter } from './trip.routes.js';

// central router for v1 API

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/paths', pathRouter);
router.use('/trips', tripRouter);
// add more routes here as needed

export default router;
