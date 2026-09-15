import { UserModel } from './user.model.js';

export class UserUseCase {
  static async createUser(dto) {
    return await UserModel.create(dto);
  }

  static async getAllUsers() {
    return await UserModel.find();
  }

  static async getUserById(id) {
    return await UserModel.findById(id);
  }

  static async updateUser(id, dto) {
    return await UserModel.findByIdAndUpdate(id, dto, { new: true });
  }

  static async deleteUser(id) {
    return await UserModel.findByIdAndDelete(id);
  }
}

export const userUseCase = UserUseCase;