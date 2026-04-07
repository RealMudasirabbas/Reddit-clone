import { Router } from "express";
import { prisma } from "../db/prisma-helper.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { name, description, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({
        message: "Please provide a proper name",
      });
    }

    const isSubredditExist = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (isSubredditExist) {
      return res.status(400).json({
        message: "subreddit already exists",
      });
    }

    const createSubreddit = await prisma.subreddit.create({
      data: {
        name,
        description,
        logoUrl,
        authorId: id,
      },
    });

    return res.status(201).json({
      message: "subreddit has been created successfully",
      response: createSubreddit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "subreddit creation failed.please try again",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const allSubReddits = await prisma.subreddit.findMany();

    if (allSubReddits.length === 0) {
      return res.status(404).json({
        message: "no subreddits found",
      });
    }
    return res.status(200).json({
      message: "subreddits has been sent successfully",
      allSubReddits,
    });
  } catch (error) {
    return res.status(500).json({
      message: "could not find subreddits. please try again later",
    });
  }
});

router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const foundSubreddit = await prisma.subreddit.findFirst({
      where: { name },
    });
    if (!foundSubreddit) {
      return res.status(404).json({
        message: "subreddit not found",
      });
    }

    return res.status(200).json({
      message: "subreddit has been sent successfully",
      foundSubreddit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "could not find subreddit. please try again later",
    });
  }
});

router.post("/join/:name", authMiddleware, async (req, res) => {
  try {
    const { name } = req.params;
    const { id } = req.user;
    const subReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (!subReddit) {
      return res.status(404).json({
        message: "subreddit not found",
      });
    }
    const alreadyMember = await prisma.member.findFirst({
      where: { userId: id, subredditId: subReddit.id },
    });

    if (alreadyMember) {
      return res.status(400).json({ message: "Already a member" });
    }

    const joinSubReddit = await prisma.member.create({
      data: { userId: id, subredditId: subReddit.id },
    });

    return res.status(201).json({
      message: "user joined subreddit successfully",
      membership: joinSubReddit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "joining to subreddit failed. please try again",
      err: error.message,
    });
  }
});

router.patch("/:name", authMiddleware, async (req, res) => {
  try {
    const { name: newName, description, logoUrl } = req.body;
    const { name } = req.params;
    const { id } = req.user;

    const subReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });
    if (!subReddit) {
      return res.status(404).json({
        message: "subreddit not found",
      });
    }

    if (subReddit.authorId != id) {
      return res.status(403).json({
        message: "only author can edit subreddit",
      });
    }

    const updateSubReddit = await prisma.subreddit.update({
      where: {
        id: subReddit.id,
        authorId: id,
      },
      data: {
        name: newName,
        description,
        logoUrl,
      },
    });

    return res.status(200).json({
      message: "subreddit updated successfully",
      updateSubReddit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "subreddit updation failed",
    });
  }
});

router.post("/leave/:name", authMiddleware, async (req, res) => {
  try {
    const { name } = req.params;
    const { id } = req.user;
    const subReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (!subReddit) {
      return res.status(404).json({
        message: "subreddit not found",
      });
    }
    const isMember = await prisma.member.findFirst({
      where: { userId: id, subredditId: subReddit.id },
    });

    if (!isMember) {
      return res.status(400).json({ message: "You are not a member" });
    }
    const leaveSubReddit = await prisma.member.delete({
      where: {
        userId_subredditId: {
          userId: id,
          subredditId: subReddit.id,
        },
      },
    });

    return res.status(201).json({
      message: "user left the subreddit successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "leaving the subreddit failed. please try again",
      err: error.message,
    });
  }
});

router.post("/:name/posts", authMiddleware, async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;
    const { id } = req.user;
    const { name } = req.params;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }
    const foundSubReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (!foundSubReddit) {
      return res.status(404).json({
        message: "subreddit not found",
      });
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

    return res.status(201).json({
      message: "post created successfully",
      newPost,
    });
  } catch (error) {
    return res.status(500).json({
      message: "post creation failed.please try again",
    });
  }
});

router.get("/:name/posts", async (req, res) => {
  try {
    const { name } = req.params;
    const foundSubReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (!foundSubReddit) {
      return res.status(404).json({
        message: "this subreddit does not exist",
      });
    }

    const posts = await prisma.post.findMany({
      where: {
        subredditId: foundSubReddit.id,
      },
    });
    if (posts.length === 0) {
      return res.status(404).json({
        message: "this subreddit does not have any posts",
      });
    }

    return res.status(200).json({
      message: "subreddit posts have been sent successfully",
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "could not fetch posts. please try again",
    });
  }
});

router.get("/:name/posts/:postId", async (req, res) => {
  try {
    const { name, postId } = req.params;

    const foundSubReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (!foundSubReddit) {
      return res.status(404).json({
        message: "this subreddit does not exist",
      });
    }

    const userPost = await prisma.post.findFirst({
      where: {
        subredditId: foundSubReddit.id,
        id: postId,
      },
    });

    if (!userPost) {
      return res.status(404).json({
        message: "no post found",
      });
    }

    return res.status(200).json({
      message: "user post sent successfully",
      userPost,
    });
  } catch (error) {
    return res.status(500).json({
      message: "could not fetch post.please try again",
    });
  }
});

router.patch("/:name/posts/:postId", authMiddleware, async (req, res) => {
  try {
    const { name, postId } = req.params;
    const { id } = req.user;
    const { title, content, imageUrl } = req.body;
    const findSubReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (!findSubReddit) {
      return res.status(404).json({
        message: "subreddit not found",
      });
    }

    const findPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!findPost) {
      return res.status(404).json({
        message: "post does not exist",
      });
    }

    if (findPost.authorId != id) {
      return res.status(403).json({
        message: "only author can update posts",
      });
    }

    const updatePost = await prisma.post.update({
      where: {
        id: postId,
      },
      data:{
        title,
        content,
        imageUrl
      }
    });
    return res.status(200).json({
      message: "post updated successfully",
      updatePost
    });
  } catch (error) {
    return res.status(500).json({
      message: "updating post failed",
    });
  }
});

router.delete("/:name/posts/:postId", authMiddleware, async (req, res) => {
  try {
    const { name, postId } = req.params;
    const { id } = req.user;

    const foundSubReddit = await prisma.subreddit.findFirst({
      where: {
        name,
      },
    });

    if (!foundSubReddit) {
      return res.status(404).json({
        message: "this subreddit does not exist",
      });
    }

    const findPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!findPost) {
      return res.status(404).json({
        message: "post does not exist",
      });
    }

    if (findPost.authorId != id) {
      return res.status(403).json({
        message: "user can only delete its posts",
      });
    }

    const deletedPost = await prisma.post.delete({
      where: {
        id: findPost.id,
      },
    });

    return res.status(200).json({
      message: "user post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "could not delete post.please try again",
    });
  }
});

export default router;
