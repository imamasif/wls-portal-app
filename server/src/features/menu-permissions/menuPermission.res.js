export class MenuPermissionResDTO {
  constructor(entity) {
    this.id = entity._id ? entity._id.toString() : entity.id;
    this.menuKey = entity.menuKey;
    this.label = entity.label;
    this.path = entity.path;
    this.allowedRoles = entity.allowedRoles || [];
    this.scopeRestriction = entity.scopeRestriction;
    this.isVisible = entity.isVisible;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}