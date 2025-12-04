import { Router } from 'express';
import { userRouter } from './user.routes.js';

// central router for v1 API

const router = Router();

router.use('/users', userRouter);
// add more routes here as needed

export default router;