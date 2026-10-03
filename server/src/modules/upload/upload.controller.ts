import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { sendResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const uploadFiles = asyncHandler(async (req: Request, res: Response) => {
  const files =
    (req.files as Express.Multer.File[]) ||
    (req.file ? [req.file as Express.Multer.File] : []);

  if (!files || files.length === 0) {
    throw new ApiError(400, "No file uploaded");
  }

  const uploaded = files.map((f) => ({
    filename: f.originalname,
    url: `/uploads/${f.filename}`,
    size: f.size,
    mimetype: f.mimetype,
  }));

  return sendResponse(res, 201, "File(s) uploaded successfully", {
    files: uploaded,
    attachment: uploaded[0],
  });
});
