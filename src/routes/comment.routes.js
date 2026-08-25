import { Router } from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:videoId").get(getVideoComments).post(verifyJwt, addComment);
router
  .route("/c/:commentId")
  .patch(verifyJwt, updateComment)
  .delete(verifyJwt, deleteComment);

export default router;
