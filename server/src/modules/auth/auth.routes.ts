// server/src/modules/auth/auth.routes.ts
import { Router } from "express";
import {
  sendPreRegisterOtp,
  verifyPreRegisterOtp,
  register,
  verifyOtp,
  loginPassword,
  requestLoginOtp,
  verifyLoginOtp,
  resendOtp,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";
import {
  sendPreRegisterOtpSchema,
  verifyPreRegisterOtpSchema,
  registerSchema,
  loginPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validator.js";

const router = Router();

// Apply auth rate limiter across sensitive auth attempts
router.use(authRateLimiter);

// Public Authentication Endpoints
router.post(
  "/pre-register/send-otp",
  validate(sendPreRegisterOtpSchema),
  sendPreRegisterOtp,
);
router.post(
  "/pre-register/verify-otp",
  validate(verifyPreRegisterOtpSchema),
  verifyPreRegisterOtp,
);
router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login-password", validate(loginPasswordSchema), loginPassword);
router.post("/login-otp", validate(requestOtpSchema), requestLoginOtp);
router.post("/verify-login-otp", validate(verifyOtpSchema), verifyLoginOtp);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Protected Authentication Endpoints
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);
router.post("/change-password", authenticate, changePassword);

export default router;
