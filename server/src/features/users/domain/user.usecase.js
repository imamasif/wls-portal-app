import { UserModel } from '../data/user.model.js';

export class UserUseCase {
  static async createUser(dto) {
    const newUser = await UserModel.create(dto);
    return newUser;
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