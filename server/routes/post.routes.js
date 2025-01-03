import express from "express";
import { protectRoute } from "../middleware/protectroute.js";
import {
  getAllPost,
  getFollowingPosts,
  createPost,
  deletePost,
  getUserPosts,
  getLikedPosts,
  commentPost,
  likeUnlikePost,
} from "../controllers/post.controllers.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPost);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/likes/:id", protectRoute, getLikedPosts);
router.get("/user/:username", protectRoute, getUserPosts)
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentPost);
router.delete("/:id", protectRoute, deletePost);

export default router;
