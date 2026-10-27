import {
  CreateProductSchemaType,
  GetProductSchemaType,
  ProductIdSchemaType,
  ProductSlugSchemaType,
  UpdateProductSchemaType,
} from "../routes/product.route";
import { Product } from "../models/Product.model";
import { toObjectId } from "../utils/common";
class ProductService {
  public createProduct = async (body: CreateProductSchemaType["body"]) => {
    const { category, description, images, isActive, name, price, stock } =
      body;
    const product = await Product.create({
      category,
      description,
      images,
      isActive,
      name,
      price,
      stock,
    });
    return product;
  };
  public updateProduct = async (
    productId: UpdateProductSchemaType["params"]["productId"],
    body: UpdateProductSchemaType["body"],
  ) => {
    const { category, description, images, isActive, name, price, stock } =
      body;
    const product = await Product.findById(toObjectId(productId));
    if (!product) return null;
    if (category) {
      product.category = toObjectId(category);
    }
    if (description) {
      product.description = description;
    }
    if (images) {
      product.images = images;
    }
    if (isActive !== undefined) product.isActive = isActive;
    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    await product.save();
    return product;
  };
  public deleteProduct = async (
    productId: ProductIdSchemaType["params"]["productId"],
  ) => {
    const product = await Product.findByIdAndDelete(toObjectId(productId));
    return product;
  };
  public getProductBySlug = async (
    slug: ProductSlugSchemaType["params"]["slug"],
  ) => {
    const product = await Product.findOne({ slug });
    return product;
  };

  public getProductById = async (
    productId: ProductIdSchemaType["params"]["productId"],
  ) => {
    const product = await Product.findById(toObjectId(productId));
    return product;
  };
  public getAllProducts = async (query: GetProductSchemaType["query"]) => {
    const { category, limit, maxPrice, minPrice, page, search } = query;
    const filter: any = {};

    // 1. Filter by Category
    if (category && category.trim()) {
      filter.category = toObjectId(category.trim());
    }

    // 2. Filter by Price Range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        filter.price.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filter.price.$lte = maxPrice;
      }
    }

    // 3. Search across name, slug, and description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
      ];
    }

    // 4. Pagination & Sorting setup
    const pageNum = page && page > 0 ? page : 1;
    const limitNum = limit && limit > 0 ? limit : 10;
    const skip = (pageNum - 1) * limitNum;

    // 5. Query execution with total count
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  };
}

export const productService = new ProductService();
