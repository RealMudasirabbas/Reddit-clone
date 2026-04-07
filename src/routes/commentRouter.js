import { Router } from "express";
import { prisma } from "../db/prisma-helper.js";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.post("/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const { postId } = req.params;
    const { id } = req.user;

    if (!content) {
      return res.status(400).json({
        message: "please provide content",
      });
    }

    const findPost = await prisma.post.findFirst({
      where: {
        id: postId,
      },
    });

    if (!findPost) {
      return res.status(404).json({
        message: "no post exist for this id",
      });
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

      return res.status(201).json({
        message: "parent comment created successfully",
        comment,
      });
    }
    if (parentId) {
      const isParentCommentExist = await prisma.comment.findUnique({
        where: {
          id: parentId,
        },
      });

      if (!isParentCommentExist) {
        return res.status(404).json({
          message: "comment parent not found",
        });
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: id,
          postId: findPost.id,
          parentId: parentId,
        },
      });
      return res.status(201).json({
        message: "reply comment created successfully",
        comment,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "comment creation failed. please try again",
    });
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
      return res.status(404).json({
        message: "no post exist for this id",
      });
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
      return res.status(404).json({
        message: "no comments found on this post",
      });
    }

    return res.status(200).json({
      message: "all comments sent successfully",
      findAllComments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "could not fetch comments.please try again",
      errorMsg: error.message,
    });
  }
});

router.delete(
  "/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { commentId, postId } = req.params;
      const { id } = req.user;

      const foundPost = await prisma.post.findFirst({
        where: {
          id:postId,
        },
      });

      if (!foundPost) {
        return res.status(404).json({
          message: "this post does not exist",
        });
      }

      const isCommentExist = await prisma.comment.findFirst({
        where: {
          id:commentId,
        },
      });

      if (!isCommentExist) {
        return res.status(404).json({
          message: "this comment does not exist",
        });
      }

      if (isCommentExist.authorId != id) {
        return res.status(403).json({
          message: "author can only delete its comments",
        });
      }


      
        const deletedComment = await prisma.comment.delete({
          where: {
            id: commentId,
          },
        });
       
        
      

      return res.status(200).json({
        message: "user comment deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "could not delete the comment.please try again",
      });
    }
  },
);

export default router;
