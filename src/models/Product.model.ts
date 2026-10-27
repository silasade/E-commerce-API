import mongoose, { Document, Schema } from "mongoose";
import slugify from "slugify";
export interface IProductImage {
  url: string;
  publicId?: string;
}
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: mongoose.Types.ObjectId;
  images: IProductImage[];
  isActive: boolean;
}
const productImageSchema = new Schema<IProductImage>(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      lowercase: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0.01,
    },
    stock: {
      type: Number,
      required: [true, "Enter the quantity of product in stock"],
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      required: [true, "Product must belong to a category"],
      ref: "Category",
    },
    isActive: {
      type: Boolean,
      required: [true, "isAActive field is required"],
      default: true,
    },
    images: {
      type: [productImageSchema],
      required: [true, "Product image is required"],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

productSchema.pre("validate", function () {
  if (this.name && (!this.slug || this.isModified("name"))) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
});

productSchema.index({ name: "text", description: "text" });


export const Product = mongoose.model<IProduct>("Product", productSchema);
