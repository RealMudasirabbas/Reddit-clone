import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma-helper.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import authMiddleware from "../middlewares/auth.js";

const router = Router();

router.post("/sign-up", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all credentials" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
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

    return res.status(201).json({ token });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json("please provide an email");
    }
    if (!password) {
      return res.status(400).json("please provide password");
    }
    const fetchUser = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!fetchUser) {
      return res.status(404).json("user not found");
    }
    const { password: hashedPassword } = fetchUser;

    const validatePassword = await bcrypt.compare(password, hashedPassword);
    if (!validatePassword) {
      return res.status(400).json("invalid password");
    }

    const token = jwt.sign(
      { userId: fetchUser.id, username: fetchUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "user logged in successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: `request failed due to this error: ${error}`,
    });
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
      return res.status(404).json({
        message: "user not found",
      });
    }

    return res.status(201).json({
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      message: "user data has been retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: `error occured in me route: ${error}`,
    });
  }
});

export default router;
