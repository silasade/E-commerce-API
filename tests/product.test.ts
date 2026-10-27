import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../src/app";
import { productService } from "../src/services/product.service";
import { auth } from "../src/services/auth.service";
import { userService } from "../src/services/user.service";

vi.mock("../src/services/product.service", () => ({
  productService: {
    getAllProducts: vi.fn(),
    getProductById: vi.fn(),
    getProductBySlug: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
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
const validCategoryId = "607f1f77bcf86cd799439022";

describe("Product Routes & Operations", () => {
  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuthenticatedUser = (role: "ADMIN" | "USER" = "ADMIN") => {
    vi.mocked(auth.verifyToken).mockReturnValue({
      id: "user123",
      email: "admin@example.com",
    });
    vi.mocked(userService.findUserById).mockResolvedValue({
      _id: "user123",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      role,
    } as any);
  };

  describe("GET /api/products (Public)", () => {
    it("should allow public access to list products with pagination", async () => {
      const mockResult = {
        products: [
          {
            _id: validMongoId,
            name: "iPhone 15",
            slug: "iphone-15",
            price: 799,
            stock: 20,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
      vi.mocked(productService.getAllProducts).mockResolvedValue(
        mockResult as any,
      );

      const res = await request(app).get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(productService.getAllProducts).toHaveBeenCalledWith({});
    });

    it("should pass query filters (search, category, price, page, limit) to productService", async () => {
      const mockResult = {
        products: [],
        pagination: {
          total: 0,
          page: 2,
          limit: 5,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: true,
        },
      };
      vi.mocked(productService.getAllProducts).mockResolvedValue(
        mockResult as any,
      );

      const res = await request(app).get(
        `/api/products?search=phone&category=${validCategoryId}&minPrice=100&maxPrice=500&page=2&limit=5`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(productService.getAllProducts).toHaveBeenCalledWith({
        search: "phone",
        category: validCategoryId,
        minPrice: 100,
        maxPrice: 500,
        page: 2,
        limit: 5,
      });
    });

    it("should return 400 if category query is not a valid 24-hex string", async () => {
      const res = await request(app).get("/api/products?category=invalid-cat");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "query.category",
            message: "Invalid Category ID",
          }),
        ]),
      );
    });

    it("should return 400 if minPrice is negative", async () => {
      const res = await request(app).get("/api/products?minPrice=-10");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/products/slug/:slug (Public)", () => {
    it("should return 404 if product with slug is not found", async () => {
      vi.mocked(productService.getProductBySlug).mockResolvedValue(null);

      const res = await request(app).get("/api/products/slug/unknown-product");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product not found");
    });

    it("should return product details when found by slug", async () => {
      const mockProduct = {
        _id: validMongoId,
        name: "MacBook Pro",
        slug: "macbook-pro",
        price: 1999,
      };
      vi.mocked(productService.getProductBySlug).mockResolvedValue(
        mockProduct as any,
      );

      const res = await request(app).get("/api/products/slug/macbook-pro");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockProduct);
    });
  });

  describe("GET /api/products/:productId (Public)", () => {
    it("should return 400 if productId is not a valid 24-hex string", async () => {
      const res = await request(app).get("/api/products/invalid-id-123");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "params.productId",
            message: "Invalid Product ID",
          }),
        ]),
      );
    });

    it("should return 404 if product is not found", async () => {
      vi.mocked(productService.getProductById).mockResolvedValue(null);

      const res = await request(app).get(`/api/products/${validMongoId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product not found");
    });

    it("should return product details when found", async () => {
      const mockProduct = {
        _id: validMongoId,
        name: "Pixel 8",
        price: 699,
      };
      vi.mocked(productService.getProductById).mockResolvedValue(
        mockProduct as any,
      );

      const res = await request(app).get(`/api/products/${validMongoId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockProduct);
    });
  });

  describe("POST /api/products (Protected - Admin)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app).post("/api/products").send({
        name: "New Product",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject request with 403 if user is not an ADMIN", async () => {
      mockAuthenticatedUser("USER");

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer user-token")
        .send({
          name: "New Product",
          description: "A description",
          price: 50,
          category: validCategoryId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        "You are not authorized to view this resource",
      );
    });

    it("should fail validation if required fields are missing", async () => {
      mockAuthenticatedUser();

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "AB", // Less than 3 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should successfully create a product with 201 status", async () => {
      mockAuthenticatedUser();

      const created = {
        _id: validMongoId,
        name: "Mechanical Keyboard",
        description: "RGB Mechanical Keyboard",
        price: 89.99,
        stock: 50,
        category: validCategoryId,
        images: [],
        isActive: true,
      };
      vi.mocked(productService.createProduct).mockResolvedValue(created as any);

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "Mechanical Keyboard",
          description: "RGB Mechanical Keyboard",
          price: 89.99,
          stock: 50,
          category: validCategoryId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product created successfully");
      expect(res.body.data).toEqual(created);
    });
  });

  describe("PATCH /api/products/:productId (Protected - Admin)", () => {
    it("should reject unauthenticated update with 401", async () => {
      const res = await request(app)
        .patch(`/api/products/${validMongoId}`)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(401);
    });

    it("should reject update with 403 if user is not an ADMIN", async () => {
      mockAuthenticatedUser("USER");

      const res = await request(app)
        .patch(`/api/products/${validMongoId}`)
        .set("Authorization", "Bearer user-token")
        .send({ name: "Updated Name" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        "You are not authorized to view this resource",
      );
    });

    it("should return 400 if productId is invalid", async () => {
      mockAuthenticatedUser();

      const res = await request(app)
        .patch("/api/products/invalid-id")
        .set("Authorization", "Bearer valid-token")
        .send({ price: 99 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 if updating non-existent product", async () => {
      mockAuthenticatedUser();
      vi.mocked(productService.updateProduct).mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/products/${validMongoId}`)
        .set("Authorization", "Bearer valid-token")
        .send({ name: "Updated Keyboard" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product not found");
    });

    it("should successfully update product and return 200", async () => {
      mockAuthenticatedUser();
      const updated = {
        _id: validMongoId,
        name: "Updated Keyboard",
        price: 99.99,
      };
      vi.mocked(productService.updateProduct).mockResolvedValue(updated as any);

      const res = await request(app)
        .patch(`/api/products/${validMongoId}`)
        .set("Authorization", "Bearer valid-token")
        .send({ name: "Updated Keyboard", price: 99.99 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product updated successfully");
      expect(res.body.data).toEqual(updated);
    });
  });

  describe("DELETE /api/products/:productId (Protected - Admin)", () => {
    it("should reject unauthenticated delete with 401", async () => {
      const res = await request(app).delete(`/api/products/${validMongoId}`);

      expect(res.status).toBe(401);
    });

    it("should reject delete with 403 if user is not an ADMIN", async () => {
      mockAuthenticatedUser("USER");

      const res = await request(app)
        .delete(`/api/products/${validMongoId}`)
        .set("Authorization", "Bearer user-token");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        "You are not authorized to view this resource",
      );
    });

    it("should return 400 if productId is invalid", async () => {
      mockAuthenticatedUser();

      const res = await request(app)
        .delete("/api/products/invalid-id")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 404 if product to delete does not exist", async () => {
      mockAuthenticatedUser();
      vi.mocked(productService.deleteProduct).mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/products/${validMongoId}`)
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product not found");
    });

    it("should successfully delete a product and return 200", async () => {
      mockAuthenticatedUser();
      const deleted = {
        _id: validMongoId,
        name: "Old Product",
      };
      vi.mocked(productService.deleteProduct).mockResolvedValue(deleted as any);

      const res = await request(app)
        .delete(`/api/products/${validMongoId}`)
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Product deleted successfully");
    });
  });
});
