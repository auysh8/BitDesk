import crypto from "crypto";
import appConfig from "../config/config.js";

export interface GeneratedOtp {
  otp: string;
  otpHash: string;
  otpExpiresAt: Date;
}

export const generateOtp = (): GeneratedOtp => {
  const otp = crypto.randomInt(100000, 1000000).toString();

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  const otpExpiresAt = new Date(
    Date.now() + (appConfig.OTP_EXPIRES_MINUTES || 10) * 60 * 1000,
  );

  return { otp, otpHash, otpExpiresAt };
};

export const verifyOtpHash = (
  plainOtp: string,
  storedHash: string,
): boolean => {
  const hash = crypto.createHash("sha256").update(plainOtp).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
};
