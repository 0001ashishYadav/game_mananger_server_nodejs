import bcrypt from "bcrypt";
import { prisma, DB_ERR_CODES, Prisma } from "../prisma/db.mjs";
import { ServerError } from "../error.mjs";
import { UserLoginModel, UserSignupModel } from "./validation .mjs";
import sendEmail from "./email.mjs";
import emailQueue from "../queue/email.queue.mjs";
import { asyncJwtSign } from "../async.jwt.mjs";
import randomStrGen from "../tools/randomStrGen.mjs";
import { deleteImage, uploadImage } from "../storege/storage.mjs";

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

  try {
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === DB_ERR_CODES.UNIQUE_ERR) {
        throw new ServerError(401, "User with this email already exists.");
      }
    }
    throw err;
  }

  // sendEmail(newUser.email, "Verification Email");
  console.log(req.body);

  // IN FUTURE Implement something like this
  // const user = await catchDBError(await prisma.user.create({
  //   data: {
  //     email: req.body.email,
  //     name: req.body.name,
  //     password: hasedPassword,
  //     resetToken: randomStr,
  //     tokenExpiry: futureExpiryTime
  //   },
  // }))

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
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRY_TIME }
  );

  res.json({
    msg: "login successful",
    token,
    id: user.id,
    name: user.name,
    email: user.email,
    profilePhoto: user.profilePhoto,
  });
};

const forgotPassword = async (req, res, next) => {
  // 1. find User via email from req.body
  // const user = await prisma.user.findUnique({
  //   where: {
  //     email: req.body.email,
  //   },
  // });

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

  await prisma.user.updateManyAndReturn({
    where: {
      email: req.body.email,
    },
    data: {
      resetToken: randomString,
      tokenExpiry: expiresAt,
    },
  });

  if (userArr.length === 0) {
    throw new ServerError(404, "User not found, please signup first");
  }

  const user = userArr[0];

  // 4. make link example http://localhost:5000/resetPassword/fgvjkdsuhvgyahfvajdsfahvdsjvbd

  const link = `${req.protocol}://${process.env.FRONTEND_URL}/${randomStr}`;

  await emailQueue.add("forgot_pass", {
    to: user.email,
    subject: "Forgot Password",
    body: `<html>
      <h1>Hi, ${user.name}</h1>
      <a href=${link}>Click Here to reset password</a>
    </html>`,
  });
  res.json({ msg: "Email sent" });
};

const resetPassword = async (req, res, next) => {
  // 1. Extract token from req.body

  if (!req.body || !req.body.token) {
    throw new ServerError(401, "Invalid link or token");
  }

  console.log(req.body.token);
  // 2. find User via token from DB

  // if (!req.body.token || !req.body.password) {
  //   throw new ServerError(400, "token and password is required");
  // }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: req.body.token,
    },
  });

  if (!user) {
    throw new ServerError(404, "Invalid link or token");
  }

  // 3. check for token expiry

  if (new Date(user.tokenExpiry) < new Date()) {
    throw new ServerError(404, "Link expired");
  }
  // 4. check if is accountVerified

  if (user.accountVerified && !req.body.password) {
    if (req.body.password.length < 6) {
      throw new ServerError(401, "password should not be less than 6");
    }
    throw new ServerError(401, "password must be supplied");
  }

  // 5. if account verified extract password from req.body
  // 6. hash password

  if (user.accountVerified) {
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    await prisma.user.updateMany({
      where: { id: user.id },
      data: {
        password: hashedPass,
        resetToken: null,
        tokenExpiry: null,
      },
    });
    res.json({ msg: "reset password successful" });
  } else {
    await prisma.user.updateMany({
      where: { id: user.id },
      data: {
        accountVerified: true,
        resetToken: null,
        tokenExpiry: null,
      },
    });
    res.json({ msg: "Account verification successful" });
  }
};

const getMe = async (req, res, next) => {
  // 1. Extract user from request
  // 2. find user in DB by ID or Email
  // 3. Send user details without password
  res.json({ msg: "This is me", me: req.user });
};

const updateProfileImage = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
  });
  let result;
  if (!user.profilePhoto) {
    // Delete image from cloudnary
    const fileName = `${randomStrGen(32)}`;
    // upload to cloud storage
    result = await uploadImage(req.file.buffer, fileName, "profiles", true);
    // update file url in DB
  } else {
    const splittedUrl = user.profilePhoto.split("/");

    const fileNameWithExt = splittedUrl[splittedUrl.length - 1];
    const fileName = fileNameWithExt.split(".")[0];
    result = await uploadImage(req.file.buffer, fileName, "profiles", true);
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      profilePhoto: result.secure_url,
    },
  });

  res.json({ msg: "image uploaded successfully" });
};

const deleteProfileImage = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
  });

  console.log(user);

  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      profilePhoto: null,
    },
  });

  function extractPublicId(url) {
    // remove query params if any
    const cleanUrl = url.split("?")[0];
    // remove version part (/v123456789/)
    const withoutVersion = cleanUrl.replace(/\/v\d+\//, "/");
    // get everything after `upload/`
    const parts = withoutVersion.split("/upload/");
    return parts[1].replace(/\.[^.]+$/, ""); // remove extension
  }

  const publicId = extractPublicId(user.profilePhoto);

  const result = await deleteImage(publicId);

  console.log("result", result);

  res.json({ msg: `image deleted ${result.result}` });
};

export {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfileImage,
  deleteProfileImage,
};
