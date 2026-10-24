import { User } from "../models/User.model";
import { toObjectId } from "../utils/common";

class UserService {
  public findUserByEmail = async (email: string, includePassword = false) => {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select("+password");
    }
    return await query;
  };
  public findUserById = async (id: string) => {
    const user = await User.findById(toObjectId(id));
    return user;
  };
}

export const userService = new UserService();
