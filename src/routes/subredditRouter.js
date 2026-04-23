import { Router } from "express";
import { prisma } from "../db/prisma-helper.js";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.user;
    const { name, description, logoUrl } = req.body;

    if (!name) {
      return apiResponse(res, "Please provide a proper name", {}, 400);
    }

    const isSubredditExist = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (isSubredditExist) {
      return apiResponse(res, "subreddit already exists", {}, 400);
    }

    const createSubreddit = await prisma.subreddit.create({
      data: { name, description, logoUrl, authorId: id },
    });

    return apiResponse(
      res,
      "subreddit has been created successfully",
      { response: createSubreddit },
      201,
    );
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const allSubReddits = await prisma.subreddit.findMany();

    if (allSubReddits.length === 0) {
      return apiResponse(res, "no subreddits found", {}, 404);
    }

    return apiResponse(
      res,
      "subreddits has been sent successfully",
      { allSubReddits },
      200,
    );
  }),
);

router.get(
  "/:name",
  asyncHandler(async (req, res) => {
    const { name } = req.params;

    const foundSubreddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!foundSubreddit) {
      return apiResponse(res, "subreddit not found", {}, 404);
    }

    return apiResponse(
      res,
      "subreddit has been sent successfully",
      { foundSubreddit },
      200,
    );
  }),
);

router.post(
  "/join/:name",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { id } = req.user;

    const subReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!subReddit) {
      return apiResponse(res, "subreddit not found", {}, 404);
    }

    const alreadyMember = await prisma.member.findFirst({
      where: { userId: id, subredditId: subReddit.id },
    });

    if (alreadyMember) {
      return apiResponse(res, "Already a member", {}, 400);
    }

    const joinSubReddit = await prisma.member.create({
      data: { userId: id, subredditId: subReddit.id },
    });

    return apiResponse(
      res,
      "user joined subreddit successfully",
      { membership: joinSubReddit },
      201,
    );
  }),
);

router.patch(
  "/:name",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name: newName, description, logoUrl } = req.body;
    const { name } = req.params;
    const { id } = req.user;

    const subReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!subReddit) {
      return apiResponse(res, "subreddit not found", {}, 404);
    }

    if (subReddit.authorId != id) {
      return apiResponse(res, "only author can edit subreddit", {}, 403);
    }

    const updateSubReddit = await prisma.subreddit.update({
      where: { id: subReddit.id, authorId: id },
      data: { name: newName, description, logoUrl },
    });

    return apiResponse(
      res,
      "subreddit updated successfully",
      { updateSubReddit },
      200,
    );
  }),
);

router.post(
  "/leave/:name",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { id } = req.user;

    const subReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!subReddit) {
      return apiResponse(res, "subreddit not found", {}, 404);
    }

    const isMember = await prisma.member.findFirst({
      where: { userId: id, subredditId: subReddit.id },
    });

    if (!isMember) {
      return apiResponse(res, "You are not a member", {}, 400);
    }

    await prisma.member.delete({
      where: {
        userId_subredditId: { userId: id, subredditId: subReddit.id },
      },
    });

    return apiResponse(res, "user left the subreddit successfully", {}, 200);
  }),
);

router.post(
  "/:name/posts",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { title, content, imageUrl } = req.body;
    const { id } = req.user;
    const { name } = req.params;

    if (!title || !content) {
      return apiResponse(res, "Title and content are required", {}, 400);
    }

    const foundSubReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!foundSubReddit) {
      return apiResponse(res, "subreddit not found", {}, 404);
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        imageUrl,
        authorId: id,
        subredditId: foundSubReddit.id,
      },
    });

    return apiResponse(res, "post created successfully", { newPost }, 201);
  }),
);

router.get(
  "/:name/posts",
  asyncHandler(async (req, res) => {
    const { name } = req.params;

    const foundSubReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!foundSubReddit) {
      return apiResponse(res, "this subreddit does not exist", {}, 404);
    }

    const posts = await prisma.post.findMany({
      where: { subredditId: foundSubReddit.id },
    });

    if (posts.length === 0) {
      return apiResponse(
        res,
        "this subreddit does not have any posts",
        {},
        404,
      );
    }

    return apiResponse(
      res,
      "subreddit posts have been sent successfully",
      { posts },
      200,
    );
  }),
);

router.get(
  "/:name/posts/:postId",
  asyncHandler(async (req, res) => {
    const { name, postId } = req.params;

    const foundSubReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!foundSubReddit) {
      return apiResponse(res, "this subreddit does not exist", {}, 404);
    }

    const userPost = await prisma.post.findFirst({
      where: { subredditId: foundSubReddit.id, id: postId },
    });

    if (!userPost) {
      return apiResponse(res, "no post found", {}, 404);
    }

    return apiResponse(res, "user post sent successfully", { userPost }, 200);
  }),
);

router.patch(
  "/:name/posts/:postId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name, postId } = req.params;
    const { id } = req.user;
    const { title, content, imageUrl } = req.body;

    const findSubReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!findSubReddit) {
      return apiResponse(res, "subreddit not found", {}, 404);
    }

    const findPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!findPost) {
      return apiResponse(res, "post does not exist", {}, 404);
    }

    if (findPost.authorId != id) {
      return apiResponse(res, "only author can update posts", {}, 403);
    }

    const updatePost = await prisma.post.update({
      where: { id: postId },
      data: { title, content, imageUrl },
    });

    return apiResponse(res, "post updated successfully", { updatePost }, 200);
  }),
);

router.delete(
  "/:name/posts/:postId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name, postId } = req.params;
    const { id } = req.user;

    const foundSubReddit = await prisma.subreddit.findFirst({
      where: { name },
    });

    if (!foundSubReddit) {
      return apiResponse(res, "this subreddit does not exist", {}, 404);
    }

    const findPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!findPost) {
      return apiResponse(res, "post does not exist", {}, 404);
    }

    if (findPost.authorId != id) {
      return apiResponse(res, "user can only delete its posts", {}, 403);
    }

    await prisma.post.delete({
      where: { id: findPost.id },
    });

    return apiResponse(res, "user post deleted successfully", {}, 200);
  }),
);

export default router;
