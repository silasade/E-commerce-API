import { NextFunction, Request, Response } from "express";

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(statusCode).json({
    message,
    success: false,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
