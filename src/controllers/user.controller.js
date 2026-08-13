import asyncHandler from "../utils/asyncHandler.js";
import { userZodSchema } from "../validators/user.validator.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const result = userZodSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    throw new ApiError(400, "Validation failed", errors);
  }
  const { username, fullName, email, password } = result.data;
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if(existedUser){
    throw new ApiError(409, "User with this username/email already exists");
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage? coverImage.url : ""
  })

  const response = await User.findById(user._id).select("-password -refreshToken");
  if(!response){
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  res.status(201).json(new ApiResponse(201, "User registered successfully", response));
});

export { registerUser };
