import { Router } from "express";
import authMiddleware from "../middlewares/auth.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  createSubreddit,
  getAllSubreddits,
  getSubreddit,
  joinSubreddit,
  updateSubreddit,
  leaveSubreddit,
  createSubredditPost,
  getSubredditPosts,
  getSubredditPost,
  updateSubredditPost,
  deleteSubredditPost,
} from "../controllers/subredditController.js";

const router = Router();

router.post("/", authMiddleware, asyncHandler(createSubreddit));
router.get("/", asyncHandler(getAllSubreddits));
router.get("/:name", asyncHandler(getSubreddit));
router.post("/join/:name", authMiddleware, asyncHandler(joinSubreddit));
router.patch("/:name", authMiddleware, asyncHandler(updateSubreddit));
router.post("/leave/:name", authMiddleware, asyncHandler(leaveSubreddit));
router.post("/:name/posts", authMiddleware, asyncHandler(createSubredditPost));
router.get("/:name/posts", asyncHandler(getSubredditPosts));
router.get("/:name/posts/:postId", asyncHandler(getSubredditPost));
router.patch(
  "/:name/posts/:postId",
  authMiddleware,
  asyncHandler(updateSubredditPost),
);
router.delete(
  "/:name/posts/:postId",
  authMiddleware,
  asyncHandler(deleteSubredditPost),
);

export default router;
