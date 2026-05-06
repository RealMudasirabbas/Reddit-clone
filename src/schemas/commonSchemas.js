import z from 'zod';

const commentIdParamsSchema = z.object({
    commentId: z.uuid(),
});

const postIdParamsSchema = z.object({
    postId: z.uuid(),
});

const postCommentParamsSchema = z.object({
    postId: z.uuid(),
    commentId: z.uuid(),
});

const subredditNameParamsSchema = z.object({
    name: z.string().min(3).max(20),
});

const subredditPostParamsSchema = z.object({
    name: z.string().min(3).max(20),
    postId: z.uuid(),
});

export default function exportCommonSchemas() {
    return {
        commentIdParamsSchema,
        postIdParamsSchema,
        postCommentParamsSchema,
        subredditNameParamsSchema,
        subredditPostParamsSchema,
    };
}
