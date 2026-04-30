import { exporter } from "../../utils/exporter.js";
const {prisma} = exporter;
export async function createOrUpdateVoteService(
  userId,
  postId,
  voteType,
) {
  const post = await prisma.post.findFirst({
    where: { id: postId },
  });

  if (!post) {
    return {postNotFound: true};
  }

  const findVote = await prisma.vote.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (!findVote) {
    const createVote = await prisma.vote.create({
      data: { type: voteType, userId, postId: post.id },
    });
    return {vote: createVote, created: true};
  }

  if (findVote.type === voteType) {
    await prisma.vote.delete({
      where: { userId_postId: { userId, postId } },
    });
    return {voteDeleted: true};
  }

  const updateVote = await prisma.vote.update({
    where: { userId_postId: { userId, postId } },
    data: { type: voteType },
  });

  return {vote: updateVote, updated: true};
}

export async function createOrUpdateCommentVoteService(userId, commentId, voteType) {
  

  const comment = await prisma.comment.findFirst({
    where: { id: commentId },
  });

  if (!comment) {
    return { commentNotFound: true };
  }

  const findVote = await prisma.vote.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (!findVote) {
    const createVote = await prisma.vote.create({
      data: { type: voteType, userId, commentId: comment.id },
    });
    return { vote: createVote, created: true };
  }

  if (findVote.type === voteType) {
    await prisma.vote.delete({
      where: { userId_commentId: { userId, commentId } },
    });
    return { voteDeleted: true };
  }

  const updateVote = await prisma.vote.update({
    where: { userId_commentId: { userId, commentId } },
    data: { type: voteType },
  });

  return { vote: updateVote, updated: true };
}