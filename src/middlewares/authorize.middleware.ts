import { Response, NextFunction } from "express";
import { UserRole } from "../models/User.model";
import { AuthenticateRequest } from "./validateUser.middleware";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticateRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to view this resource",
      });
      return;
    }

    next();
  };
};
