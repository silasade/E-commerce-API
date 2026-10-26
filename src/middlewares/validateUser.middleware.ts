import { IUser, User } from "../models/User.model";
import { Request, Response, NextFunction } from "express";
import { auth } from "../services/auth.service";
import { userService } from "../services/user.service";
export interface AuthenticateRequest extends Request {
  user?: IUser;
}

const validateUser = async (
  req: AuthenticateRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const headers = req.headers;
    let token: string;
    if (headers.authorization && headers.authorization.startsWith("Bearer ")) {
      token = headers.authorization.split(" ")[1];
    } else {
      res.status(401).json({
        message: "You are not authorized to access this resource",
        success: false,
      });
      return;
    }
    const decodedPayload = auth.verifyToken(token);
    if (!decodedPayload) {
      res.status(401).json({
        message: "Invalid or expired token",
        success: false,
      });
      return;
    }
    const user = await userService.findUserById(decodedPayload.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export { validateUser };
