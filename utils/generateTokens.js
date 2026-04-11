import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { prisma } from "../src/db/prisma-helper.js";

async function generateAccessAndRefreshTokens(id, isTokenexist = false) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
    });

    const accessToken = jwt.sign(
      { userId: id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "15min" },
    );

    if (isTokenexist) {
      const refreshToken = randomBytes(32).toString("hex");
      const savedRefreshToken = await prisma.refreshToken.create({
        data: {
          refreshToken: refreshToken,
          userId: id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return { accessToken, refreshToken: refreshToken };
    }
    return { accessToken };
  } catch (error) {
    return {
      message: error.message,
    };
  }
}

export default generateAccessAndRefreshTokens;
