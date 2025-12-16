import { Router } from 'express';
import { userRouter } from './user.routes';
import { authRouter } from './auth.routes';
import { weatherRouter } from './weather.routes';

// central router for v1 API

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/weather', weatherRouter);
// add more routes here as needed

export default router;