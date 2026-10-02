// server/src/middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import type { Schema } from "joi";
import { ApiError } from "../utils/ApiError.js";

export const validate = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors, not just the first one
      stripUnknown: true, // Remove fields not defined in schema for security
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(new ApiError(400, "Validation Error", errorMessages));
    }

    // Replace req.body with the sanitized and typed value
    req.body = value;
    next();
  };
};

export default validate;