import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import { validateSchema } from '../middlewares/validateSchema.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
    createOrUpdateCommentVote,
    createOrUpdateVote,
} from '../controllers/voteController.js';
import { exporter } from '../../utils/exporter.js';
const { voteSchemas, commonSchemas } = exporter;
const router = Router();

router.post(
    '/:postId/vote',
    authMiddleware,
    validateSchema(commonSchemas.postIdParamsSchema, 'params'),
    validateSchema(voteSchemas.createVoteSchema),
    asyncHandler(createOrUpdateVote)
);

router.post(
    '/:commentId/vote',
    authMiddleware,
    validateSchema(commonSchemas.commentIdParamsSchema, 'params'),
    validateSchema(voteSchemas.createVoteSchema),
    asyncHandler(createOrUpdateCommentVote)
);

export default router;
