import asyncHandler from "../utils/asyncHandler.js";
import {
  userZodSchema,
  userPartialZodSchema,
} from "../validators/user.validator.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

async function generateAccessAndRefreshTokens(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refreh tokens"
    );
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const result = userZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { username, fullName, email, password } = result.data;
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with this username/email already exists");
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
  });

  const response = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!response) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", response));
});

const loginUser = asyncHandler(async (req, res) => {
  const result = userPartialZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { email, username, password } = result.data;
  if (!email && !username) {
    throw new ApiError(400, "Email or Username is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  const user = await User.findOne({
    $or: [...(username ? [{ username }] : []), ...(email ? [{ email }] : [])],
  });
  if (!user) {
    throw new ApiError(404, "User with this email/username not found");
  }
  const pass = await user.isPasswordCorrect(password);
  if (!pass) {
    throw new ApiError(401, "Password is not correct");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggedOut successfully"));
});

export { registerUser, loginUser, logoutUser };
