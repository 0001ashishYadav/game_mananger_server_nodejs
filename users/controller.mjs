import bcrypt from "bcrypt";
import prisma from "../prisma/db.mjs";
import { ServerError } from "../error.mjs";
import { UserLoginModel, UserSignupModel } from "./validation .mjs";
import sendEmail from "./email.mjs";
import emailQueue from "../queue/email.queue.mjs";

const signup = async (req, res, next) => {
  const result = await UserSignupModel.safeParseAsync(req.body);
  if (!result.success) {
    throw new ServerError(400, errorPritify(result));
  }

  const hasedPassword = await bcrypt.hash(req.body.password, 10);

  const newUser = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.name,
      password: hasedPassword,
    },
  });
  console.log(newUser);

  // TODO: send account verification email -> nodemailer

  await emailQueue.add("send_verification_email", {
    to: newUser.email,
    subject: "Verification Email",
    body: `<html>
    <h1>welcome to Game</h1>
    <a href="https://google.com"'>Click here</a>
    </html>`,
  });

  // sendEmail(newUser.email, "Verification Email");
  console.log(req.body);

  res.json({ msg: "signup is successful" });
};

const login = async (req, res, next) => {
  // TODO: find user by email from DB

  // TODO: check is account verified
  // TODO: match hased password
  // TODO: Generate JWT Token

  res.json({ msg: "login done" });
};

const forgotPassword = (req, res, next) => {
  res.json({ msg: "forgot password" });
};
const resetPassword = (req, res, next) => {
  res.json({ msg: "reset password" });
};

export { signup, login, forgotPassword, resetPassword };
