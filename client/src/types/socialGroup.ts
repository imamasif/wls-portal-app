export type SocialGroupType = "whatsapp" | "teams" | "university";

export type SocialGroupRole = "GROUP_ADMIN" | "GROUP_MEMBER";

export interface SocialGroupMember {
  id: string | number;
  name?: string;
  email: string;
  groupRole: SocialGroupRole; // Specifies if user is Admin/Owner or Member of this specific group
}

export interface SocialGroupMember {
  id: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export interface SocialGroup {
  id: string | number;
  name: string;
  type: SocialGroupType;
  link?: string;
  description?: string;
  batchYear?: string;
  batchSemester?: string;
  members?: SocialGroupMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSocialGroupPayload {
  name: string;
  type: SocialGroupType;
  link?: string;
  description?: string;
  batchYear?: string;
  batchSemester?: string;
}

export interface AssignMembersPayload {
  userIds: (string | number)[];
}
