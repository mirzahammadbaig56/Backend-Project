import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }
  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const comments = await Comment.aggregatePaginate(commentsAggregate, options);
  res
    .status(200)
    .json(new ApiResponse(200, "Comments fetched successfully", comments));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content of the comment is required");
  }
  if (content.length < 5) {
    throw new ApiError(400, "Comment should be atleast 5 characters long");
  }
  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });
  if (!newComment) {
    throw new ApiError(500, "Something went wrong while adding comment");
  }
  res
    .status(201)
    .json(new ApiResponse(201, "Comment added successfully", newComment));
});

const updateComment = asyncHandler(async (req, res) => {
  
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
