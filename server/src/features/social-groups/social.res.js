export class SocialGroupMemberResDTO {
  constructor(member) {
    this.userId = member.userId?._id ? member.userId._id.toString() : member.userId?.toString();
    this.user = member.userId?.name ? {
      id: member.userId._id.toString(),
      name: member.userId.name,
      email: member.userId.email
    } : undefined;
    this.role = member.role;
    this.assignedAt = member.assignedAt;
  }
}

export class SocialGroupResDTO {
  constructor(group) {
    this.id = group._id ? group._id.toString() : group.id;
    this.name = group.name;
    this.type = group.type;
    this.isActive = group.isActive;
    this.allowedRoles = group.allowedRoles || [];
    this.members = Array.isArray(group.members) 
      ? group.members.map(m => new SocialGroupMemberResDTO(m)) 
      : [];
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}