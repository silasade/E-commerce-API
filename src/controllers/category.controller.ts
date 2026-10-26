import { NextFunction, Request, Response } from "express";
import { categoryService } from "../services/category.service";
import {
  CategoryIdSchemaType,
  CategorySlugSchemaType,
  CreateCategorySchemaType,
  GetCategorySchemaType,
  UpdateCategorySchemaType,
} from "../routes/category.route";

const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { params } = res.locals.validated as CategoryIdSchemaType;
    const { categoryId } = params;
    const category = await categoryService.getCategoryById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { query } = res.locals.validated as GetCategorySchemaType;
    const search = query?.search;
    const categories = await categoryService.getCategories(search);

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { params } = res.locals.validated as CategoryIdSchemaType;
    const { categoryId } = params;
    const category = await categoryService.deleteCategory(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      message: "Category deleted",
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body, params } = res.locals.validated as UpdateCategorySchemaType;
    const { categoryId } = params;
    const category = await categoryService.updateCategory(body, categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body } = res.locals.validated as CreateCategorySchemaType;
    const category = await categoryService.createCategory(body);
    res.status(201).json({
      message: "Category created",
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { params } = res.locals.validated as CategorySlugSchemaType;
    const { slug } = params;
    const category = await categoryService.getCategoryBySlug(slug);
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getCategoryById,
  getCategories,
  deleteCategory,
  updateCategory,
  createCategory,
  getCategoryBySlug,
};
