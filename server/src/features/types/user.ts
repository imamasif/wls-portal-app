/**
 * User Role Enum defining all available system permissions
 */
export enum UserRole {
  SUPER_USER = "SUPER_USER",
  WLS_ADMIN = "WLS_ADMIN",
  USER = "USER",
  UNIVERSITY_SUPER_USER = "university_super_user",
  UNIVERSITY_ADMIN = "university_admin",
  UNIVERSITY_STUDENT = "university_student",
}

export const USER_ROLES = {
  SUPER_USER: "SUPER_USER",
  WLS_ADMIN: "WLS_ADMIN",
  USER: "USER",
  UNIVERSITY_SUPER_USER: "university_super_user",
  UNIVERSITY_ADMIN: "university_admin",
  UNIVERSITY_STUDENT: "university_student",
} as const;

export const UNIVERSITY_ROLES = {
  SUPER_USER: "university_super_user",
  ADMIN: "university_admin",
  STUDENT: "university_student",
} as const;

export enum AssessmentStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  UNDER_REVIEW = "UNDER_REVIEW",
  PARTIAL_SAVED = "PARTIAL_SAVED",
  REVIEWED = "REVIEWED",
  COMPLETED = "COMPLETED",
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
  role: UserRole | string;
  roles?: (UserRole | string)[];
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
  const upper = String(role).toUpperCase();
  return (
    upper === "SUPER_USER" ||
    upper === "WLS_ADMIN" ||
    upper === "UNIVERSITY_SUPER_USER"
  );
};

export const hasUserRole = (user: IUser | null | undefined, targetRole: string): boolean => {
  if (!user) return false;
  const target = String(targetRole).toLowerCase();
  const currentRole = String(user.role || "").toLowerCase();

  if (currentRole === "super_user") {
    if (target === "university_super_user" || target === "university_admin") {
      return true;
    }
  }

  if (currentRole === target) return true;

  if (Array.isArray(user.roles)) {
    return user.roles.some((r) => String(r).toLowerCase() === target);
  }

  return false;
};
