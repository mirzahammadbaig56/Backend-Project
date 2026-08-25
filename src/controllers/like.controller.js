import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }
  const isLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (!isLiked) {
    const like = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    if (!like) {
      throw new ApiError(500, "Something went wrong while liking this video");
    }
    res
      .status(201)
      .json(new ApiResponse(201, "Video liked successfully", like));
  } else {
    const unLike = await Like.deleteOne({
      video: videoId,
      likedBy: req.user._id,
    });
    if (!unLike) {
      throw new ApiError(500, "Something went wrong while unLiking this video");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Video unLiked successfully", unLike));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }
  const isLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (!isLiked) {
    const like = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    if (!like) {
      throw new ApiError(500, "Something went wrong while liking this comment");
    }
    res
      .status(201)
      .json(new ApiResponse(201, "Comment liked successfully", like));
  } else {
    const unLike = await Like.deleteOne({
      comment: commentId,
      likedBy: req.user._id,
    });
    if (!unLike) {
      throw new ApiError(
        500,
        "Something went wrong while unLiking this comment"
      );
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Comment unLiked successfully", unLike));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }
  const isLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (!isLiked) {
    const like = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    if (!like) {
      throw new ApiError(500, "Something went wrong while liking this tweet");
    }
    res
      .status(201)
      .json(new ApiResponse(201, "Tweet liked successfully", like));
  } else {
    const unLike = await Like.deleteOne({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    if (!unLike) {
      throw new ApiError(500, "Something went wrong while unLiking this tweet");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "Tweet unLiked successfully", unLike));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "video",
        as: "video",
        pipeline: [
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
        ],
      },
    },
    {
      $addFields: {
        video: { $first: "$video" },
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);
  res
    .status(200)
    .json(
      new ApiResponse(200, "Liked videos fetched successfully", likedVideos)
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
