// server/src/modules/user/user.routes.ts
import { Router } from "express";
import {
  getUsers,
  approveUser,
  updateUserRole,
  toggleUserStatus,
  getStaffMembers,
} from "./user.controller.js";
import { authenticate, authorizeRoles } from "../../middleware/auth.js";
import { USER_ROLES } from "../../constants/roles.js";

const router = Router();

// Active staff members list for ticket assignments (Admin & Agent)
router.get(
  "/staff",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.AGENT),
  getStaffMembers,
);

// All admin user management routes require Admin privileges
router.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

router.get("/", getUsers);
router.patch("/:userId/approve", approveUser);
router.patch("/:userId/role", updateUserRole);
router.patch("/:userId/status", toggleUserStatus);

export default router;
