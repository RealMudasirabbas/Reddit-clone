import { Router } from "express";
import { prisma } from "../db/prisma-helper.js";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post(
  "/:postId/vote",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { postId } = req.params;
    const { voteType } = req.body;

    const post = await prisma.post.findFirst({
      where: { id: postId },
    });

    if (!post) {
      return apiResponse(res, "post not found", {}, 404);
    }

    const findVote = await prisma.vote.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!findVote) {
      const createVote = await prisma.vote.create({
        data: { type: voteType, userId, postId: post.id },
      });
      return apiResponse(res, "vote created successfully", createVote, 201);
    }

    if (findVote.type === voteType) {
      await prisma.vote.delete({
        where: { userId_postId: { userId, postId } },
      });
      return apiResponse(res, "vote deleted successfully", {}, 200);
    }

    const updateVote = await prisma.vote.update({
      where: { userId_postId: { userId, postId } },
      data: { type: voteType },
    });

    return apiResponse(res, "vote updated successfully", updateVote, 200);
  }),
);

router.post(
  "/:postId/:commentId/vote",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { postId, commentId } = req.params;
    const { voteType } = req.body;

    const post = await prisma.post.findFirst({
      where: { id: postId },
    });

    if (!post) {
      return apiResponse(res, "post not found", {}, 404);
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId },
    });

    if (!comment) {
      return apiResponse(res, "comment not found", {}, 404);
    }

    const findVote = await prisma.vote.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (!findVote) {
      const createVote = await prisma.vote.create({
        data: { type: voteType, userId, commentId: comment.id },
      });
      return apiResponse(res, "vote created successfully", createVote, 201);
    }

    if (findVote.type === voteType) {
      await prisma.vote.delete({
        where: { userId_commentId: { userId, commentId } },
      });
      return apiResponse(res, "vote deleted successfully", {}, 200);
    }

    const updateVote = await prisma.vote.update({
      where: { userId_commentId: { userId, commentId } },
      data: { type: voteType },
    });

    return apiResponse(res, "vote updated successfully", updateVote, 200);
  }),
);

export default router;
