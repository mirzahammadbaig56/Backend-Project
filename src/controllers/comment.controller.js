import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { commentZodSchema } from "../validators/comment.validator.js";

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
  const result = commentZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { content } = result.data;
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
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }
  const oldComment = await Comment.findById(commentId);
  if (!oldComment) {
    throw new ApiError(404, "No comment found");
  }
  if (oldComment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can update his comment");
  }
  const result = commentZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { content } = result.data;
  oldComment.content = content;
  const updatedComment = await oldComment.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new ApiResponse(200, "Comment updated successfully", updatedComment));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "No comment found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can delete his comment");
  }
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully", deletedComment));
});

export { getVideoComments, addComment, updateComment, deleteComment };
