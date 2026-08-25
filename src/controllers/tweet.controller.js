import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { tweetZodSchema } from "../validators/tweet.validator.js";

const createTweet = asyncHandler(async (req, res) => {
  const result = tweetZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { content } = result.data;
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }
  res
    .status(201)
    .json(new ApiResponse(201, "Tweet created successfully", tweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
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
        owner: { $first: "$owner" },
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

  res
    .status(200)
    .json(new ApiResponse(200, "Tweets fetched successfully", tweets));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  const oldTweet = await Tweet.findById(tweetId);
  if (!oldTweet) {
    throw new ApiError(404, "No tweet found");
  }
  if (oldTweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can update his tweet");
  }
  const result = tweetZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { content } = result.data;
  oldTweet.content = content;
  const newTweet = await oldTweet.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new ApiResponse(200, "Tweet updated successfully", newTweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }
  const oldTweet = await Tweet.findById(tweetId);
  if (!oldTweet) {
    throw new ApiError(404, "No tweet found");
  }
  if (oldTweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can delete his tweet");
  }
  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully", deletedTweet));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
