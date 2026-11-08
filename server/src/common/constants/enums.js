// src/common/constants/enums.js

export const USER_ROLES = {
  SUPER_USER: "SUPER_USER",
  WLS_ADMIN: "WLS_ADMIN",
  USER: "USER",
  UNIVERSITY_SUPER_USER: "university_super_user",
  UNIVERSITY_ADMIN: "university_admin",
  UNIVERSITY_STUDENT: "university_student",
};
export const UserRole = USER_ROLES;

export const UNIVERSITY_ROLES = {
  SUPER_USER: "university_super_user",
  ADMIN: "university_admin",
  STUDENT: "university_student",
};

export const ASSESSMENT_STATUSES = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  PARTIAL_SAVED: "PARTIAL_SAVED",
  REVIEWED: "REVIEWED", // <-- Admin marked their grading as done
  COMPLETED: "COMPLETED", // <-- Reserved for Super User overall completion
};
export const AssessmentStatus = ASSESSMENT_STATUSES;

export const CONCLUSION_STATUSES = {
  PENDING: "PENDING",
  PASSED: "PASSED",
  FAILED: "FAILED",
};
export const ConclusionStatus = CONCLUSION_STATUSES;

export const WLS_SESSION_STATUSES = {
  NEW: "NEW",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  COMPLETED: "COMPLETED",
};
export const WlsSessionStatus = WLS_SESSION_STATUSES;

export const QUESTION_TYPES = {
  SINGLE_SELECT: "SINGLE_SELECT",
  MULTI_SELECT: "MULTI_SELECT",
  TRUE_FALSE: "TRUE_FALSE",
  TEXT_INPUT: "TEXT_INPUT",
  SEQUENCE_ORDER: "SEQUENCE_ORDER",
};
export const QuestionType = QUESTION_TYPES;

// Helpful array for Mongoose enums and validation loops
export const QUESTION_TYPE_VALUES = Object.values(QUESTION_TYPES);

export const isSuperUserRole = (role) => {
  if (!role) return false;
  const upper = String(role).toUpperCase();
  return (
    upper === "SUPER_USER" ||
    upper === "WLS_ADMIN" ||
    upper === "UNIVERSITY_SUPER_USER"
  );
};

export const hasUserRole = (user, targetRole) => {
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
