export class CreateSocialGroupReqDTO {
  constructor({ name, type, allowedRoles }) {
    this.name = name;
    this.type = type;
    this.allowedRoles = allowedRoles || [];
  }
}

export class UpdateSocialGroupReqDTO {
  constructor(payload) {
    if (payload.name) this.name = payload.name;
    if (payload.type) this.type = payload.type;
    if (payload.isActive !== undefined) this.isActive = payload.isActive;
    if (payload.allowedRoles) this.allowedRoles = payload.allowedRoles;
    if (payload.members) this.members = payload.members; // <-- Added
  }
}

export class AssignSocialMemberReqDTO {
  constructor({ userId, role }) {
    this.userId = userId;
    this.role = role;
  }
}