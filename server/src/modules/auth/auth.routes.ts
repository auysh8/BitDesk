// server/src/modules/auth/auth.routes.ts
import { Router } from "express";
import {
  register,
  verifyOtp,
  loginPassword,
  requestLoginOtp,
  verifyLoginOtp,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import {
  registerSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validator.js";

const router = Router();

// Public Authentication Endpoints
router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/login-password", validate(loginPasswordSchema), loginPassword);
router.post("/login-otp", validate(requestOtpSchema), requestLoginOtp);
router.post("/verify-login-otp", validate(verifyOtpSchema), verifyLoginOtp);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Protected Authentication Endpoints
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);

export default router;
