
import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  ForgotPassword,
  LoggedUser,
  Login,
  Logout,
  RefreshToken,
  ResetPassword,
  SignUp,
  TwoFactorAuthSetup,
  VerifyEmail,
} from "../controllers/authController.js";
const router = Router();

router.post("/sign-up", asyncHandler(SignUp));

router.post("/verify-email", asyncHandler(VerifyEmail));

router.post("/login", asyncHandler(Login));

router.post("/refresh", asyncHandler(RefreshToken));

router.get("/me", authMiddleware, asyncHandler(LoggedUser));

router.post("/forgot-password", asyncHandler(ForgotPassword));

router.post("/reset-password", asyncHandler(ResetPassword));

router.post("/2fa/setup", authMiddleware, asyncHandler(TwoFactorAuthSetup));

router.post("/2fa/verify", authMiddleware, asyncHandler(TwoFactorAuthSetup));

router.post("/logout", authMiddleware, asyncHandler(Logout));

export default router;
