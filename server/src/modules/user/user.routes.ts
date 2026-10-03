// server/src/modules/user/user.routes.ts
import { Router } from "express";
import {
  getUsers,
  approveUser,
  updateUserRole,
} from "./user.controller.js";
import { authenticate, authorizeRoles } from "../../middleware/auth.js";
import { USER_ROLES } from "../../constants/roles.js";

const router = Router();

// All user management routes require Admin privileges
router.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

router.get("/", getUsers);
router.patch("/:userId/approve", approveUser);
router.patch("/:userId/role", updateUserRole);

export default router;
