// server/src/modules/category/category.controller.ts
import type { Request, Response } from "express";
import Category from "./category.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

/**
 * List all active categories (accessible by any logged-in user)
 * GET /api/categories
 */
export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await Category.find({ isActive: true }).sort({
      name: 1,
    });
    return sendResponse(
      res,
      200,
      "Categories fetched successfully",
      categories,
    );
  },
);

/**
 * Create a new category (Admin only)
 * POST /api/categories
 */
export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError(400, "Category name is required");
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existing) {
      throw new ApiError(409, "A category with this name already exists");
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || "",
      isActive: true,
    });

    return sendResponse(res, 201, "Category created successfully", category);
  },
);

/**
 * Update a category (Admin only)
 * PATCH /api/categories/:id
 */
export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        _id: { $ne: id },
      } as any);
      if (existing) {
        throw new ApiError(409, "A category with this name already exists");
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description.trim();
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return sendResponse(res, 200, "Category updated successfully", category);
  },
);
