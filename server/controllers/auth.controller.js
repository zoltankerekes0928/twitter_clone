import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { fullName, userName, email, password } = req.body;

    const emailRegex = /^[a-zA-Z0-9_.+\-]+[\x40][a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ err: "This email is not correct" });
    }

    const userIsExist = await User.findOne({ userName });

    if (userIsExist) {
      return res.status(400).json({ err: "This usename is already taken" });
    }

    const emailIsExist = await User.findOne({ email });
    if (emailIsExist) {
      return res
        .status(400)
        .json({ err: "This email adress is already taken." });
    }

    if (password.length < 6) {
      return res.status(400).json({ err: "Password is too short" });
    }

    //hash password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      userName,
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
     
      await User.create(newUser); // to save into DB

      generateTokenAndSetCookie(newUser._id, res);

      return res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      });
    } else {
      return res.status(400).json({ err: "User data is invalid" });
    }
  } catch (err) {
    console.log(err.message);

    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ err: `${field} already exists.` });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = await User.findOne({ userName });
    const passwordIsCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !passwordIsCorrect) {
      return res
        .status(400)
        .json({ error: "This username or password is not valid" });
    }

    generateTokenAndSetCookie(user._id, res);

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });
  } catch (err) {
    console.log(err.message);

    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("jwt") //res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Log out succesful" });
  } catch (err) {
    console.log("Error in logout.");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    return res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ err: "User is not logged in" });
  }
};
