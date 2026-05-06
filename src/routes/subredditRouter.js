import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import { validateSchema } from '../middlewares/validateSchema.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
    createSubreddit,
    getAllSubreddits,
    getSubreddit,
    joinSubreddit,
    updateSubreddit,
    leaveSubreddit,
    createSubredditPost,
    getSubredditPosts,
    getSubredditPost,
    updateSubredditPost,
    deleteSubredditPost,
} from '../controllers/subredditController.js';
import { exporter } from '../../utils/exporter.js';
const { subredditSchemas, commonSchemas } = exporter;
const router = Router();

router.post(
    '/',
    authMiddleware,
    validateSchema(subredditSchemas.createSubredditSchema),
    asyncHandler(createSubreddit)
);

router.get('/', asyncHandler(getAllSubreddits));

router.get(
    '/:name',
    validateSchema(commonSchemas.subredditNameParamsSchema, 'params'),
    asyncHandler(getSubreddit)
);

router.post(
    '/join/:name',
    authMiddleware,
    validateSchema(commonSchemas.subredditNameParamsSchema, 'params'),
    asyncHandler(joinSubreddit)
);

router.patch(
    '/:name',
    authMiddleware,
    validateSchema(commonSchemas.subredditNameParamsSchema, 'params'),
    validateSchema(subredditSchemas.updateSubredditSchema),
    asyncHandler(updateSubreddit)
);

router.post(
    '/leave/:name',
    authMiddleware,
    validateSchema(commonSchemas.subredditNameParamsSchema, 'params'),
    asyncHandler(leaveSubreddit)
);

router.post(
    '/:name/posts',
    authMiddleware,
    validateSchema(commonSchemas.subredditNameParamsSchema, 'params'),
    validateSchema(subredditSchemas.createSubredditPostSchema),
    asyncHandler(createSubredditPost)
);

router.get(
    '/:name/posts',
    validateSchema(commonSchemas.subredditNameParamsSchema, 'params'),
    asyncHandler(getSubredditPosts)
);

router.get(
    '/:name/posts/:postId',
    validateSchema(commonSchemas.subredditPostParamsSchema, 'params'),
    asyncHandler(getSubredditPost)
);

router.patch(
    '/:name/posts/:postId',
    authMiddleware,
    validateSchema(commonSchemas.subredditPostParamsSchema, 'params'),
    validateSchema(subredditSchemas.updateSubredditPostSchema),
    asyncHandler(updateSubredditPost)
);

router.delete(
    '/:name/posts/:postId',
    authMiddleware,
    validateSchema(commonSchemas.subredditPostParamsSchema, 'params'),
    asyncHandler(deleteSubredditPost)
);

export default router;
