/**
 * WLS Management API Service
 * Centralizes all backend endpoints for Users, WLS Sessions, Assessments, and Chat.
 */

import { API_BASE } from "../../../config/constants";

const getBaseUrl = () => (typeof API_BASE !== "undefined" ? API_BASE : "");

export const fetchUsers = async () => {
  const res = await fetch("/api/users");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error || data.message || "Failed to fetch users");
  return data;
};

// --- WLS Sessions API ---
export const fetchWlsSessions = async () => {
  const res = await fetch("/api/wls-sessions");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || "Failed to fetch WLS sessions",
    );
  return data;
};

export const createWlsSession = async (sessionData) => {
  const res = await fetch("/api/wls-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error || data.message || "Failed to create WLS session",
    );
  }
  return data;
};

export const updateWlsSession = async (sessionId, sessionData) => {
  const res = await fetch(`/api/wls-sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error || data.message || "Failed to update WLS session",
    );
  }
  return data;
};

export const updateWlsSessionStatus = async (
  sessionId,
  status,
  cancelReason = "",
) => {
  const res = await fetch(`/api/wls-sessions/${sessionId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, cancelReason }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || "Failed to update session status",
    );
  return data;
};

export const deleteWlsSession = async (sessionId) => {
  const res = await fetch(`/api/wls-sessions/${sessionId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || "Failed to delete WLS session",
    );
  return data;
};

export const submitWlsSessionVideo = async (sessionId, payload) => {
  const res = await fetch(`/api/wls-sessions/${sessionId}/submit-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error || data.message || "Failed to submit video");
  return data;
};

// --- Assessments & Chat API ---
export const fetchUserAssessments = async (userId) => {
  const res = await fetch(`/api/assessments/user/${userId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || "Failed to fetch user assessments",
    );
  return data;
};

export const submitAssessment = async (payload) => {
  const res = await fetch("/api/assessments/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || "Failed to submit assessment",
    );
  return data;
};

export const fetchSessionUserAssessment = async (sessionId, userId) => {
  const res = await fetch(
    `/api/assessments/session/${sessionId}/user/${userId}`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || "Failed to fetch session user assessment",
    );
  return data;
};

export const postAssessmentMessage = async (assessmentId, messageDto) => {
  const res = await fetch(`/api/assessments/${assessmentId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messageDto),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.error || data.message || "Failed to post assessment message",
    );
  return data;
};
