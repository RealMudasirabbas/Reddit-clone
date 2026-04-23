import { Router } from "express";
import { prisma } from "../db/prisma-helper.js";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post(
  "/:postId/comments",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { content, parentId } = req.body;
    const { postId } = req.params;
    const { id } = req.user;

    if (!content) {
      return apiResponse(res, "please provide content", {}, 400);
    }

    const findPost = await prisma.post.findFirst({
      where: { id: postId },
    });

    if (!findPost) {
      return apiResponse(res, "no post exist for this id", {}, 404);
    }

    if (parentId) {
      const isParentCommentExist = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!isParentCommentExist) {
        return apiResponse(res, "comment parent not found", {}, 404);
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: id,
        postId: findPost.id,
        parentId: parentId || null,
      },
    });

    return apiResponse(res, "comment created successfully", { comment }, 201);
  }),
);

router.get(
  "/:postId/comments",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const findPost = await prisma.post.findFirst({
      where: { id: postId },
    });

    if (!findPost) {
      return apiResponse(res, "no post exist for this id", {}, 404);
    }

    const findAllComments = await prisma.comment.findMany({
      where: {
        postId: findPost.id,
        parentId: null,
      },
      include: {
        replies: {
          include: {
            replies: true,
          },
        },
      },
    });

    if (findAllComments.length === 0) {
      return apiResponse(res, "no comments found on this post", {}, 404);
    }

    return apiResponse(
      res,
      "all comments sent successfully",
      { findAllComments },
      200,
    );
  }),
);

router.patch(
  "/:postId/comments/:commentId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { commentId } = req.params;
    const { content } = req.body;

    const isCommentExist = await prisma.comment.findFirst({
      where: { id: commentId },
    });

    if (!isCommentExist) {
      return apiResponse(res, "this comment does not exist", {}, 404);
    }

    if (isCommentExist.authorId != userId) {
      return apiResponse(res, "author can only update its comments", {}, 403);
    }

    const updateComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });

    return apiResponse(res, "comment updated successfully", updateComment, 200);
  }),
);

router.delete(
  "/:postId/comments/:commentId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { commentId, postId } = req.params;
    const { id } = req.user;

    const foundPost = await prisma.post.findFirst({
      where: { id: postId },
    });

    if (!foundPost) {
      return apiResponse(res, "this post does not exist", {}, 404);
    }

    const isCommentExist = await prisma.comment.findFirst({
      where: { id: commentId },
    });

    if (!isCommentExist) {
      return apiResponse(res, "this comment does not exist", {}, 404);
    }

    if (isCommentExist.authorId != id) {
      return apiResponse(res, "author can only delete its comments", {}, 403);
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return apiResponse(res, "user comment deleted successfully", {}, 200);
  }),
);

export default router;
