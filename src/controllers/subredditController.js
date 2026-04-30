import { exporter } from "../../utils/exporter.js";
const { apiResponse } = exporter;
import {
  createSubredditService,
  getAllSubredditsService,
  getSubredditService,
  joinSubredditService,
  updateSubredditService,
  leaveSubredditService,
  createSubredditPostService,
  getSubredditPostsService,
  getSubredditPostService,
  updateSubredditPostService,
  deleteSubredditPostService,
} from "../services/subredditService.js";

export async function createSubreddit(req, res) {
  const { id } = req.user;
  const { name, description, logoUrl } = req.body;

  if (!name || !description) {
    return apiResponse(
      res,
      "Please provide a proper name and description",
      {},
      400,
    );
  }

  const createSubredditServiceResponse = await createSubredditService(
    name,
    description,
    logoUrl,
    id,
  );

  if (createSubredditServiceResponse.isSubredditAlreadyExist) {
    return apiResponse(res, "subreddit already exists", {}, 400);
  }

  if (createSubredditServiceResponse.isSubredditCreated) {
    const { subreddit } = createSubredditServiceResponse;
    return apiResponse(
      res,
      "subreddit has been created successfully",
      { response: subreddit },
      201,
    );
  }
}
export async function getAllSubreddits(req, res) {
  const getAllSubredditsServiceResponse = await getAllSubredditsService();

  if (getAllSubredditsServiceResponse.isSubredditsNotFound) {
    return apiResponse(res, "No subreddits found", {}, 404);
  }

  const { subreddits } = getAllSubredditsServiceResponse;
  return apiResponse(res, "Subreddits found", { subreddits }, 200);
}

export async function getSubreddit(req, res) {
  const { name } = req.params;
  const getSubredditServiceResponse = await getSubredditService(name);

  if (getSubredditServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  const { subreddit } = getSubredditServiceResponse;
  return apiResponse(res, "subreddit found", { subreddit }, 200);
}

export async function joinSubreddit(req, res) {
  const { name } = req.params;
  const { id } = req.user;

  const joinSubredditServiceResponse = await joinSubredditService(name, id);

  if (joinSubredditServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (joinSubredditServiceResponse.isAlreadyMember) {
    return apiResponse(res, "Already a member", {}, 400);
  }

  if (joinSubredditServiceResponse.isMemberCreated) {
    const { membership } = joinSubredditServiceResponse;
    return apiResponse(
      res,
      "user joined subreddit successfully",
      { membership },
      200,
    );
  }
}
export async function updateSubreddit(req, res) {
  const { name: newName, description, logoUrl } = req.body;
  const { name } = req.params;
  const { id } = req.user;

  const updateSubredditServiceResponse = await updateSubredditService(
    name,
    id,
    newName,
    description,
    logoUrl,
  );

  if (updateSubredditServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (updateSubredditServiceResponse.isNotAuthor) {
    return apiResponse(res, "only author can edit subreddit", {}, 403);
  }

  const { subreddit } = updateSubredditServiceResponse;
  return apiResponse(res, "subreddit updated successfully", { subreddit }, 200);
}

export async function leaveSubreddit(req, res) {
  const { name } = req.params;
  const { id } = req.user;

  const leaveSubredditServiceResponse = await leaveSubredditService(name, id);

  if (leaveSubredditServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (leaveSubredditServiceResponse.isNotMember) {
    return apiResponse(res, "You are not a member", {}, 400);
  }

  if (leaveSubredditServiceResponse.isMemberLeft) {
    return apiResponse(res, "user left the subreddit successfully", {}, 200);
  }
}

export async function createSubredditPost(req, res) {
  const { title, content, imageUrl } = req.body;
  const { id } = req.user;
  const { name } = req.params;

  if (!title || !content) {
    return apiResponse(res, "Title and content are required", {}, 400);
  }

  const createSubredditPostServiceResponse = await createSubredditPostService(
    name,
    id,
    title,
    content,
    imageUrl,
  );

  if (createSubredditPostServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (createSubredditPostServiceResponse.isPostCreated) {
    const { post } = createSubredditPostServiceResponse;
    return apiResponse(res, "post created successfully", { post }, 201);
  }
}

export async function getSubredditPosts(req, res) {
  const { name } = req.params;

  const getSubredditPostsServiceResponse = await getSubredditPostsService(name);

  if (getSubredditPostsServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (getSubredditPostsServiceResponse.isPostsNotFound) {
    return apiResponse(res, "this subreddit does not have any posts", {}, 404);
  }

  const { posts } = getSubredditPostsServiceResponse;
  return apiResponse(res, "subreddit posts sent successfully", { posts }, 200);
}
export async function getSubredditPost(req, res) {
  const { name, postId } = req.params;

  const getSubredditPostServiceResponse = await getSubredditPostService(
    name,
    postId,
  );

  if (getSubredditPostServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (getSubredditPostServiceResponse.isPostNotFound) {
    return apiResponse(res, "post not found", {}, 404);
  }

  const { post } = getSubredditPostServiceResponse;
  return apiResponse(res, "post sent successfully", { post }, 200);
}
export async function updateSubredditPost(req, res) {
  const { name, postId } = req.params;
  const { id } = req.user;
  const { title, content, imageUrl } = req.body;

  const updateSubredditPostServiceResponse = await updateSubredditPostService(
    name,
    postId,
    id,
    title,
    content,
    imageUrl,
  );
  if (updateSubredditPostServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (updateSubredditPostServiceResponse.isPostNotFound) {
    return apiResponse(res, "post not found", {}, 404);
  }

  if (updateSubredditPostServiceResponse.isNotAuthor) {
    return apiResponse(res, "user can only edit its posts", {}, 403);
  }

  const { post } = updateSubredditPostServiceResponse;
  return apiResponse(res, "post updated successfully", { post }, 200);
}
export async function deleteSubredditPost(req, res) {
  const { name, postId } = req.params;
  const { id } = req.user;

  const deleteSubredditPostServiceResponse = await deleteSubredditPostService(
    name,
    postId,
    id,
  );

  if (deleteSubredditPostServiceResponse.isSubredditNotFound) {
    return apiResponse(res, "subreddit not found", {}, 404);
  }

  if (deleteSubredditPostServiceResponse.isPostNotFound) {
    return apiResponse(res, "post not found", {}, 404);
  }

  if (deleteSubredditPostServiceResponse.isNotAuthor) {
    return apiResponse(res, "user can only delete its posts", {}, 403);
  }

  if (deleteSubredditPostServiceResponse.isPostDeleted) {
    return apiResponse(res, "post deleted successfully", {}, 200);
  }
}
