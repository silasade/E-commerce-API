import { Category } from "../models/Category.model";
import {
  CategoryIdSchemaType,
  CreateCategorySchemaType,
  GetCategorySchemaType,
  UpdateCategorySchemaType,
} from "../routes/category.route";
import { toObjectId } from "../utils/common";

class CategoryService {
  public getCategoryById = async (
    id: CategoryIdSchemaType["params"]["categoryId"],
  ) => {
    const category = await Category.findById(toObjectId(id));
    return category;
  };
  public deleteCategory = async (
    id: CategoryIdSchemaType["params"]["categoryId"],
  ) => {
    const category = await Category.findByIdAndDelete(toObjectId(id));
    return category;
  };
  public createCategory = async (body: CreateCategorySchemaType["body"]) => {
    const { isActive, name, description } = body;
    const category = await Category.create({
      isActive,
      name,
      description,
    });
    return category;
  };
  public updateCategory = async (
    body: UpdateCategorySchemaType["body"],
    id: UpdateCategorySchemaType["params"]["categoryId"],
  ) => {
    const { isActive, name, description } = body;
    const category = await Category.findById(toObjectId(id));
    if (!category) return null;
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    await category.save(); // Triggers pre("validate") hook, recomputing slug!
    return category;
  };

  public getCategories = async (
    search?: GetCategorySchemaType["query"]["search"],
  ) => {
    const filter: any = {};
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
      ];
    }
    const categories = await Category.find(filter);
    return categories;
  };

  public getCategoryBySlug = async (slug: string) => {
    const category = await Category.findOne({ slug: slug.toLowerCase() });
    return category;
  };
}

export const categoryService = new CategoryService();
