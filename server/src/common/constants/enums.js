// src/common/constants/enums.js

export const USER_ROLES = {
  SUPER_USER: "SUPER_USER",
  WLS_ADMIN: "WLS_ADMIN",
  USER: "USER",
};
export const UserRole = USER_ROLES;

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
  return upper === USER_ROLES.SUPER_USER || upper === USER_ROLES.WLS_ADMIN;
};

