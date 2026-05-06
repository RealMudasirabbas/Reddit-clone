import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
    createComment,
    deleteComment,
    getAllComments,
    updateComment,
} from '../controllers/commentController.js';
import { exporter } from '../../utils/exporter.js';
import { validateSchema } from '../middlewares/validateSchema.js';
const { commentSchemas, commonSchemas } = exporter;
const router = Router();

router.post(
    '/:postId/comments',
    authMiddleware,
    validateSchema(commentSchemas.createCommentSchema),
    validateSchema(commonSchemas.postIdParamsSchema, 'params'),

    asyncHandler(createComment)
);

router.get('/:postId/comments', asyncHandler(getAllComments));

router.patch(
    '/:postId/comments/:commentId',
    authMiddleware,
    validateSchema(commentSchemas.updateCommentSchema),
    validateSchema(commonSchemas.postCommentParamsSchema, 'params'),
    asyncHandler(updateComment)
);

router.delete(
    '/comments/:commentId',
    authMiddleware,
    asyncHandler(deleteComment)
);

export default router;
