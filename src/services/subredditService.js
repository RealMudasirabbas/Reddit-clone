import { exporter } from "../../utils/exporter.js";
const { prisma } = exporter;

export async function createSubredditService(
  name,
  description,
  logoUrl,
  userId,
) {
  const isSubredditExist = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (isSubredditExist) {
    return { isSubredditAlreadyExist: true };
  }

  const createSubreddit = await prisma.subreddit.create({
    data: { name, description, logoUrl, authorId: userId },
  });

  return { isSubredditCreated: true, subreddit: createSubreddit };
}

export async function getAllSubredditsService() {
  const allSubReddits = await prisma.subreddit.findMany();

  if (allSubReddits.length === 0) {
    return { isSubredditsNotFound: true };
  }

  return { isSubredditsFound: true, subreddits: allSubReddits };
}

export async function getSubredditService(name) {
  const foundSubreddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!foundSubreddit) {
    return { isSubredditNotFound: true };
  }

  return { isSubredditFound: true, subreddit: foundSubreddit };
}

export async function joinSubredditService(name, userId) {
  const subReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!subReddit) {
    return { isSubredditNotFound: true };
  }

  const alreadyMember = await prisma.member.findFirst({
    where: { userId: userId, subredditId: subReddit.id },
  });

  if (alreadyMember) {
    return { isAlreadyMember: true };
  }

  const joinSubReddit = await prisma.member.create({
    data: { userId: userId, subredditId: subReddit.id },
  });

  return { isMemberCreated: true, membership: joinSubReddit };
}

export async function updateSubredditService(
  name,
  userId,
  newName,
  description,
  logoUrl,
) {
  const subReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!subReddit) {
    return { isSubredditNotFound: true };
  }

  if (subReddit.authorId !== userId) {
    return { isNotAuthor: true };
  }

  const updateSubReddit = await prisma.subreddit.update({
    where: { id: subReddit.id },
    data: { name: newName, description, logoUrl },
  });

  return { isSubredditUpdated: true, subreddit: updateSubReddit };
}

export async function leaveSubredditService(name, userId) {
  const subReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!subReddit) {
    return { isSubredditNotFound: true };
  }

  const isMember = await prisma.member.findFirst({
    where: { userId: userId, subredditId: subReddit.id },
  });

  if (!isMember) {
    return { isNotMember: true };
  }

  await prisma.member.delete({
    where: {
      userId_subredditId: { userId: userId, subredditId: subReddit.id },
    },
  });

  return { isMemberLeft: true };
}

export async function createSubredditPostService(
  name,
  userId,
  title,
  content,
  imageUrl,
) {
  const foundSubReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!foundSubReddit) {
    return { isSubredditNotFound: true };
  }

  const newPost = await prisma.post.create({
    data: {
      title,
      content,
      imageUrl,
      authorId: userId,
      subredditId: foundSubReddit.id,
    },
  });

  return { isPostCreated: true, post: newPost };
}

export async function getSubredditPostsService(name) {
  const foundSubReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!foundSubReddit) {
    return { isSubredditNotFound: true };
  }

  const posts = await prisma.post.findMany({
    where: { subredditId: foundSubReddit.id },
  });

  if (posts.length === 0) {
    return { isPostsNotFound: true };
  }

  return { isPostsFound: true, posts };
}

export async function getSubredditPostService(name, postId) {
  const foundSubReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!foundSubReddit) {
    return { isSubredditNotFound: true };
  }

  const userPost = await prisma.post.findFirst({
    where: { subredditId: foundSubReddit.id, id: postId },
  });

  if (!userPost) {
    return { isPostNotFound: true };
  }

  return { isPostFound: true, post: userPost };
}

export async function updateSubredditPostService(
  name,
  postId,
  userId,
  title,
  content,
  imageUrl,
) {
  const findSubReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!findSubReddit) {
    return { isSubredditNotFound: true };
  }

  const findPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!findPost) {
    return { isPostNotFound: true };
  }

  if (findPost.authorId !== userId) {
    return { isNotAuthor: true };
  }

  const updatePost = await prisma.post.update({
    where: { id: postId },
    data: { title, content, imageUrl },
  });

  return { isPostUpdated: true, post: updatePost };
}

export async function deleteSubredditPostService(name, postId, userId) {
  const foundSubReddit = await prisma.subreddit.findFirst({
    where: { name },
  });

  if (!foundSubReddit) {
    return { isSubredditNotFound: true };
  }

  const findPost = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!findPost) {
    return { isPostNotFound: true };
  }

  if (findPost.authorId !== userId) {
    return { isNotAuthor: true };
  }

  await prisma.post.delete({
    where: { id: findPost.id },
  });

  return { isPostDeleted: true };
}
