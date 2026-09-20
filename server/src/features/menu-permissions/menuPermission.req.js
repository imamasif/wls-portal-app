export class CreateMenuPermissionReqDTO {
  constructor(body) {
    this.menuKey = body.menuKey;
    this.label = body.label;
    this.path = body.path || '';
    this.parentId = body.parentId || null;
    this.order = body.order !== undefined ? body.order : 0;
    this.allowedRoles = body.allowedRoles || [];
    this.scopeRestriction = body.scopeRestriction || 'SELF_ONLY';
    this.isVisible = body.isVisible !== undefined ? body.isVisible : true;
  }
}

export class UpdateMenuPermissionReqDTO {
  constructor(body) {
    if (body.menuKey !== undefined) this.menuKey = body.menuKey;
    if (body.label !== undefined) this.label = body.label;
    if (body.path !== undefined) this.path = body.path;
    if (body.parentId !== undefined) this.parentId = body.parentId;
    if (body.order !== undefined) this.order = body.order;
    if (body.allowedRoles !== undefined) this.allowedRoles = body.allowedRoles;
    if (body.scopeRestriction !== undefined) this.scopeRestriction = body.scopeRestriction;
    if (body.isVisible !== undefined) this.isVisible = body.isVisible;
  }
}