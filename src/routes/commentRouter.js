import { Router } from "express";
import { prisma } from "../db/prisma-helper.js";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";

const router = Router();

router.post("/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const { postId } = req.params;
    const { id } = req.user;

    if (!content) {
      return apiResponse(res, "please provide content", {}, 400);
    }

    const findPost = await prisma.post.findFirst({
      where: {
        id: postId,
      },
    });

    if (!findPost) {
      return apiResponse(res, "no post exist for this id", {}, 404);
    }
    // check if its top level comment or reply
    if (!parentId) {
      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: id,
          postId: findPost.id,
          parentId: parentId || null,
        },
      });

      return apiResponse(res, "comment created successfully", { comment }, 201);
    }
    if (parentId) {
      const isParentCommentExist = await prisma.comment.findUnique({
        where: {
          id: parentId,
        },
      });

      if (!isParentCommentExist) {
        return apiResponse(res, "comment parent not found", {}, 404);
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: id,
          postId: findPost.id,
          parentId: parentId,
        },
      });
      return apiResponse(res, "comment created successfully", { comment }, 201);
    }
  } catch (error) {
    return apiResponse(
      res,
      "comment creation failed. please try again",
      {},
      500,
    );
  }
});

router.get("/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const findPost = await prisma.post.findFirst({
      where: {
        id: postId,
      },
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
  } catch (error) {
    return apiResponse(
      res,
      "could not fetch comments.please try again",
      { errorMsg: error.message },
      500,
    );
  }
});

router.patch(
  "/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { id: userId } = req.user;
      const { commentId } = req.params;
      const { content } = req.body;
  
      const isCommentExist = await prisma.comment.findFirst({
        where: {
          id: commentId,
        },
      });
  
      if (!isCommentExist) {
        return apiResponse(res, "this comment does not exist", {}, 404);
      }
  
      if (isCommentExist.authorId != userId) {
        return apiResponse(res, "author can only update its comments", {}, 403);
      }
  
      const updateComment = await prisma.comment.update({
        where: {
          id: commentId,
        },
        data: {
          content: content,
        },
      });
  
      return apiResponse(res, "comment updated successfully", updateComment, 200);
    } catch (error) {
      return apiResponse(res,"comment updation failed",{err:error.message},500)
    }
  },
);

router.delete(
  "/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { commentId, postId } = req.params;
      const { id } = req.user;

      const foundPost = await prisma.post.findFirst({
        where: {
          id: postId,
        },
      });

      if (!foundPost) {
        return apiResponse(res, "this post does not exist", {}, 404);
      }

      const isCommentExist = await prisma.comment.findFirst({
        where: {
          id: commentId,
        },
      });

      if (!isCommentExist) {
        return apiResponse(res, "this comment does not exist", {}, 404);
      }

      if (isCommentExist.authorId != id) {
        return apiResponse(res, "author can only delete its comments", {}, 403);
      }

      const deletedComment = await prisma.comment.delete({
        where: {
          id: commentId,
        },
      });

      return apiResponse(res, "user comment deleted successfully", {}, 200);
    } catch (error) {
      return apiResponse(
        res,
        "could not delete the comment.please try again",
        {},
        500,
      );
    }
  },
);

export default router;
