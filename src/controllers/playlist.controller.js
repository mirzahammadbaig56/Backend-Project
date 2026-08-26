import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  playlistZodSchema,
  playlistPartialZodSchema,
} from "../validators/playlist.validator.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const result = playlistZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { name, description } = result.data;
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Something went wrong while creating playlist");
  }
  res
    .status(201)
    .json(new ApiResponse(201, "Playlist created successfully", playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }
  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
        ],
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
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        createdAt: 1,
      },
    },
  ]);
  res
    .status(200)
    .json(new ApiResponse(200, "Playlists fetched successfully", playlists));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
        ],
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
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        createdAt: 1,
      },
    },
  ]);
  if (!playlist?.length) {
    throw new ApiError(404, "Playlist not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, "Playlist fetched successfully", playlist[0]));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can add video to his playlist");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "No video found");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Video added to playlist successfully",
        updatedPlaylist
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can remove video from his playlist");
  }
  if (!playlist.videos.map((id) => id.toString()).includes(videoId)) {
    throw new ApiError(404, "This video is not in this playlist");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Video removed from playlist successfully",
        updatedPlaylist
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can delete his playlist");
  }
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  res
    .status(200)
    .json(
      new ApiResponse(200, "Playlist deleted successfully", deletedPlaylist)
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "No playlist found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can update his playlist");
  }
  const result = playlistPartialZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { name, description } = result.data;
  if (!name && !description) {
    throw new ApiError(400, "At least one field is required to update");
  }
  if (name) playlist.name = name;
  if (description) playlist.description = description;
  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(
      new ApiResponse(200, "Playlist updated successfully", updatedPlaylist)
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
