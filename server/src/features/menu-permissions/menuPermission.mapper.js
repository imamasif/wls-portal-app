import { CreateMenuPermissionReqDTO, UpdateMenuPermissionReqDTO } from './menuPermission.req.js';
import { MenuPermissionResDTO } from './menuPermission.res.js';

export class MenuPermissionMapper {
  static toResDTO(model) {
    return {
      id: model._id,
      menuKey: model.menuKey,
      label: model.label,
      path: model.path,
      parentId: model.parentId || null, // <-- Make sure this line is added!
      order: model.order,
      allowedRoles: model.allowedRoles,
      scopeRestriction: model.scopeRestriction,
      isVisible: model.isVisible,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    };
  }

  static toResDTOList(models) {
    return models.map(model => MenuPermissionMapper.toResDTO(model));
  }
}