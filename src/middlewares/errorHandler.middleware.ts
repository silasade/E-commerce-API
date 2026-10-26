import { NextFunction, Request, Response } from "express";

interface CustomError extends Error {
  statusCode?: number;
  http_code?: number;
  code?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || err.http_code || 500;
  let message = err.message || "Internal server error";

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  } else if (
    err.name === "MulterError" ||
    err.message === "Only image files are allowed"
  ) {
    statusCode = 400;
  } else if (err.code === 11000) {
    statusCode = 409;
    const keyValue = (err as any).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : "Field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    message,
    success: false,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
