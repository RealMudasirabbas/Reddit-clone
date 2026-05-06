import z from 'zod';

const createCommentSchema = z.object({
    content: z.string().min(1).max(500),
    parentId: z.uuid().optional(),
});

const updateCommentSchema = z.object({
    content: z.string().min(1).max(500),
});

export default function exportCommentSchemas() {
    return {
        createCommentSchema,
        updateCommentSchema,
    };
}
