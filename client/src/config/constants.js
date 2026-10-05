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

export const ASSESSMENT_SCORE_LEVELS = {
  SCORE_1: { min: 1, max: 1, label: "Need to work hard", color: "#7f1d1d" }, // Dark Red
  SCORE_2: { min: 2, max: 2, label: "Need to work hard", color: "#dc2626" }, // Red
  SCORE_3: { min: 3, max: 3, label: "Need improvement", color: "#f97316" }, // Orange
  SCORE_4: { min: 4, max: 4, label: "Need improvement", color: "#facc15" }, // Yellow-Orange
  SCORE_5: { min: 5, max: 5, label: "On expectation", color: "#eab308" }, // Yellow
  SCORE_6: { min: 6, max: 6, label: "On expectation", color: "#38bdf8" }, // Light Blue
  SCORE_7: { min: 7, max: 7, label: "On expectation", color: "#0284c7" }, // Blue
  SCORE_8: { min: 8, max: 8, label: "Above expectation", color: "#f472b6" }, // Pink
  SCORE_9: { min: 9, max: 9, label: "Above expectation", color: "#db2777" }, // Deep Pink/Magenta
  SCORE_10: { min: 10, max: 10, label: "Extra ordinary", color: "#16a34a" }, // Green
};

export function getScoreLevel(val) {
  const num = Number(val) || 1;
  const clamped = Math.max(1, Math.min(10, num));
  return (
    ASSESSMENT_SCORE_LEVELS[`SCORE_${clamped}`] ||
    ASSESSMENT_SCORE_LEVELS.SCORE_1
  );
}
