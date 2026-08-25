import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }
  if (channelId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }
  const isSubscribed = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });
  if (!isSubscribed) {
    const subscribe = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    if (!subscribe) {
      throw new ApiError(
        500,
        "Something went wrong while subscribing to channel"
      );
    }
    res
      .status(201)
      .json(new ApiResponse(201, "Channel subscribed successfully", subscribe));
  } else {
    const unSubscribe = await Subscription.deleteOne({
      subscriber: req.user._id,
      channel: channelId,
    });
    if (!unSubscribe) {
      throw new ApiError(
        500,
        "Something went wrong while subscribing to channel"
      );
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "Channel unSubscribed successfully", unSubscribe)
      );
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
        subscriber: { $first: "$subscriber" },
      },
    },
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, "Subscribers fetched successfully", subscribers)
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber Id");
  }
  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
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
        channel: { $first: "$channel" },
      },
    },
    {
      $project: {
        channel: 1
      }
    }
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, "Subscriptions fetched successfully", subscriptions)
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
