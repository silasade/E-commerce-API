import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../src/app";
import { categoryService } from "../src/services/category.service";
import { auth } from "../src/services/auth.service";
import { userService } from "../src/services/user.service";

vi.mock("../src/services/category.service", () => ({
  categoryService: {
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    getCategoryBySlug: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

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

let app: Express;
const validMongoId = "507f1f77bcf86cd799439011";

describe("Category Routes & Operations", () => {
  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuthenticatedUser = () => {
    vi.mocked(auth.verifyToken).mockReturnValue({
      id: "user123",
      email: "admin@example.com",
    });
    vi.mocked(userService.findUserById).mockResolvedValue({
      _id: "user123",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
    } as any);
  };

  describe("GET /api/categories (Public)", () => {
    it("should allow public access to list categories", async () => {
      const mockCategories = [
        { _id: validMongoId, name: "Electronics", slug: "electronics" },
      ];
      vi.mocked(categoryService.getCategories).mockResolvedValue(
        mockCategories as any,
      );

      const res = await request(app).get("/api/categories");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategories);
    });
  });

  describe("GET /api/categories/:categoryId (Public)", () => {
    it("should return 400 if categoryId is not a valid 24-hex string", async () => {
      const res = await request(app).get("/api/categories/invalid-id-123");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "params.categoryId",
            message: "Invalid Category ID",
          }),
        ]),
      );
    });

    it("should return 404 if category is not found", async () => {
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(null);

      const res = await request(app).get(`/api/categories/${validMongoId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Category not found");
    });

    it("should return category details when found", async () => {
      const mockCategory = {
        _id: validMongoId,
        name: "Footwear",
        slug: "footwear",
      };
      vi.mocked(categoryService.getCategoryById).mockResolvedValue(
        mockCategory as any,
      );

      const res = await request(app).get(`/api/categories/${validMongoId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategory);
    });
  });

  describe("GET /api/categories/slug/:slug (Public)", () => {
    it("should return 404 if category with slug is not found", async () => {
      vi.mocked(categoryService.getCategoryBySlug).mockResolvedValue(null);

      const res = await request(app).get("/api/categories/slug/unknown-slug");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Category not found");
    });

    it("should return category details by slug", async () => {
      const mockCategory = {
        _id: validMongoId,
        name: "Laptops",
        slug: "laptops",
      };
      vi.mocked(categoryService.getCategoryBySlug).mockResolvedValue(
        mockCategory as any,
      );

      const res = await request(app).get("/api/categories/slug/laptops");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCategory);
    });
  });

  describe("POST /api/categories (Protected)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).post("/api/categories").send({
        name: "Gaming",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should fail validation if name is shorter than 3 characters", async () => {
      mockAuthenticatedUser();

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "AB",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should successfully create a category with 201 status", async () => {
      mockAuthenticatedUser();

      const created = {
        _id: validMongoId,
        name: "Gaming Gear",
        slug: "gaming-gear",
        isActive: true,
      };
      vi.mocked(categoryService.createCategory).mockResolvedValue(
        created as any,
      );

      const res = await request(app)
        .post("/api/categories")
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "Gaming Gear",
          description: "Peripherals and accessories",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(created);
    });
  });

  describe("PATCH /api/categories/:categoryId (Protected)", () => {
    it("should reject unauthenticated update with 401", async () => {
      const res = await request(app)
        .patch(`/api/categories/${validMongoId}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(401);
    });

    it("should return 404 if updating non-existent category", async () => {
      mockAuthenticatedUser();
      vi.mocked(categoryService.updateCategory).mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/categories/${validMongoId}`)
        .set("Authorization", "Bearer valid-token")
        .send({ name: "Updated Name" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Category not found");
    });

    it("should return 200 on successful update", async () => {
      mockAuthenticatedUser();
      const updated = {
        _id: validMongoId,
        name: "Updated Name",
        slug: "updated-name",
      };
      vi.mocked(categoryService.updateCategory).mockResolvedValue(
        updated as any,
      );

      const res = await request(app)
        .patch(`/api/categories/${validMongoId}`)
        .set("Authorization", "Bearer valid-token")
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category updated successfully");
      expect(res.body.data).toEqual(updated);
    });
  });

  describe("DELETE /api/categories/:categoryId (Protected)", () => {
    it("should reject unauthenticated delete with 401", async () => {
      const res = await request(app).delete(`/api/categories/${validMongoId}`);

      expect(res.status).toBe(401);
    });

    it("should return 404 if category to delete does not exist", async () => {
      mockAuthenticatedUser();
      vi.mocked(categoryService.deleteCategory).mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/categories/${validMongoId}`)
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(404);
    });

    it("should return 200 on successful delete", async () => {
      mockAuthenticatedUser();
      vi.mocked(categoryService.deleteCategory).mockResolvedValue({
        _id: validMongoId,
      } as any);

      const res = await request(app)
        .delete(`/api/categories/${validMongoId}`)
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category deleted");
    });
  });
});
