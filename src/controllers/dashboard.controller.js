import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const profile = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
      },
    },
  ]);
  const totalSubscribers = await Subscription.countDocuments({
    channel: req.user._id,
  });
  const channelVideos = await Video.find({ owner: req.user._id }).select("_id");
  const videoIds = channelVideos.map((video) => video._id);
  const totalLikes = await Like.countDocuments({
    video: { $in: videoIds },
  });

  res.status(200).json(
    new ApiResponse(200, "Channel stats fetched successfully", {
      totalLikes,
      totalSubscribers,
      totalViews: profile[0]?.totalViews || 0,
      totalVideos: profile[0]?.totalVideos || 0,
    })
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
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
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  res
    .status(200)
    .json(new ApiResponse(200, "Channel videos fetched successfully", videos));
});

export { getChannelStats, getChannelVideos };
