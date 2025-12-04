import { Router } from 'express';
import { userManager } from '../../managers/user/index.js';

const router = Router();

// POST /api/v1/users/create
router.post('/create', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        const user = await userManager.createUser({ email, password, name });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        // try a custom error
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: "concettina"
        });
        console.log(error);
    }
});

export { router as userRouter };