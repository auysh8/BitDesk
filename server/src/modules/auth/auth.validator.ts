// server/src/modules/auth/auth.validator.ts
import Joi from "joi";
import { USER_ROLES } from "../../constants/roles.js";

// Helper for emails that allows local domains like .local, .test, .dev
const emailValidation = Joi.string()
  .trim()
  .email({ tlds: { allow: false } })
  .lowercase()
  .required()
  .messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  });

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  email: emailValidation,
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+() -]{7,20}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Please provide a valid phone number",
    }),
  password: Joi.string().min(6).max(100).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
  role: Joi.string()
    .valid(...Object.values(USER_ROLES))
    .default(USER_ROLES.CUSTOMER),
});

export const loginPasswordSchema = Joi.object({
  email: emailValidation,
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const requestOtpSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .lowercase()
    .optional(),
  phone: Joi.string().trim().optional(),
})
  .or("email", "phone")
  .messages({
    "object.missing": "Please provide either an email or a phone number",
  });

export const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .lowercase()
    .optional(),
  phone: Joi.string().trim().optional(),
  otp: Joi.string().trim().length(6).required().messages({
    "string.empty": "OTP is required",
    "string.length": "OTP must be exactly 6 digits",
  }),
})
  .or("email", "phone")
  .messages({
    "object.missing": "Please provide either an email or a phone number",
  });

export const forgotPasswordSchema = Joi.object({
  email: emailValidation,
});

export const resetPasswordSchema = Joi.object({
  email: emailValidation,
  otp: Joi.string().trim().length(6).required().messages({
    "string.empty": "OTP is required",
    "string.length": "OTP must be exactly 6 digits",
  }),
  newPassword: Joi.string().min(6).max(100).required().messages({
    "string.empty": "New password is required",
    "string.min": "Password must be at least 6 characters",
  }),
});
