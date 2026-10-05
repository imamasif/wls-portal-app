export const API_BASE = "http://localhost:5000/api";

export const SYSTEM_ROLES = [
  { value: "SUPER_USER", label: "SUPER USER" },
  { value: "WLS_ADMIN", label: "WLS ADMIN" },
  { value: "USER", label: "USER" },
];

// Kept for backward compatibility with existing code
export const ROLES = ["SUPER_USER", "WLS_ADMIN", "USER"];

export const QUESTION_TYPES = [
  { value: "SINGLE_SELECT", label: "Single Select" },
  { value: "MULTI_SELECT", label: "Multiple Select" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "TEXT_INPUT", label: "Text Input" },
  { value: "SEQUENCE_ORDER", label: "Sequence Order" },
];

export const QTYPES = {
  SINGLE_SELECT: "SINGLE_SELECT",
  MULTI_SELECT: "MULTI_SELECT",
  TRUE_FALSE: "TRUE_FALSE",
  TEXT_INPUT: "TEXT_INPUT",
  SEQUENCE_ORDER: "SEQUENCE_ORDER",
};
