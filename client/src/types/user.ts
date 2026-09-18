/**
 * User Role Enum defining all available system permissions
 */
export enum UserRole {
  SUPER_USER = "SUPER_USER",
  WLS_ADMIN = "WLS_ADMIN",
  USER = "USER",
}

/**
 * Social Media Link Interface
 */
export interface ISocialMedia {
  platform: string;
  handleUrl: string;
}

/**
 * Main User Model Interface
 */
export interface IUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  profession?: string;
  education?: string;
  city?: string;
  state?: string;
  country?: string;
  profilePictureUrl?: string;
  driveFolderPath?: string;
  drive?: string;
  causeContribution?: string;
  socialMedia?: ISocialMedia[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Helper Type Guard to verify Super User/Admin access
 */
export const isSuperUserRole = (role?: UserRole | string): boolean => {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper === UserRole.SUPER_USER || upper === UserRole.WLS_ADMIN;
};
