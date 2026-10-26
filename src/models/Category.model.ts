import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  slug: string;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Name of category is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: [true, "isAActive field is required"],
      default: true,
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Slug is required"],
    },
  },
  {
    timestamps: true,
  },
);

export const CategoryModel = mongoose.model<ICategory>(
  "Category",
  categorySchema,
);
