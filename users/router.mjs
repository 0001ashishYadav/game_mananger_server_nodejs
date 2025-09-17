import express from "express";
import { authentication } from "../auth.mjs";
import { singleImageUploadMiddleware } from "../storege/config.mjs";
const userRouter = express.Router();
import {
  forgotPassword,
  getMe,
  login,
  resetPassword,
  signup,
  updateProfileImage,
} from "./controller.mjs";

userRouter
  .post("/signup", signup)
  .post("/login", login)
  .patch("/forgotPassword", forgotPassword)
  .patch("/resetPassword", resetPassword)
  .get("/profile", authentication, getMe)
  .patch(
    "/profile/image",
    authentication,
    singleImageUploadMiddleware("image"),
    updateProfileImage
  );

export default userRouter;
