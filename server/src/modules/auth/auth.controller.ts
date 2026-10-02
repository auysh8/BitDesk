import type { Request, Response, CookieOptions } from "express";
import jwt from "jsonwebtoken";
import appConfig from "../../config/config.js";
import User, { type IUser } from "../user/userModel.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateOtp, verifyOtpHash } from "../../utils/otp.js";

// Cookie options for secure storage
const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: appConfig.NODE_ENV === "production",
  sameSite: appConfig.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
// Helper to generate tokens, store refresh token in DB, set cookie, and respond
const sendTokenResponse = async (
  user: IUser,
  statusCode: number,
  res: Response,
  message: string,
) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to user in database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set secure HTTP-only cookie
  res.cookie("refreshToken", refreshToken, getCookieOptions());

  // Return user without sensitive fields
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.otpHash;
  delete userObj.otpExpiresAt;

  return sendResponse(res, statusCode, message, {
    user: userObj,
    accessToken,
  });
};

/**
 * 1. Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(409, "An account with this email already exists.");
    }
    throw new ApiError(
      409,
      "An account with this phone number already exists.",
    );
  }

  // Generate 6-digit OTP for verification
  const { otp, otpHash, otpExpiresAt } = generateOtp();

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || undefined,
    isVerified: false,
    otpHash,
    otpExpiresAt,
  });

  // Log OTP to terminal for development testing
  console.log(`\n========================================`);
  console.log(`[AUTH] Registration OTP for ${email}: ${otp}`);
  console.log(`========================================\n`);

  return sendResponse(
    res,
    201,
    "Registration successful. Please verify the OTP sent to your email/phone.",
    {
      userId: user._id,
      email: user.email,
      phone: user.phone,
    },
  );
});

/**
 * 2. Verify registration OTP & activate account
 * POST /api/auth/verify-otp
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, otp } = req.body;

  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select("+otpHash +otpExpiresAt");

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    throw new ApiError(400, "No OTP request found for this account.");
  }

  if (new Date() > user.otpExpiresAt) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  const isOtpValid = verifyOtpHash(otp, user.otpHash);
  if (!isOtpValid) {
    throw new ApiError(400, "Invalid OTP code.");
  }

  // Mark verified and clear OTP
  user.isVerified = true;
  user.otpHash = null;
  user.otpExpiresAt = null;

  return sendTokenResponse(
    user,
    200,
    res,
    "Account verified and logged in successfully.",
  );
});

/**
 * 3. Login with Email + Password
 * POST /api/auth/login-password
 */
export const loginPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid email or password.");
    }

    if (!user.isVerified) {
      throw new ApiError(
        403,
        "Please verify your account OTP before logging in.",
      );
    }

    return sendTokenResponse(user, 200, res, "Logged in successfully.");
  },
);

/**
 * 4. Request Login OTP (Passwordless Login)
 * POST /api/auth/login-otp
 */
export const requestLoginOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, phone } = req.body;

    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user) {
      throw new ApiError(404, "No account found with those credentials.");
    }

    const { otp, otpHash, otpExpiresAt } = generateOtp();
    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    await user.save({ validateBeforeSave: false });

    console.log(`\n========================================`);
    console.log(`[AUTH] Login OTP for ${email || phone}: ${otp}`);
    console.log(`========================================\n`);

    return sendResponse(res, 200, "Login OTP has been sent successfully.");
  },
);

/**
 * 5. Verify Login OTP
 * POST /api/auth/verify-login-otp
 */
export const verifyLoginOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, phone, otp } = req.body;

    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select("+otpHash +otpExpiresAt");

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      throw new ApiError(400, "No active OTP request found.");
    }

    if (new Date() > user.otpExpiresAt) {
      throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    const isOtpValid = verifyOtpHash(otp, user.otpHash);
    if (!isOtpValid) {
      throw new ApiError(400, "Invalid OTP code.");
    }

    // Mark verified if not already and clear OTP
    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;

    return sendTokenResponse(user, 200, res, "Logged in successfully via OTP.");
  },
);

/**
 * 6. Refresh Access Token
 * POST /api/auth/refresh-token
 */
export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token missing. Please log in.");
    }

    try {
      const decoded = jwt.verify(
        incomingRefreshToken,
        appConfig.JWT_REFRESH_SECRET,
      ) as { id: string };

      const user = await User.findById(decoded.id).select("+refreshToken");

      if (!user) {
        throw new ApiError(401, "Invalid refresh token: user not found.");
      }

      if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token has been revoked or expired.");
      }

      // Generate new access token
      const newAccessToken = user.generateAccessToken();

      return sendResponse(res, 200, "Access token refreshed successfully.", {
        accessToken: newAccessToken,
      });
    } catch (error: any) {
      throw new ApiError(401, "Invalid or expired refresh token.");
    }
  },
);

/**
 * 7. Logout User
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear refresh token from database if user is authenticated
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { refreshToken: null },
    });
  }

  // Clear HTTP-only cookie
  res.clearCookie("refreshToken", getCookieOptions());

  return sendResponse(res, 200, "Logged out successfully.");
});

/**
 * 8. Forgot Password (Request Reset OTP)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if email does not exist
      return sendResponse(
        res,
        200,
        "If that email exists in our system, a password reset OTP has been sent.",
      );
    }

    const { otp, otpHash, otpExpiresAt } = generateOtp();
    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    await user.save({ validateBeforeSave: false });

    console.log(`\n========================================`);
    console.log(`[AUTH] Password Reset OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);

    return sendResponse(
      res,
      200,
      "Password reset OTP has been sent to your email.",
    );
  },
);

/**
 * 9. Reset Password using OTP
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select("+otpHash +otpExpiresAt");

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      throw new ApiError(400, "No active password reset request found.");
    }

    if (new Date() > user.otpExpiresAt) {
      throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    const isOtpValid = verifyOtpHash(otp, user.otpHash);
    if (!isOtpValid) {
      throw new ApiError(400, "Invalid OTP code.");
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    user.otpHash = null;
    user.otpExpiresAt = null;
    user.refreshToken = null; // Invalidate current sessions
    await user.save();

    return sendResponse(
      res,
      200,
      "Password reset successfully. You can now log in with your new password.",
    );
  },
);

/**
 * 10. Get Current Logged-in User Profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  return sendResponse(res, 200, "Current user profile fetched.", {
    user: req.user,
  });
});
