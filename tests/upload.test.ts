import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { Writable } from "node:stream";
import { createApp } from "../src/app";
import { auth } from "../src/services/auth.service";
import { userService } from "../src/services/user.service";
import cloudinary from "../src/config/cloudinary";

vi.mock("../src/services/auth.service", () => ({
  auth: {
    verifyToken: vi.fn(),
  },
}));

vi.mock("../src/services/user.service", () => ({
  userService: {
    findUserById: vi.fn(),
  },
}));

vi.mock("../src/config/cloudinary", () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

let app: Express;

describe("Upload Routes & Middleware", () => {
  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuthenticatedUser = (role: "ADMIN" | "USER" = "ADMIN") => {
    vi.mocked(auth.verifyToken).mockReturnValue({
      id: "user123",
      email: "user@example.com",
    });
    vi.mocked(userService.findUserById).mockResolvedValue({
      _id: "user123",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      role,
    } as any);
  };

  describe("POST /api/uploads/image", () => {
    it("should return 401 if no Authorization header is provided", async () => {
      const res = await request(app).post("/api/uploads/image");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        "You are not authorized to access this resource",
      );
    });

    it("should return 401 if token is invalid or expired", async () => {
      vi.mocked(auth.verifyToken).mockReturnValue(null);

      const res = await request(app)
        .post("/api/uploads/image")
        .set("Authorization", "Bearer invalid-or-expired-token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid or expired token");
    });

    it("should return 403 if authenticated user is not an ADMIN", async () => {
      mockAuthenticatedUser("USER");

      const res = await request(app)
        .post("/api/uploads/image")
        .set("Authorization", "Bearer user-token")
        .attach("image", Buffer.from("mock image data"), {
          filename: "product.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        "You are not authorized to view this resource",
      );
    });

    it("should return 400 when no file is uploaded", async () => {
      mockAuthenticatedUser();

      const res = await request(app)
        .post("/api/uploads/image")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Please provide an image");
    });

    it("should return 400 when uploaded file is not an image", async () => {
      mockAuthenticatedUser();

      const res = await request(app)
        .post("/api/uploads/image")
        .set("Authorization", "Bearer valid-token")
        .attach("image", Buffer.from("plain text content"), {
          filename: "test.txt",
          contentType: "text/plain",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Only image files are allowed");
    });

    it("should successfully upload an image and return 201 with secure_url and publicId", async () => {
      mockAuthenticatedUser();

      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => {
          return new Writable({
            write(_chunk, _encoding, next) {
              next();
            },
            final(done) {
              callback(null, {
                secure_url:
                  "https://res.cloudinary.com/demo/image/upload/v1234567/sample.jpg",
                public_id: "ecommerce/products/sample_123",
              });
              done();
            },
          }) as any;
        },
      );

      const res = await request(app)
        .post("/api/uploads/image")
        .set("Authorization", "Bearer valid-token")
        .attach("image", Buffer.from("mock image data"), {
          filename: "product.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Image uploaded successfully");
      expect(res.body.data).toEqual({
        url: "https://res.cloudinary.com/demo/image/upload/v1234567/sample.jpg",
        publicId: "ecommerce/products/sample_123",
      });
    });

    it("should pass error to error handler when Cloudinary fails", async () => {
      mockAuthenticatedUser();

      vi.mocked(cloudinary.uploader.upload_stream).mockImplementation(
        (_options: any, callback: any) => {
          return new Writable({
            write(_chunk, _encoding, next) {
              next();
            },
            final(done) {
              callback(new Error("Cloudinary connection failed"), null);
              done();
            },
          }) as any;
        },
      );

      const res = await request(app)
        .post("/api/uploads/image")
        .set("Authorization", "Bearer valid-token")
        .attach("image", Buffer.from("mock image data"), {
          filename: "product.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Cloudinary connection failed");
    });
  });
});
