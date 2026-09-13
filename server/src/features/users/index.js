import { UserModel } from './data/user.model.js';
import { UserMapper } from './domain/user.mapper.js'; // <-- ADD THIS IMPORT

export class UserRepository {
  async findById(id) {
    return await UserModel.findById(id);
  }

  async findAll() {
    return await UserModel.find({});
  }

  async update(id, updateData) {
    return await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await UserModel.findByIdAndDelete(id);
  }
}

export class UserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getUserById(id) {
    return await this.userRepository.findById(id);
  }

  async getAllUsers() {
    return await this.userRepository.findAll();
  }

  async updateUser(id, dto) {
    return await this.userRepository.update(id, dto);
  }

  async deleteUser(id) {
    return await this.userRepository.delete(id);
  }
}

const userRepository = new UserRepository();
const userUseCase = new UserUseCase(userRepository);

export {
  UserModel,
  UserMapper, // <-- ADD THIS EXPORT
  userRepository,
  userUseCase
};