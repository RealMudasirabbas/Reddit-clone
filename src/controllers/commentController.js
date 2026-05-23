import { exporter } from '../../utils/exporter.js';
const { apiResponse } = exporter;
import {
    createCommentService,
    getAllCommentsService,
    updateCommentService,
    deleteCommentService,
} from '../services/commentService.js';

export async function createComment(req, res) {
    const { content, parentId } = req.body;
    const { postId } = req.params;
    const { id } = req.user;

    if (!content) {
        return apiResponse(res, 'please provide content', {}, 400);
    }

    const createCommentServiceResponse = await createCommentService(
        content,
        id,
        postId,
        parentId
    );

    if (createCommentServiceResponse.postNotFound) {
        return apiResponse(res, 'no post exist for this id', {}, 404);
    }

    if (createCommentServiceResponse.postDeleted) {
        return apiResponse(res, 'post has been deleted', {}, 410);
    }

    if (createCommentServiceResponse.parentCommentDeleted) {
        return apiResponse(res, 'parent comment has been deleted', {}, 410);
    }

    if (createCommentServiceResponse.parentCommentNotFound) {
        return apiResponse(res, 'no parent comment exist for this id', {}, 404);
    }

    if (createCommentServiceResponse.success) {
        const { comment } = createCommentServiceResponse;
        return apiResponse(
            res,
            'comment created successfully',
            { comment },
            201
        );
    }
}

export async function getAllComments(req, res) {
    const { postId } = req.params;

    const getAllCommentsServiceResponse = await getAllCommentsService(postId);

    if (getAllCommentsServiceResponse.postNotFound) {
        return apiResponse(res, 'no post exist for this id', {}, 404);
    }

    if (getAllCommentsServiceResponse.postDeleted) {
        return apiResponse(res, 'post has been deleted', {}, 410);
    }

    if (getAllCommentsServiceResponse.commentsNotFound) {
        return apiResponse(res, 'no comments found on this post', {}, 404);
    }

    if (getAllCommentsServiceResponse.success) {
        const { findAllComments } = getAllCommentsServiceResponse;
        return apiResponse(
            res,
            'all comments sent successfully',
            { findAllComments },
            200
        );
    }
}

export async function updateComment(req, res) {
    const { id: userId } = req.user;
    const { commentId } = req.params;
    const { content } = req.body;

    const updateCommentServiceResponse = await updateCommentService(
        userId,
        commentId,
        content
    );

    if (updateCommentServiceResponse.commentNotFound) {
        return apiResponse(res, 'no comment exist for this id', {}, 404);
    }

    if (updateCommentServiceResponse.unauthorized) {
        return apiResponse(res, 'author can only update its comments', {}, 403);
    }

    if (updateCommentServiceResponse.success) {
        const { updatedComment } = updateCommentServiceResponse;
        return apiResponse(
            res,
            'comment updated successfully',
            { updatedComment },
            200
        );
    }
}

export async function deleteComment(req, res) {
    const { commentId } = req.params;
    const { id } = req.user;

    const deleteCommentServiceResponse = await deleteCommentService(
        id,
        commentId
    );

    if (deleteCommentServiceResponse.commentNotFound) {
        return apiResponse(res, 'no comment exist for this id', {}, 404);
    }

    if (deleteCommentServiceResponse.unauthorized) {
        return apiResponse(res, 'author can only delete its comments', {}, 403);
    }

    if (deleteCommentServiceResponse.success) {
        return apiResponse(res, 'comment deleted successfully', {}, 200);
    }
}
