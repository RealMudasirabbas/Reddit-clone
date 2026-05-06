import {
    createOrUpdateVoteService,
    createOrUpdateCommentVoteService,
} from '../services/voteService.js';
import { exporter } from './../../utils/exporter.js';
const { apiResponse } = exporter;

export async function createOrUpdateVote(req, res) {
    const { id: userId } = req.user;
    const { postId } = req.params;
    const { voteType } = req.body;

    const createOrUpdateVoteServiceResponse = await createOrUpdateVoteService(
        userId,
        postId,
        voteType
    );

    if (createOrUpdateVoteServiceResponse.commentNotFound) {
        return apiResponse(res, 'Post not found', {}, 404);
    }

    if (createOrUpdateVoteServiceResponse.created) {
        return apiResponse(
            res,
            'vote created successfully',
            {
                vote: createOrUpdateVoteServiceResponse.vote,
            },
            201
        );
    }

    if (createOrUpdateVoteServiceResponse.voteDeleted) {
        return apiResponse(res, 'vote got deleted', {}, 200);
    }

    if (createOrUpdateVoteServiceResponse.updated) {
        return apiResponse(
            res,
            'vote updated successfully',
            { vote: createOrUpdateVoteServiceResponse.vote },
            200
        );
    }
}

export async function createOrUpdateCommentVote(req, res) {
    const { id: userId } = req.user;
    const { commentId } = req.params;
    const { voteType } = req.body;

    const createOrUpdateCommentVoteServiceResponse =
        await createOrUpdateCommentVoteService(userId, commentId, voteType);

    if (createOrUpdateCommentVoteServiceResponse.postNotFound) {
        return apiResponse(res, 'Post not found', {}, 404);
    }

    if (createOrUpdateCommentVoteServiceResponse.commentNotFound) {
        return apiResponse(res, 'Comment not found', {}, 404);
    }

    if (createOrUpdateCommentVoteServiceResponse.created) {
        return apiResponse(
            res,
            'Comment vote created successfully',
            {
                vote: createOrUpdateCommentVoteServiceResponse.vote,
            },
            201
        );
    }

    if (createOrUpdateCommentVoteServiceResponse.voteDeleted) {
        return apiResponse(res, 'Comment vote got deleted', {}, 200);
    }

    if (createOrUpdateCommentVoteServiceResponse.updated) {
        return apiResponse(
            res,
            'Comment vote updated successfully',
            { vote: createOrUpdateCommentVoteServiceResponse.vote },
            200
        );
    }
}
