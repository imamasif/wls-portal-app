export const UserRole = {
  SUPER_USER: "SUPER_USER",
  WLS_ADMIN: "WLS_ADMIN",
  USER: "USER",
};

export const AssessmentStatus = {
  PENDING: "PENDING",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  PARTIAL_SAVED: "PARTIAL_SAVED",
  REVIEWED: "REVIEWED",
  COMPLETED: "COMPLETED",
};

export const isSuperUserRole = (role) => {
  if (!role) return false;
  const upper = String(role).toUpperCase();
  return upper === UserRole.SUPER_USER || upper === UserRole.WLS_ADMIN;
};
