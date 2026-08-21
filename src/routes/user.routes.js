import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updatecoverImage,
  getChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

// secured routes
userRouter.route("/logout").post(verifyJwt, logoutUser);
userRouter.route("/change-password").post(verifyJwt, changeUserPassword);
userRouter.route("/current-user").get(verifyJwt, getCurrentUser);
userRouter.route("/update-account").patch(verifyJwt, updateAccountDetails);
userRouter
  .route("/avatar")
  .patch(verifyJwt, upload.single("avatar"), updateAvatar);
userRouter
  .route("/cover-image")
  .patch(verifyJwt, upload.single("coverImage"), updatecoverImage);
userRouter.route("/watch-history").get(verifyJwt, getWatchHistory);
userRouter.route("/c/:username").get(getChannelProfile);

export default userRouter;
