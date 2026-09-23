// src/common/constants/enums.js

export const USER_ROLES = {
  SUPER_USER: "SUPER_USER",
  WLS_ADMIN: "WLS_ADMIN",
  USER: "USER",
};

export const WLS_SESSION_STATUSES = {
  NEW: "NEW",
  ACTIVE: "ACTIVE",
  POSTPONED: "POSTPONED",
  COMPLETED: "COMPLETED",
  INACTIVE: "INACTIVE",
  CANCELLED: "CANCELLED",
};

export const QUESTION_TYPES = {
  SINGLE_SELECT: "SINGLE_SELECT",
  MULTI_SELECT: "MULTI_SELECT",
  TRUE_FALSE: "TRUE_FALSE",
  TEXT_INPUT: "TEXT_INPUT",
  SEQUENCE_ORDER: "SEQUENCE_ORDER",
};

// Helpful array for Mongoose enums and validation loops
export const QUESTION_TYPE_VALUES = Object.values(QUESTION_TYPES);
