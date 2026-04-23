import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma-helper.js";
import bcrypt from "bcryptjs";
import apiResponse from "../../utils/responseHelper.js";
import { randomBytes } from "crypto";
import generateAccessAndRefreshTokens from "../../utils/generateTokens.js";
import resendEmail from "../../utils/resendEmail.js";
import { generate, generateSecret, verify, generateURI } from "otplib";
import qrcode from "qrcode";

export const exporter = {
  jwt,
  prisma,
  bcrypt,
  apiResponse,
  randomBytes,
  generateAccessAndRefreshTokens,
  resendEmail,
  generate,
  generateSecret,
  verify,
  generateURI,
  qrcode,
};
