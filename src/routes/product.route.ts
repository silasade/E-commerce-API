import z from "zod";
import express from "express";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import { validateUser } from "../middlewares/validateUser.middleware";
import { authorize } from "../middlewares/authorize.middleware";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductBySlug,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";

const router = express.Router();

const productImageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  publicId: z.string().optional(),
});

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(1, "Product description is required"),
    price: z.number().min(0.01, "Price must be at least 0.01"),
    stock: z
      .number()
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .default(0),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"),
    images: z.array(productImageSchema).default([]),
    isActive: z.boolean().default(true),
  }),
});

const productIdSchema = z.object({
  params: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
  }),
});

const productSlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, "Slug is required"),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters").optional(),
    description: z.string().min(1).optional(),
    price: z.number().min(0.01, "Price must be at least 0.01").optional(),
    stock: z
      .number()
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .optional(),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID")
      .optional(),
    images: z.array(productImageSchema).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
  }),
});

const getProductSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID")
      .optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional(),
  }),
});

export type CreateProductSchemaType = z.infer<typeof createProductSchema>;
export type ProductIdSchemaType = z.infer<typeof productIdSchema>;
export type ProductSlugSchemaType = z.infer<typeof productSlugSchema>;
export type UpdateProductSchemaType = z.infer<typeof updateProductSchema>;
export type GetProductSchemaType = z.infer<typeof getProductSchema>;

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Retrieve products with optional filtering and pagination
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, slug, or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID (24-char hex)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products
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
 *               - description
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15 Pro
 *               description:
 *                 type: string
 *                 example: Flagship smartphone from Apple
 *               price:
 *                 type: number
 *                 example: 999.99
 *               stock:
 *                 type: integer
 *                 example: 50
 *               category:
 *                 type: string
 *                 example: 67119abcde1234567890f123
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     publicId:
 *                       type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get("/", validateRequest(getProductSchema), getProducts);
router.post(
  "/",
  validateUser,
  authorize("ADMIN"),
  validateRequest(createProductSchema),
  createProduct,
);

/**
 * @openapi
 * /api/products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: iphone-15-pro
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get(
  "/slug/:slug",
  validateRequest(productSlugSchema),
  getProductBySlug,
);

/**
 * @openapi
 * /api/products/{productId}:
 *   get:
 *     summary: Get product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         example: 67119abcde1234567890f123
 *     responses:
 *       200:
 *         description: Product details
 *       400:
 *         description: Invalid Product ID
 *       404:
 *         description: Product not found
 *   patch:
 *     summary: Update a product by ID
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a product by ID
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Product not found
 */
router.get("/:productId", validateRequest(productIdSchema), getProduct);
router.patch(
  "/:productId",
  validateUser,
  authorize("ADMIN"),
  validateRequest(updateProductSchema),
  updateProduct,
);
router.delete(
  "/:productId",
  validateUser,
  authorize("ADMIN"),
  validateRequest(productIdSchema),
  deleteProduct,
);

export default router;
