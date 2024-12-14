import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ userName: username }).select("-password");

    if (!user) {
      res.status(400).json({ message: "User data not available" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params; // we get the id by params
    const userToModify = await User.findOne({ _id: id }); //we check User that we want to follow
    const currentUser = await User.findOne({ _id: req.user._id }); //we check current Urer

    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "You can not follow yourself" });
    }

    if (!userToModify || !currentUser) {
      return res.status(400).json({ error: "Profile not found" });
    }

    const isFollowing = currentUser.following.includes(id); // this is the answer for if you follow or not this user

    if (isFollowing) {
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "User unfollowed succesfully" });
    } else {
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      const newNotfication = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });

      await Notification.create(newNotfication);
      res.status(200).json({ message: "User followed succesfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // const userFollowedByMe = await User.findById(userId).select("following"); // this is my followed users array

    const user = await User.findById(req.user._id);

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId, $nin: userTest.following },
        },
      },
      { $sample: { size: 10 } },
      { $project: { password: 0 } },
    ]);
     // users without me. i dont want to see myself in suggested users.
    /*  const filteredUser = users.filter(
      (user) => !req.user.following.includes(user._id)
    );*/

    const suggestedUser = users.slice(0, 4);
    
    res.status(200).json(suggestedUser);
   
  } catch (err) {
    res.status(400).json({ err: err.measseg });
  }
};

export const updateUser = async (req, res) => {
  const { fullName, email, userName, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  let user = req.user;

  try {
    /*  let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json("User not exist");
    }
   console.log(user);*/

    if (
      (!currentPassword && newPassword) ||
      (!newPassword && currentPassword)
    ) {
      return res
        .status(400)
        .json("Please provide both new and current password.");
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json("Password not correct");
      }
      if (currentPassword.length < 6) {
        return res
          .status(400)
          .json("Password must be at least 6 characters long.");
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudinary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }
      const uploadedResult = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedResult.secure_url;
    }

    if (coverImg) {
      if (coverImg.profileImg) {
        await cloudinary.uploader.destroy(
          user.coverImg.split("/").pop().split(".")[0]
        );
      }

      const uploadedResult = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedResult.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.userName = userName || user.userName;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    // password souldn't be sent to client
    user.password = null;
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ err: "Internal server error" });
  }
};
