import jwt from "jsonwebtoken";
import { RegisterUserSchemaType } from "../routes/auth.route";
import { User } from "../models/User.model";
import dotenv from "dotenv";
dotenv.config();
class Auth {
  private readonly jwtSecret: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("FATAL: JWT_SECRET environment variable is missing!");
    }
    this.jwtSecret = secret;
  }

  public register = async (body: RegisterUserSchemaType["body"]) => {
    const { email, firstName, lastName, password } = body;
    const user = await User.create({ email, firstName, lastName, password });
    return user;
  };

  public createToken = (id: string, email: string): string => {
    const token = jwt.sign({ id, email }, this.jwtSecret, {
      expiresIn: "7d",
    });
    return token;
  };

  public verifyToken = (token: string) => {
    const decodePayload = jwt.verify(token, this.jwtSecret) as {
      id: string;
      email: string;
    };

    return decodePayload;
  };
}

export const auth = new Auth();
