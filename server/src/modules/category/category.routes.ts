// server/src/modules/category/category.routes.ts
import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
} from "./category.controller.js";
import { authenticate, authorizeRoles } from "../../middleware/auth.js";
import { USER_ROLES } from "../../constants/roles.js";

const router = Router();

// Everyone can view categories
router.get("/", authenticate, getCategories);

// Only Admins can create or update categories
router.post(
  "/",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  createCategory,
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  updateCategory,
);

export default router;
