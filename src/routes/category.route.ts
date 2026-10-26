import z from "zod";
import express from "express";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { validateUser } from "../middlewares/validateUser.middleware";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
} from "../controllers/category.controller";

const router = express.Router();

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name is required"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
});

const categoryIdSchema = z.object({
  params: z.object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
  }),
});

const categorySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, "Slug is required"),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
  }),
});

const getCategorySchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }),
});

export type CreateCategorySchemaType = z.infer<typeof createCategorySchema>;
export type CategoryIdSchemaType = z.infer<typeof categoryIdSchema>;
export type CategorySlugSchemaType = z.infer<typeof categorySlugSchema>;
export type UpdateCategorySchemaType = z.infer<typeof updateCategorySchema>;
export type GetCategorySchemaType = z.infer<typeof getCategorySchema>;

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Retrieve all categories
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Gadgets, phones, and computing devices
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Category name already exists
 */
router.get("/", validateRequest(getCategorySchema), getCategories);
router.post(
  "/",
  validateUser,
  validateRequest(createCategorySchema),
  createCategory,
);

/**
 * @openapi
 * /api/categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: electronics
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get(
  "/slug/:slug",
  validateRequest(categorySlugSchema),
  getCategoryBySlug,
);

/**
 * @openapi
 * /api/categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         example: 67119abcde1234567890f123
 *     responses:
 *       200:
 *         description: Category details
 *       400:
 *         description: Invalid Category ID
 *       404:
 *         description: Category not found
 *   patch:
 *     summary: Update a category by ID
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *   delete:
 *     summary: Delete a category by ID
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.get("/:categoryId", validateRequest(categoryIdSchema), getCategoryById);
router.patch(
  "/:categoryId",
  validateUser,
  validateRequest(updateCategorySchema),
  updateCategory,
);
router.delete(
  "/:categoryId",
  validateUser,
  validateRequest(categoryIdSchema),
  deleteCategory,
);

export default router;
