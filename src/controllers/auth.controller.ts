import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { auth } from "../services/auth.service";
import {
  ForgotPasswordSchemaType,
  LoginUserSchemaType,
  RegisterUserSchemaType,
  ResetPasswordSchemaType,
} from "../routes/auth.route";
const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = res.locals.validated as RegisterUserSchemaType;
    const { email } = body;
    const userExist = await userService.findUserByEmail(email);
    if (userExist) {
      res.status(401).json({
        success: false,
        message: "User with this email already exist",
      });
      return;
    }
    const user = await auth.register(body);
    const userObj =
      user && typeof (user as any).toObject === "function"
        ? (user as any).toObject()
        : { ...user };
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = res.locals.validated as LoginUserSchemaType;
    const { email, password } = body;
    const user = await userService.findUserByEmail(email, true);
    if (!user) {
      res.status(404).json({
        message: "User with this email does not exist",
        success: false,
      });
      return;
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(403).json({
        message: "Invalid email or password",
        success: false,
      });
      return;
    }
    const token = await auth.createToken(String(user._id), user.email);
    const userObj =
      user && typeof (user as any).toObject === "function"
        ? (user as any).toObject()
        : { ...user };
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "User login successful",
      data: {
        ...userObj,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body } = res.locals.validated as ForgotPasswordSchemaType;
    const { email } = body;
    const user = await userService.findUserByEmail(email, true);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
      return;
    }
    const token = await auth.createToken(String(user._id), user.email);
    res.status(201).json({
      success: true,
      message: "Password reset successfully",
      data: {
        resetToken: token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { body, query } = res.locals.validated as ResetPasswordSchemaType;
    const { newPassword } = body;
    const { email, resetToken } = query;
    const user = await userService.findUserByEmail(email, true);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
      return;
    }
    const decodedUser = await auth.verifyToken(resetToken);
    if (!decodedUser) {
      res.status(404).json({
        success: false,
        message: "User does not exist",
      });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.status(201).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, forgotPassword, resetPassword };
