import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";
import { NextFunction, Request, Response } from "express";

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        message: "Please provide an image",
        success: false,
      });
      return;
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "ecommerce/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Failed to upload image"));
          } else {
            resolve(result);
          }
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

