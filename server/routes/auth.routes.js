import express from "express";
import { signup, login, logout, getMe } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectroute.js";
const router = express.Router();

router.get("/me", protectRoute, getMe) //protectRoute -> this is a middleware function and in it we can check user's token.
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;
