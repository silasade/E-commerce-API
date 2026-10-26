import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../src/app";
import { userService } from "../src/services/user.service";
import { auth } from "../src/services/auth.service";

// Mock the database services so tests are isolated and don't need a live MongoDB connection
vi.mock("../src/services/user.service", () => ({
  userService: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
  },
}));

vi.mock("../src/services/auth.service", () => ({
  auth: {
    register: vi.fn(),
    createToken: vi.fn(),
    verifyToken: vi.fn(),
  },
}));

let app: Express;

describe("Authentication Routes & Validation", () => {
  beforeAll(async () => {
    app = await createApp();
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should fail when required fields are missing", async () => {
      const res = await request(app).post("/api/auth/register").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "body.firstName" }),
          expect.objectContaining({ field: "body.lastName" }),
          expect.objectContaining({ field: "body.email" }),
          expect.objectContaining({ field: "body.password" }),
        ]),
      );
    });

    it("should fail when email format is invalid", async () => {
      const res = await request(app).post("/api/auth/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "not-an-email",
        password: "Password123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "body.email",
            message: "Field must be a valid email address",
          }),
        ]),
      );
    });

    it("should fail when password is less than 6 characters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "P1!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "body.password",
            message: "Password must be at least 6 characters",
          }),
        ]),
      );
    });

    it("should fail when password lacks uppercase, lowercase, number, or special character", async () => {
      const res = await request(app).post("/api/auth/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123", // missing uppercase and special char
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "body.password",
            message:
              "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          }),
        ]),
      );
    });

    it("should return 401 if user email already exists", async () => {
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce({
        _id: "user123",
        email: "john@example.com",
      } as any);

      const res = await request(app).post("/api/auth/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User with this email already exist");
    });

    it("should successfully register a user with valid data", async () => {
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(auth.register).mockResolvedValueOnce({
        _id: "user123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      } as any);

      const res = await request(app).post("/api/auth/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User created successfully");
      expect(res.body.data.email).toBe("john@example.com");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should fail when email or password is empty", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "",
        password: "",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "body.email",
            message: "Email is required",
          }),
          expect.objectContaining({
            field: "body.password",
            message: "Password is required",
          }),
        ]),
      );
    });

    it("should return 404 if user does not exist", async () => {
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(null);

      const res = await request(app).post("/api/auth/login").send({
        email: "unknown@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User with this email does not exist");
    });

    it("should return 403 if password does not match", async () => {
      const mockUser = {
        _id: "user123",
        email: "john@example.com",
        comparePassword: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(
        mockUser as any,
      );

      const res = await request(app).post("/api/auth/login").send({
        email: "john@example.com",
        password: "WrongPassword123!",
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("should successfully log in and return token on valid credentials", async () => {
      const mockUser = {
        _id: "user123",
        email: "john@example.com",
        comparePassword: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(
        mockUser as any,
      );
      vi.mocked(auth.createToken).mockReturnValueOnce("mocked-jwt-token");

      const res = await request(app).post("/api/auth/login").send({
        email: "john@example.com",
        password: "Password123!",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User login successful");
      expect(res.body.data.token).toBe("mocked-jwt-token");
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("should validate email format", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "body.email",
            message: "Must be a valid email address",
          }),
        ]),
      );
    });

    it("should return 404 if email is not found", async () => {
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "notfound@example.com" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User with this email does not exist");
    });

    it("should generate reset token for existing user", async () => {
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce({
        _id: "user123",
        email: "john@example.com",
      } as any);
      vi.mocked(auth.createToken).mockReturnValueOnce("mocked-reset-token");

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "john@example.com" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password reset successfully");
      expect(res.body.data.resetToken).toBe("mocked-reset-token");
    });
  });

  describe("PATCH /api/auth/reset-password", () => {
    it("should validate query parameters and body password complexity", async () => {
      const res = await request(app)
        .patch("/api/auth/reset-password")
        .send({ newPassword: "weak" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "query.resetToken" }),
          expect.objectContaining({ field: "query.email" }),
          expect.objectContaining({ field: "body.newPassword" }),
        ]),
      );
    });

    it("should return 404 if token verification fails", async () => {
      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce({
        _id: "user123",
        email: "john@example.com",
      } as any);
      vi.mocked(auth.verifyToken).mockReturnValueOnce(null as any);

      const res = await request(app)
        .patch(
          "/api/auth/reset-password?resetToken=invalid-token&email=john@example.com",
        )
        .send({ newPassword: "NewPassword123!" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User does not exist");
    });

    it("should successfully reset password when token and new password are valid", async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockUser = {
        _id: "user123",
        email: "john@example.com",
        password: "OldPassword123!",
        save: mockSave,
      };

      vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(
        mockUser as any,
      );
      vi.mocked(auth.verifyToken).mockReturnValueOnce({
        id: "user123",
        email: "john@example.com",
      });

      const res = await request(app)
        .patch(
          "/api/auth/reset-password?resetToken=valid-token&email=john@example.com",
        )
        .send({ newPassword: "NewPassword123!" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password reset successfully");
      expect(mockUser.password).toBe("NewPassword123!");
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
  });
});
