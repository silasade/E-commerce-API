import { Request, Response, NextFunction } from "express";
import {
  CreateProductSchemaType,
  GetProductSchemaType,
  ProductIdSchemaType,
  ProductSlugSchemaType,
  UpdateProductSchemaType,
} from "../routes/product.route";
import { productService } from "../services/product.service";

const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = res.locals.validated as GetProductSchemaType;

    const products = await productService.getAllProducts(query);
    res.status(200).json({
      message: "Products fetched successfully",
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { params } = res.locals.validated as ProductIdSchemaType;
    const product = await productService.getProductById(params.productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    res.status(200).json({
      message: "Product fetched successfully",
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { params } = res.locals.validated as ProductIdSchemaType;
    const product = await productService.deleteProduct(params.productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    res.status(200).json({
      message: "Product deleted successfully",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { params } = res.locals.validated as ProductSlugSchemaType;
    const product = await productService.getProductBySlug(params.slug);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    res.status(200).json({
      message: "Product fetched successfully",
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body } = res.locals.validated as CreateProductSchemaType;
    const product = await productService.createProduct(body);
    res.status(201).json({
      message: "Product created successfully",
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body, params } = res.locals.validated as UpdateProductSchemaType;
    const product = await productService.updateProduct(params.productId, body);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }
    res.status(200).json({
      message: "Product updated successfully",
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getProduct,
  getProducts,
  deleteProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
};
