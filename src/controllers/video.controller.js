import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadLargeOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import {
  videoPartialZodSchema,
  videoZodSchema,
} from "../validators/video.validator.js";
import { cleanupLocalFiles } from "../utils/cleanupFiles.js";
import fs from "fs";

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
  const video = await uploadLargeOnCloudinary(videoLocalPath);
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
  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar"
  );
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (
    !video.isPublished &&
    video.owner._id.toString() !== req.user?._id?.toString()
  ) {
    throw new ApiError(403, "This video is not published");
  }

  video.views += 1;
  const updatedVideo = await video.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", updatedVideo));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const result = videoPartialZodSchema.safeParse(req.body);
  if (!result.success) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "No video found with this videoId");
  }
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only owner can edit his video");
  }

  const { title, description } = result.data;
  const thumbnailLocalPath = req.file?.path;
  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(400, "At least one field is required for update");
  }

  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(500, "Error uploading thumbnail to cloudinary");
    }
    await deleteFromCloudinary(video.thumbnail.publicId);
    video.thumbnail = {
      url: thumbnail.url,
      publicId: thumbnail.public_id,
    };
  }
  const updatedVideo = await video.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", updatedVideo));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only owner can delete his video");
  }
  await deleteFromCloudinary(video.videoFile.publicId);
  await deleteFromCloudinary(video.thumbnail.publicId);
  const deletedVideo = await Video.findByIdAndDelete(videoId);
  res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully", deletedVideo));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Only owner can toggle his video status");
  }
  video.isPublished = !video.isPublished;
  const updatedVideo = await video.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(
      new ApiResponse(200, "Publish status toggled successfully", updatedVideo)
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
