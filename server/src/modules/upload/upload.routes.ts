import { Router } from "express";
import { uploadFiles } from "./upload.controller.js";
import { upload } from "../../middleware/upload.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Upload attachments (requires login)
router.post(
  "/",
  authenticate,
  upload.array("files", 5), // up to 5 files at a time
  uploadFiles,
);

export default router;
