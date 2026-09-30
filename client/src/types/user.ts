/**
 * User Role Enum defining all available system permissions
 */
export enum UserRole {
  SUPER_USER = "SUPER_USER",
  WLS_ADMIN = "WLS_ADMIN",
  USER = "USER",
}

export type SessionStatus = "NEW" | "ACTIVE" | "POSTPONED" | "COMPLETED";

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

/**
 * User Gender Enum restricting options to Male and Female
 */
export enum UserGender {
  MALE = "Male",
  FEMALE = "Female",
  NONE = "",
}

// In src/types/user.ts

export enum AppTab {
  DASHBOARD = "dashboard",
  LOGIN = "login",
  REGISTER = "register",
  USERS = "users",
  WHATSAPP_GROUPS = "whatsapp-groups",
  TEAMS_GROUPS = "teams-groups",
  UNIVERSITY_PORTAL = "university-portal",
  WLS_SESSION = "wls-session",
  WLS_ASSIGNMENT = "wls-assignment",
  WLS_MGMT = "wls-mgmt",
  WLS_ADMIN = "wls_admin",
  ASSESSMENT = "assessment",
  REPORTS = "reports",
  NOTIFICATIONS = "notifications",
  EDIT_PROFILE = "edit-profile",
  QUIZ_LIST = "quiz-list",
  QUIZ_STUDIO = "quiz-studio",
  QUIZ_REPORTS = "quiz-reports",
  QUIZ_STUDENT = "quiz-student",
  WLS_ATTENDANCE = "wls-attendance",
  MENU_PERMISSIONS = "menu-permissions",
  ROLES_CONTROL = "roles-control",
  USER_ACTIVITY = "user-activity",
  WLS_ATTENDANCE_MONITORING = "WLS_ATTENDANCE_MONITORING",
  WLS_CLASS_ATTENDANCE = "WLS_CLASS_ATTENDANCE",
}
