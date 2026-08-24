import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { videoZodSchema } from "../validators/video.validator.js";
import { cleanupLocalFiles } from "../utils/cleanupFiles.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const matchStage = { isPublished: true };
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    } else {
      matchStage.owner = new mongoose.Types.ObjectId(userId);
    }
  }
  if (query) {
    matchStage.$or = [
      {
        title: { $regex: query, $options: "i" },
      },
      {
        description: { $regex: query, $options: "i" },
      },
    ];
  }

  const sortStage = {};
  const allowedSortedFields = ["duration", "title", "views", "createdAt"];
  if (sortBy && allowedSortedFields.includes(sortBy)) {
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortStage.createdAt = -1;
  }

  const aggregateVideos = Video.aggregate([
    {
      $match: matchStage,
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
      $sort: sortStage,
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const videos = await Video.aggregatePaginate(aggregateVideos, options);

  res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", videos));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const result = videoZodSchema.safeParse(req.body);
  if (!result.success) {
    cleanupLocalFiles(req.files);
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { title, description } = result.data;

  const videoLocalPath = req.files?.video?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }
  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!video) {
    throw new ApiError(400, "Error uploading video to cloudinary");
  }
  if (!thumbnail) {
    throw new ApiError(400, "Error uploading thumbnail to cloudinary");
  }
  const publishVideo = await Video.create({
    title,
    description,
    videoFile: {
      url: video.url,
      publicId: video.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      publicId: thumbnail.public_id,
    },
    duration: video.duration,
    owner: req.user?._id,
  });

  if (!publishVideo) {
    throw new ApiError(500, "Something went wrong while publishing video");
  }

  res
    .status(201)
    .json(new ApiResponse(201, "Video published successfully", publishVideo));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("owner", "username fullName avatar");
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (
    !video.isPublish &&
    video.owner.username !== req.user?.username
  ) {
    throw new ApiError(403, "This video is not published");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
