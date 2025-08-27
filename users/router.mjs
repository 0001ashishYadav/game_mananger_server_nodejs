import express from "express";
const userRouter = express.Router();
import { forgotPassword, login, resetPassword, signup } from "./controller.mjs";

userRouter
  .post("/signup", signup)
  .post("/login", login)
  .post("/forgot-password", forgotPassword)
  .post("/reset-password", resetPassword);

export default userRouter;
