import { Router } from "express";
import authMiddleware from "../middlewares/auth.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  createComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "../controllers/commentController.js";

const router = Router();

router.post("/:postId/comments", authMiddleware, asyncHandler(createComment));

router.get("/:postId/comments", asyncHandler(getAllComments));

router.patch(
  "/:postId/comments/:commentId",
  authMiddleware,
  asyncHandler(updateComment),
);

router.delete(
  "/comments/:commentId",
  authMiddleware,
  asyncHandler(deleteComment),
);

export default router;
