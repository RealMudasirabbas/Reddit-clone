import { Router } from "express";

import authMiddleware from "../middlewares/auth.js";

import asyncHandler from "../../utils/asyncHandler.js";
import {
  createOrUpdateCommentVote,
  createOrUpdateVote,
} from "../controllers/voteController.js";
const router = Router();

router.post("/:postId/vote", authMiddleware, asyncHandler(createOrUpdateVote));

router.post(
  "/:postId/:commentId/vote",
  authMiddleware,
  asyncHandler(createOrUpdateCommentVote),
);

export default router;
