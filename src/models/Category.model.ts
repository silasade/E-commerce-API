import mongoose, { Document, Schema } from "mongoose";
import slugify from "slugify";
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
      unique: true,
      minlength: [3, "Category name must be at least 3 characters"],
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
      lowercase: true,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ name: "text", description: "text", slug: "text" });

categorySchema.pre("validate", function () {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
});

export const Category = mongoose.model<ICategory>("Category", categorySchema);
