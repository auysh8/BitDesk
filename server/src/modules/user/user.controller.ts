// server/src/modules/user/user.controller.ts
import type { Request, Response } from "express";
import User from "./userModel.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { USER_ROLES } from "../../constants/roles.js";

/**
 * List all users with search, role, and approval filters (Admin only)
 * GET /api/users
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, pendingApproval, search, page = 1, limit = 20 } = req.query;

  const query: any = {};

  if (role) query.role = role;
  if (pendingApproval === "true") query.isApproved = false;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password -refreshToken -otpHash -otpExpiresAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  return sendResponse(res, 200, "Users fetched successfully", {
    users,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    },
  });
});

/**
 * Approve a staff member account (Admin only)
 * PATCH /api/users/:userId/approve
 */
export const approveUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isApproved = true;
  await user.save({ validateBeforeSave: false });

  return sendResponse(
    res,
    200,
    `Account for ${user.name} (${user.role}) has been approved. They can now log in.`,
    user
  );
});

/**
 * Update user role (Admin only)
 * PATCH /api/users/:userId/role
 */
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(USER_ROLES).includes(role)) {
      throw new ApiError(400, "Invalid role specified");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.role = role;
    user.isApproved = true; // Promoting automatically approves
    await user.save({ validateBeforeSave: false });

    return sendResponse(
      res,
      200,
      `User role updated to ${role} successfully`,
      user
    );
  }
);

/**
 * Get active staff members (Agents & Admins) for ticket assignments
 * GET /api/users/staff
 */
export const getStaffMembers = asyncHandler(
  async (_req: Request, res: Response) => {
    const staff = await User.find({
      role: { $in: [USER_ROLES.AGENT, USER_ROLES.ADMIN] },
      isApproved: true,
    })
      .select("_id name email role")
      .sort({ name: 1 });

    return sendResponse(res, 200, "Staff members fetched successfully", staff);
  }
);

