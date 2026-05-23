import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import { validateSchema } from '../middlewares/validateSchema.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
    savedPost,
    getSavedPosts,
} from '../controllers/subredditController.js';
import { exporter } from '../../utils/exporter.js';
const { commonSchemas } = exporter;
const router = Router();

router.get('/saved', authMiddleware, asyncHandler(getSavedPosts));

router.post(
    '/:postId/save',
    authMiddleware,
    validateSchema(commonSchemas.postIdParamsSchema, 'params'),
    asyncHandler(savedPost)
);

export default router;
