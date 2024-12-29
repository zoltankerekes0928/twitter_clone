import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;

    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (!text && !img) {
      return res.status(400).json({ message: "Post must have image and text" });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await Post.create(newPost);
    res.status(201).json(newPost);
  } catch (err) {
    return res.status(500).json({ err: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (req.user._id.toString() !== post.user.toString()) {
      return res
        .status(401)
        .json({ err: "You are not authorized to delete this post" });
    }
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);

    return res.status(500).json({ err: "Internal server error" });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const user = req.user._id;

    if (!text) {
      return res.status(404).json({ message: " Text is required" });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = { user, text };
    post.comments.push(comment);
    await post.save();

    return res.status(201).json({ message: "You commented this post" });
  } catch (err) {
    res.status(500).json({ err: "Internal server error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const user = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLikedByUser = post.likes.includes(user);

    if (isLikedByUser) {
      // post.likes.pull(user)
      // await post.save()
      await Post.updateOne({ _id: postId }, { $pull: { likes: user } });
      await User.updateOne({ _id: user }, { $pull: { likedPosts: postId } });
      return res.status(201).json({ message: "You unliked the post" });
    } else {
      // post.likes.push(user)
      // await post.save()
      await Post.updateOne({ _id: postId }, { $push: { likes: user } });
      await User.updateOne({ _id: user }, { $push: { likedPosts: postId } });

      const notification = new Notification({
        from: user,
        to: post.user,
        type: "like",
      });

      await Notification.create(notification);
      return res.status(201).json({ message: "You liked the post" });
    }
  } catch (err) {
    return res.status(500).json({ err: "Internal server error" });
  }
};

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      res.status(404).json([]);
    }

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ err: "Internal server error" });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    const posts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }
    return res.status(200).json(posts);
  } catch (err) {
    return res.status(500).json({ err: "Internal server error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const feedPost = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(feedPost);
  } catch (err) {
    return res.status(500).json({ err: "Internal server error." });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userName = req.params.username;

    const userIsExist = await User.findOne({ userName });
    const getUserPosts = await Post.find({ user: userIsExist._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(getUserPosts);
  } catch (err) {
    return res.status(500).json({ err: "Internal server error." });
  }
};
