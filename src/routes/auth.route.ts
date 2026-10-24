import z from "zod";
import express from "express";
import { validateRequest } from "../middlewares/validateRequest.middleware";
import {
  resetPassword,
  forgotPassword,
  login,
  register,
} from "../controllers/auth.controller";
const router = express.Router();
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])\S+$/;

const registerUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    email: z.string().min(1, "Email is required").email({
      error: "Field must be a valid email address",
    }),
  }),
});

const loginUserSchema = z.object({
  body: z.object({
    password: z.string().min(1, "Password is required"),
    email: z.string().min(1, "Email is required").email({
      error: "Field must be a valid email address",
    }),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email is required").email({
      error: "Must be a valid email address",
    }),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
  }),
  query: z.object({
    resetToken: z.string().min(1, "Reset token is required"),
    email: z.string().min(1, "Email is required").email({
      error: "Must be a valid email address",
    }),
  }),
});

export type RegisterUserSchemaType = z.infer<typeof registerUserSchema>;
export type LoginUserSchemaType = z.infer<typeof loginUserSchema>;
export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Min 6 characters, must include uppercase, lowercase, number, and special character
 *                 example: Secret123!
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: User with this email already exists
 */
router.post("/register", validateRequest(registerUserSchema), register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret123!
 *     responses:
 *       201:
 *         description: User login successful
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
 *                   example: User login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error
 *       403:
 *         description: Invalid email or password
 *       404:
 *         description: User with this email does not exist
 */
router.post("/login", validateRequest(loginUserSchema), login);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       201:
 *         description: Password reset token generated
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
 *                   example: Password reset successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error
 *       404:
 *         description: User with this email does not exist
 */
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  forgotPassword,
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   patch:
 *     summary: Reset password with reset token
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: resetToken
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT reset token
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Min 6 characters, must include uppercase, lowercase, number, and special character
 *                 example: NewSecret123!
 *     responses:
 *       201:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User or token not found
 */
router.patch(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  resetPassword,
);

export default router;
