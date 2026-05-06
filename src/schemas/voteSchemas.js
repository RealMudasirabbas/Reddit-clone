import z from 'zod';

const createVoteSchema = z.object({
    voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
});

export default function exportVoteSchemas() {
    return {
        createVoteSchema,
    };
}
