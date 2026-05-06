import z from 'zod';

const createSubredditSchema = z.object({
    name: z.string().min(3).max(20),
    description: z.string().max(500),
    logoUrl: z.string().url().optional(),
});

const updateSubredditSchema = z.object({
    name: z.string().min(3).max(20).optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
});

const createSubredditPostSchema = z.object({
    title: z.string().min(1).max(50),
    content: z.string().min(1).max(5000),
    imageUrl: z.string().url().optional(),
});

const updateSubredditPostSchema = z.object({
    title: z.string().min(1).max(50).optional(),
    content: z.string().min(1).max(5000).optional(),
    imageUrl: z.string().url().optional(),
});

export default function exportSubredditSchemas() {
    return {
        createSubredditSchema,
        updateSubredditSchema,
        createSubredditPostSchema,
        updateSubredditPostSchema,
    };
}
