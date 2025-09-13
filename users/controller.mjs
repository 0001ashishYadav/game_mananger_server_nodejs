import bcrypt from "bcrypt";
import prisma from "../prisma/db.mjs";
import { ServerError } from "../error.mjs";
import { UserLoginModel, UserSignupModel } from "./validation .mjs";
import sendEmail from "./email.mjs";
import emailQueue from "../queue/email.queue.mjs";
import { asyncJwtSign } from "../async.jwt.mjs";
import randomStrGen from "../tools/randomStrGen.mjs";

const signup = async (req, res, next) => {
  const result = await UserSignupModel.safeParseAsync(req.body);
  if (!result.success) {
    throw new ServerError(400, errorPritify(result));
  }

  const hasedPassword = await bcrypt.hash(req.body.password, 10);

  // 2. generate a 32 keyword random string

  const randomString = randomStrGen();

  // set token expiry time 15 minutes later

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes later

  const newUser = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.name,
      password: hasedPassword,
      resetToken: randomString,
      tokenExpiry: expiresAt,
    },
  });
  console.log(newUser);

  // 4. make link example http://localhost:5000/resetPassword/fgvjkdsuhvgyahfvajdsfahvdsjvbd

  const resetLink = `http://localhost:5000/resetPassword/${randomString}`;

  // 5. add this above link email replacing http://google.com

  await emailQueue.add("send_verification_email", {
    to: newUser.email,
    subject: "Verification Email",
    body: `<html>
    <h1>welcome to Game</h1>
    <a href="${resetLink}"'>Click here</a>
    </html>`,
  });

  // sendEmail(newUser.email, "Verification Email");
  console.log(req.body);

  res.json({ msg: "signup is successful" });
};

const login = async (req, res, next) => {
  const result = await UserLoginModel.safeParseAsync(req.body);
  if (!result.success) {
    throw new ServerError(400, errorPritify(result));
  }

  // find user by email from DB

  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  console.log(user);

  if (!user) {
    throw new ServerError(404, "user is not found");
  }

  if (!user.accountVerified) {
    throw new ServerError(404, "verify you account first");
  }

  if (!(await bcrypt.compare(req.body.password, user.password))) {
    throw new ServerError(401, "password mismatch");
  }

  const token = await asyncJwtSign(
    { id: user.id, name: user.name, email: user.email },
    process.env.TOKEN_SECRET
  );

  res.json({ msg: "login successful", token });
};

const forgotPassword = async (req, res, next) => {
  // 1. find User via email from req.body
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (!user) {
    throw new ServerError(404, "user is not found");
  }

  if (!user.accountVerified) {
    throw new ServerError(404, "verify you account first");
  }

  // 1. generate a 32 keyword random string

  const randomString = randomStrGen();

  // set token expiry time 15 minutes later

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes later

  // 3. update this string in DB with future 15min expiry time

  await prisma.user.update({
    where: {
      email: req.body.email,
    },
    data: {
      resetToken: randomString,
      tokenExpiry: expiresAt,
    },
  });

  // 4. make link example http://localhost:5000/resetPassword/fgvjkdsuhvgyahfvajdsfahvdsjvbd

  const resetLink = `http://localhost:5000/resetPassword/${randomString}`;

  // 5. send this link via email

  await emailQueue.add("send_verification_email", {
    to: req.body.email,
    subject: "Reset Password",
    body: `<html>
    <h1>Reset Password</h1>
    <a href=${resetLink}>Click here</a>
    </html>`,
  });

  res.json({ msg: "forgot password" });
};

const resetPassword = async (req, res, next) => {
  // 1. Extract token from req.body

  console.log(req.body.token);
  // 2. find User via token from DB

  if (!req.body.token || !req.body.password) {
    throw new ServerError(400, "token and password is required");
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: req.body.token,
    },
  });

  if (!user) {
    throw new ServerError(404, "user is not found");
  }

  // 3. check for token expiry

  if (new Date(user.tokenExpiry) < new Date()) {
    throw new ServerError(404, "token expired");
  }
  // 4. check if is accountVerified

  if (!user.accountVerified) {
    throw new ServerError(404, "verify you account first");
  }

  // 5. if account verified extract password from req.body
  // 6. hash password

  const hasedPassword = await bcrypt.hash(req.body.password, 10);
  // 7. update user password in DB
  await prisma.user.updateMany({
    where: {
      resetToken: req.body.token,
    },
    data: {
      password: hasedPassword,
      resetToken: null,
      tokenExpiry: null,
    },
  });
  // 8. send email password reset successful
  res.json({ msg: "reset password successul" });
};

const getMe = async (req, res, next) => {
  // 1. Extract user from request
  // 2. find user in DB by ID or Email
  // 3. Send user details without password
  res.json({ msg: "This is me" });
};

export { signup, login, forgotPassword, resetPassword, getMe };
