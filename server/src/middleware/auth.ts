// server/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import appConfig from "../config/config.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User, { type IUser } from "../modules/user/userModel.js";
import type { UserRole } from "../constants/roles.js";

// Extend Express Request type to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Middleware to verify JWT Access Token and attach user to req.user
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check Authorization header for "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(401, "Authentication token missing. Please log in.");
    }

    try {
      const decoded = jwt.verify(
        token,
        appConfig.JWT_ACCESS_SECRET,
      ) as JwtPayload;

      const user = await User.findById(decoded.id);

      if (!user) {
        throw new ApiError(
          401,
          "The user belonging to this token no longer exists.",
        );
      }

      req.user = user;
      next();
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(
          401,
          "Token has expired. Please refresh your token.",
        );
      }
      throw new ApiError(401, "Invalid authorization token.");
    }
  },
);

/**
 * Middleware to restrict access based on user roles (RBAC)
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, "User is not authenticated.");
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      );
    }

    next();
  };
};
