import { exporter } from '../../utils/exporter.js';
const { prisma } = exporter;

export async function createCommentService(content, userId, postId, parentId) {
    const findPost = await prisma.post.findFirst({
        where: { id: postId },
    });

    if (!findPost) {
        return { postNotFound: true };
    }

    if (parentId) {
        const isParentCommentExist = await prisma.comment.findUnique({
            where: { id: parentId },
        });

        if (!isParentCommentExist) {
            return { parentCommentNotFound: true };
        }
    }

    const comment = await prisma.comment.create({
        data: {
            content,
            authorId: userId,
            postId: findPost.id,
            parentId: parentId || null,
        },
    });

    return { success: true, comment };
}

export async function getAllCommentsService(postId) {
    const findPost = await prisma.post.findFirst({
        where: { id: postId },
    });

    if (!findPost) {
        return { postNotFound: true };
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
        return { commentsNotFound: true };
    }

    return { success: true, findAllComments };
}

export async function updateCommentService(userId, commentId, content) {
    const isCommentExist = await prisma.comment.findFirst({
        where: { id: commentId },
    });

    if (!isCommentExist) {
        return { commentNotFound: true };
    }

    if (isCommentExist.authorId !== userId) {
        return { unauthorized: true };
    }

    const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
    });

    return { success: true, updatedComment };
}

export async function deleteCommentService(userId, commentId) {
    const isCommentExist = await prisma.comment.findFirst({
        where: { id: commentId },
    });

    if (!isCommentExist) {
        return { commentNotFound: true };
    }

    if (isCommentExist.authorId !== userId) {
        return { unauthorized: true };
    }

    await prisma.comment.delete({
        where: { id: commentId },
    });

    return { success: true };
}
