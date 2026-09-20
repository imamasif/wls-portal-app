import { MenuPermissionModel } from './menuPermission.model.js';

export class MenuPermissionUseCase {
  static async getAll() {
    return await MenuPermissionModel.find().sort({ label: 1 });
  }

  static async getByRole(role) {
    return await MenuPermissionModel.find({ allowedRoles: role, isVisible: true });
  }

  static async create(dto) {
    return await MenuPermissionModel.create(dto);
  }

  static async update(id, dto) {
    return await MenuPermissionModel.findByIdAndUpdate(id, dto, { new: true });
  }

  static async delete(id) {
    return await MenuPermissionModel.findByIdAndDelete(id);
  }
}

export const menuPermissionUseCase = MenuPermissionUseCase;