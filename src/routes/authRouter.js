import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma-helper.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";
import { randomBytes } from "crypto";
import generateAccessAndRefreshTokens from "../../utils/generateTokens.js";
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

    const refreshToken = randomBytes(32).toString("hex");
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "15min" },
    );
    const savedRefreshToken = await prisma.refreshToken.create({
      data: {
        refreshToken: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return apiResponse(
      res,
      "user created successfully",
      { accessToken: token, refreshToken: refreshToken },
      201,
    );
  } catch (error) {
    console.log(error);
    return apiResponse(res, "request failed", error, 500);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return apiResponse(res, "please provide email or password", {}, 400);
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
      { expiresIn: "15min" },
    );
    const isRefreshTokenExist = await prisma.refreshToken.findFirst({
      where: {
        userId: fetchUser.id,
      },
    });

    if (!isRefreshTokenExist) {
      const createNewRefreshToken = randomBytes(32).toString("hex");
      await prisma.refreshToken.create({
        data: {
          refreshToken: createNewRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: fetchUser.id,
        },
      });

      return apiResponse(
        res,
        "user logged in successfully",
        {
          accessToken: token,
          refreshToken: createNewRefreshToken,
        },
        200,
      );
    }

    if (isRefreshTokenExist?.expiresAt < new Date()) {
      const createNewRefreshToken = randomBytes(32).toString("hex");

      await prisma.refreshToken.update({
        where: {
          id: isRefreshTokenExist.id,
        },
        data: {
          refreshToken: createNewRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userId: fetchUser.id,
        },
      });
      return apiResponse(
        res,
        "user logged in successfully",
        {
          accessToken: token,
          refreshToken: createNewRefreshToken,
        },
        200,
      );
    }

    return apiResponse(
      res,
      "user loggedIn successfully",
      {
        accessToken: token,
        refreshToken: isRefreshTokenExist.refreshToken,
      },
      200,
    );
  } catch (error) {
    return apiResponse(
      res,
      `request failed due to this error: ${error}`,
      {},
      500,
    );
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return apiResponse(res, "please send refresh token", {}, 400);
    }
    const isRefreshTokenExist = await prisma.refreshToken.findFirst({
      where: {
        refreshToken: refreshToken,
      },
    });
    if (!isRefreshTokenExist) {
      return apiResponse(res, "refresh token does not exist", {}, 401);
    }

    if (isRefreshTokenExist && isRefreshTokenExist.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: {
          id: isRefreshTokenExist.id,
        },
      });

      return apiResponse(
        res,
        "refresh token expired.please log in again",
        {},
        401,
      );
    }

    if (isRefreshTokenExist && isRefreshTokenExist.expiresAt > new Date()) {
      const { accessToken } = await generateAccessAndRefreshTokens(
        isRefreshTokenExist.userId,
      );

      return apiResponse(
        res,
        "access token created successfully",
        {
          accessToken: accessToken,
        },
        201,
      );
    }
  } catch (error) {
    return apiResponse(res, "refresh token creation failed", {}, 500);
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

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const token = await prisma.refreshToken.findFirst({
      where: {
        userId,
      },
    });
    if (token) {
      await prisma.refreshToken.delete({
        where: {
          id:token.id,
        },
      });
    }

    return apiResponse(res, "user logged out", {}, 200);
  } catch (error) {
    return apiResponse(res, "user could not logged out", {}, 500);
  }
});

export default router;
