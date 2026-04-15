import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma-helper.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import authMiddleware from "../middlewares/auth.js";
import apiResponse from "../../utils/responseHelper.js";
import { randomBytes } from "crypto";
import generateAccessAndRefreshTokens from "../../utils/generateTokens.js";
import resendEmail from "../../utils/resendEmail.js";

const router = Router();

router.post("/sign-up", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return apiResponse(res, "Please provide all credentials", {}, 400);
    }
    const verificationToken = randomBytes(32).toString("hex");

    const existingPendingUser = await prisma.pendingUser.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });

    // const existingPendingUser = await prisma.user.findFirst({
    //   where: {
    //     OR: [{ username: username }, { email: email }],
    //   },
    // });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (existingPendingUser) {
      if (
        existingPendingUser?.username === username &&
        existingPendingUser?.email === email
      ) {
        return apiResponse(res, "user already exists", {}, 400);
      }

      if (
        existingPendingUser?.email != email ||
        existingPendingUser?.username != username
      ) {
        await prisma.pendingUser.update({
          where: {
            id: existingPendingUser.id,
          },
          data: {
            username: username,
            email: email,
            password: hashedPassword,
            verificationToken: verificationToken,
            verificationTokenExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000),
          },
        });

        const emailResponse = await resendEmail(
          email,
          verificationToken,
          "verify-email",
        );
        if (emailResponse?.err) {
          return apiResponse(
            res,
            "email could not be sent",
            { err: emailResponse.err },
            500,
          );
        }

        return apiResponse(res, "existing user updated successfully", {}, 200);
      }
    }

    const user = await prisma.pendingUser.create({
      data: {
        username,
        email,
        password: hashedPassword,
        verificationToken: verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 1 * 60 * 60 * 1000),
      },
    });

    const emailResponse = await resendEmail(
      email,
      verificationToken,
      "verify-email",
    );
    if (emailResponse?.err) {
      return apiResponse(
        res,
        "email could not be sent",
        { err: emailResponse.err },
        500,
      );
    }

    return apiResponse(
      res,
      "pending user created successfully and email sent",
      {},
      201,
    );
  } catch (error) {
    console.log(error);
    return apiResponse(res, "request failed", error, 500);
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const { verificationToken } = req.body;

    const isUserExist = await prisma.pendingUser.findFirst({
      where: {
        verificationToken: verificationToken,
      },
    });

    if (!isUserExist) {
      return apiResponse(res,"user not found",{},404)
    }

    if (isUserExist.verificationTokenExpiry< new Date()) {
      return apiResponse(res, "verification token has expired", {}, 200);
    }

    if (isUserExist) {
    

      const isUsernameOrEmailAvailable = await prisma.user.findFirst({
        where: {
          OR: [
            { username: isUserExist.username },
            { email: isUserExist.email },
          ],
        },
      });

      if (isUsernameOrEmailAvailable?.username) {
        return apiResponse(res, "username already exists", {}, 400);
      } else if (isUsernameOrEmailAvailable?.email) {
        return apiResponse(res, "email already exists", {}, 400);
      }

        const updatedUser = await prisma.pendingUser.update({
          where: {
            id: isUserExist.id,
          },
          data: {
            verificationToken: null,
            verificationTokenExpiry: null,
          },
        });

        const savedUser = await prisma.user.create({
          data: {
            username: updatedUser.username,
            email: updatedUser.email,
            password: updatedUser.password,
          },
        });

      const refreshToken = randomBytes(32).toString("hex");
      const token = jwt.sign(
        { userId: savedUser.id, username: savedUser.username },
        process.env.JWT_SECRET,
        { expiresIn: "15min" },
      );


      const savedRefreshToken = await prisma.refreshToken.create({
        data: {
          refreshToken: refreshToken,
          userId: savedUser.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });


      

      const deletePendingUser = await prisma.pendingUser.delete({
        where:{
          id:updatedUser.id
        }
      })

      
      return apiResponse(res,"user created successfully",{savedUser,token},201)
    }
  } catch (error) {
    return apiResponse(res, "user registeration failed", {
      err:error,
    }, 500);
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

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return apiResponse(res, "please provide a valid email", {}, 200);
    }

    const findUser = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!findUser) {
      return apiResponse(
        res,
        "If this email exists, a reset link has been sent",
        {},
        200,
      );
    }

    const resetToken = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: {
        id: findUser.id,
      },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const result = await resendEmail(email, resetToken);

    if (result?.err) {
      return apiResponse(res, "email could not sent", {}, 500);
    }

    return apiResponse(
      res,
      "If this email exists, a reset link has been sent",
      {},
      200,
    );
  } catch (error) {
    return apiResponse(res, "forgot password failed", {}, 500);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return apiResponse(res, "please provide token or password", {}, 400);
    }

    const findUser = await prisma.user.findUnique({
      where: {
        resetToken: resetToken,
      },
    });

    if (!findUser) {
      return apiResponse(res, "user not found", {}, 404);
    }
    if (findUser.resetTokenExpiry < new Date()) {
      return apiResponse(res, "token has expired. please try again", {}, 400);
    }
    const genSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, genSalt);

    const updatedUser = await prisma.user.update({
      where: {
        id: findUser.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return apiResponse(res, "password reset successfully", {}, 200);
  } catch (error) {
    console.log(error);
    return apiResponse(res, "reset password failed", {}, 500);
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
          id: token.id,
        },
      });
    }

    return apiResponse(res, "user logged out", {}, 200);
  } catch (error) {
    return apiResponse(res, "user could not logged out", {}, 500);
  }
});

export default router;
