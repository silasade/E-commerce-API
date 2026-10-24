import { ZodSchema, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      res.locals.validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          error: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

export { validateRequest };
