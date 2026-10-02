import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import appConfig from "../config/config.js";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = new ApiError(409, `An account with that ${field} already exists.`);
  }

  if (err.name === "CastError") {
    error = new ApiError(400, `Invalid resource identifier: ${err.value}`);
  }

  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid authorization token.");
  }
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Authorization token has expired.");
  }

  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(appConfig.NODE_ENV === "development" && { stack: error.stack }),
  });
};

export default errorHandler;