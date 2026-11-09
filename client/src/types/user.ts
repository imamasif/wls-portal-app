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

export const ASSESSMENT_STATUSES = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  PARTIAL_SAVED: "PARTIAL_SAVED",
  REVIEWED: "REVIEWED",
  COMPLETED: "COMPLETED",
} as const;

export enum ConclusionStatus {
  PENDING = "PENDING",
  PASSED = "PASSED",
  FAILED = "FAILED",
}

export const CONCLUSION_STATUSES = {
  PENDING: "PENDING",
  PASSED: "PASSED",
  FAILED: "FAILED",
} as const;

export enum WlsSessionStatus {
  NEW = "NEW",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  COMPLETED = "COMPLETED",
}

export const WLS_SESSION_STATUSES = {
  NEW: "NEW",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type SessionStatus = "NEW" | "ACTIVE" | "INACTIVE" | "POSTPONED" | "COMPLETED";

export enum QuestionType {
  SINGLE_SELECT = "SINGLE_SELECT",
  MULTI_SELECT = "MULTI_SELECT",
  TRUE_FALSE = "TRUE_FALSE",
  TEXT_INPUT = "TEXT_INPUT",
  SEQUENCE_ORDER = "SEQUENCE_ORDER",
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

/**
 * Multi-role checker for checking specific roles
 */
export const hasUserRole = (user: IUser | null | undefined, targetRole: string): boolean => {
  if (!user) return false;
  const target = String(targetRole).toLowerCase();
  const currentRole = String(user.role || "").toLowerCase();

  // Global SUPER_USER inherits university_super_user and university_admin privileges
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

/**
 * User Gender Enum restricting options to Male and Female
 */
export enum UserGender {
  MALE = "Male",
  FEMALE = "Female",
  NONE = "",
}

export enum AppTab {
  DASHBOARD = "dashboard",
  LOGIN = "login",
  REGISTER = "register",
  USERS = "users",
  WHATSAPP_GROUPS = "whatsapp-groups",
  TEAMS_GROUPS = "teams-groups",
  UNIVERSITY_PORTAL = "university-portal",
  UNIVERSITY_SUPER_USER = "university-super-user",
  UNIVERSITY_INSTRUCTOR = "university-instructor",
  UNIVERSITY_STUDENT = "university-student",
  WLS_SESSION = "wls-session",
  WLS_ASSIGNMENT = "wls-assignment",
  WLS_MGMT = "wls-mgmt",
  WLS_ADMIN = "wls_admin",
  ASSESSMENT = "assessment",
  ASSESSMENT_OVERVIEW = "ASSESSMENT_OVERVIEW",
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
  STICKY_NOTES = "sticky-notes",
  QURAN_MEMORIZER = "quran-memorizer",
  QURAN_TREE = "quran-tree",
  QURAN_EXPLORER = "quran-explorer",
  AYAT_MANAGER = "ayat-manager",
  QURAN_NOTEBOOK = "quran-notebook",
  IIPC_EVENTS = "iipc-events",
  USER_EVENTS = "user-events",
  LETTERHEADS = "letterheads",
}
