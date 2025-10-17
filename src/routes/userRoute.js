import express from "express";
import { getUserProfile, loginUser, registerUser, upgradeToSeller } from "../controllers/usersController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/profile", verifyToken, getUserProfile);
userRouter.post("/upgrade-to-seller", verifyToken, upgradeToSeller);

export default userRouter;
