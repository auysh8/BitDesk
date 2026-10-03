import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 200, // max 200 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please slow down and try again after a minute.",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // max 30 auth requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

export const ticketCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 30, // max 30 tickets created per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Ticket creation limit reached. Please wait before creating more tickets.",
  },
});
