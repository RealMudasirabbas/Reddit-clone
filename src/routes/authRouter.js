import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma-helper.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";

const router = Router();

router.post("/sign-up", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return apiResponse(res, "Please provide all credentials", {}, 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });

    if (existingUser) {
      return apiResponse(res, "Username or email already exists", {}, 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return apiResponse(res, "user created successfully", { token }, 201);
  } catch (error) {
    console.log(error);
    return apiResponse(res, "request failed", error, 500);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return apiResponse(res, "please provide an email", {}, 400);
    }
    if (!password) {
      return apiResponse(res, "please provide password", {}, 400);
    }
    const fetchUser = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!fetchUser) {
      return apiResponse(res, "user not found", {}, 404);
    }
    const { password: hashedPassword } = fetchUser;

    const validatePassword = await bcrypt.compare(password, hashedPassword);
    if (!validatePassword) {
      return apiResponse(res, "invalid password", {}, 400);
    }

    const token = jwt.sign(
      { userId: fetchUser.id, username: fetchUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return apiResponse(res, "user logged in successfully", { token }, 200);
  } catch (error) {
    return apiResponse(
      res,
      `request failed due to this error: ${error}`,
      {},
      500,
    );
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;

    const foundUser = await prisma.user.findUnique({
      where: {
        id,
      },
      omit: { password: true },
    });

    if (!foundUser) {
      return apiResponse(res, "user not found", {}, 404);
    }

    return apiResponse(
      res,
      "user data has been retrieved successfully",
      {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
      },
      200,
    );
  } catch (error) {
    return apiResponse(res, `error occured in me route: ${error}`, {}, 500);
  }
});

export default router;
