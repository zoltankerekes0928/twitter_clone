import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No Token provided" });
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    if (!decode) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    const user = await User.findById(decode.userId).select("-pasword");
    //console.log(user);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};