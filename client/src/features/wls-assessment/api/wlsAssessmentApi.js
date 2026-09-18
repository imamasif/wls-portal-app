/**
 * WLS Assessment Module API Layer
 */

// Fetch active sessions, assessments, user accounts, and evaluation rules in parallel
export async function fetchAssessmentPanelData(currentAdminId) {
  const [resSessions, resAssessments, resUsers, resRules] = await Promise.all([
    fetch('/api/wls-sessions?status=ACTIVE'),
    fetch('/api/assessments'),
    fetch('/api/users'),
    fetch('/api/rules').catch(() => null)
  ]);

  const sessions = resSessions.ok ? await resSessions.json() : [];
  const assessments = resAssessments.ok ? await resAssessments.json() : [];
  const allUsers = resUsers.ok ? await resUsers.json() : [];
  const rulesData = resRules && resRules.ok ? await resRules.json() : [];

  return {
    sessions,
    assessments,
    allUsers,
    rulesData
  };
}

// Initialize a new assessment record when missing an existing target ID
export async function createAssessmentRecord({ sessionId, userId, videoUrl, groupNumber = 1 }) {
  const response = await fetch('/api/assessments/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      userId,
      videoUrl: videoUrl || 'https://placeholder-url.com',
      groupNumber
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to initialize assessment record');
  }
  return data;
}

// Update grades, scores, feedback, and admin overridden video stream URL
export async function gradeAssessmentRecord(assessmentId, payload) {
  if (!assessmentId || !/^[0-9a-fA-F]{24}$/.test(assessmentId)) {
    throw new Error(`Invalid Assessment Record ID (${assessmentId}). Unable to save grade.`);
  }

  const response = await fetch(`/api/assessments/${assessmentId}/grade`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Validation Failed');
  }
  return data;
}

/**
 * Submits or updates a student's video link using the existing backend assessment route.
 * Matches backend POST /api/assessments/submit endpoint.
 */
export const submitStudentVideo = async (sessionId, videoUrl, userId, groupNumber = 1) => {
  const response = await fetch('/api/assessments/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      sessionId, 
      userId, 
      videoUrl, 
      groupNumber 
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to submit video assessment');
  }
  return data;
};

// Alias for backwards compatibility if called elsewhere in your frontend
export const submitVideoUrl = async (sessionId, payload) => {
  return await submitStudentVideo(
    sessionId, 
    payload.videoUrl, 
    payload.userId, 
    payload.groupNumber || 1
  );
};

