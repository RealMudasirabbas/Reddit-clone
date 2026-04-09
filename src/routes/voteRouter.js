import { Router } from "express";
import { prisma } from "../db/prisma-helper.js";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";

const router = Router();

// create vote on posts

router.post("/:postId/vote", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { postId } = req.params;
    const { voteType } = req.body;

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return apiResponse(res, "post not found", {}, 404);
    }

    const findVote = await prisma.vote.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    // create vote

    if (!findVote) {
      const createVote = await prisma.vote.create({
        data: {
          type: voteType,
          userId: userId,
          postId: post.id,
        },
      });

      return apiResponse(res, "vote created successfully", createVote, 201);
    }

    // delete vote

    if (findVote && findVote.type === voteType) {
      const deleteVote = await prisma.vote.delete({
        where: {
          userId_postId: { userId, postId },
        },
      });

      return apiResponse(res, "vote deleted successfully", {}, 200);
    }

    // update vote

    const updateVote = await prisma.vote.update({
      where: {
        userId_postId: { userId, postId },
      },
      data: {
        type: voteType,
      },
    });

    return apiResponse(res, "vote updated successfully", updateVote, 200);
  } catch (error) {
    return apiResponse(
      res,
      "vote creation failed",
      { err: error.message },
      500,
    );
  }
});

// create vote on comments

router.post("/:postId/:commentId/vote", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { postId, commentId } = req.params;

    const { voteType } = req.body;

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return apiResponse(res, "post not found", {}, 404);
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        
      },
    });

    if (!comment) {
      return apiResponse(res, "comment not found", {}, 404);
    }

    const findVote = await prisma.vote.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    // create vote on comment

    if (!findVote) {
      const createVote = await prisma.vote.create({
        data: {
          type: voteType,
          userId: userId,
          commentId: comment.id,
        },
      });

      return apiResponse(res, "vote created successfully", createVote, 201);
    }

    // delete vote

    if (findVote && findVote.type === voteType) {
      const deleteVote = await prisma.vote.delete({
        where: {
          userId_commentId: { userId, commentId },
        },
      });

      return apiResponse(res, "vote deleted successfully", {}, 200);
    }

    // update vote

    const updateVote = await prisma.vote.update({
      where: {
        userId_commentId: { userId, commentId },
      },
      data: {
        type: voteType,
      },
    });

    return apiResponse(res, "vote updated successfully", updateVote, 200);
  } catch (error) {
    return apiResponse(res, "vote creation failed", {}, 500);
  }
});
export default router;
