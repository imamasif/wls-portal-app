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
    if (payload.members) {
      this.members = payload.members.map(m => ({
        userId: m.userId || m.id || m.user?.id,
        role: m.role,
        assignedAt: m.assignedAt || new Date()
      }));
    }
  }
}

export class AssignSocialMemberReqDTO {
  constructor(payload) {
    this.userId = payload.userId || payload.user || payload.id;
    this.role = payload.role;
  }
}