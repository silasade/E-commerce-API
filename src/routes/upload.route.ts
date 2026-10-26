import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller";
import upload from "../middlewares/upload.middleware";

const router = Router();

/**
 * @openapi
 * /api/uploads/image:
 *   post:
 *     summary: Upload a single image to Cloudinary
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (JPEG, PNG, etc., max 5MB)
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/v1234567/sample.jpg
 *                     publicId:
 *                       type: string
 *                       example: ecommerce/products/sample
 *       400:
 *         description: Bad request (missing file or invalid file type)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
router.post("/image", upload.single("image"), uploadImage);

export default router;
