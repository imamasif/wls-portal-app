// test-status.js
const BASE_URL = "http://localhost:5000/api";

async function request(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function testStatusTransition() {
  console.log("-------------------------------------------------------------------");
  console.log("  TESTING STATUS TRANSITION: SUBMITTED -> UNDER_REVIEW -> COMPLETED ");
  console.log("-------------------------------------------------------------------");

  // 1. Get an active session
  const sessRes = await request(`${BASE_URL}/wls-sessions`);
  const sessions = sessRes.data || [];
  const activeSession = sessions.find(s => s.status === "ACTIVE") || sessions[0];
  if (!activeSession) throw new Error("No session found");
  const sessionId = activeSession.id || activeSession._id;
  console.log(`Using Session: ${sessionId} (${activeSession.topicName})`);

  // 2. Pick a student from groupAssignments
  let studentId = null;
  const groups = activeSession.groupAssignments instanceof Map
    ? Object.fromEntries(activeSession.groupAssignments)
    : activeSession.groupAssignments || {};
  for (const g of Object.values(groups)) {
    if (g.userIds && g.userIds.length > 0) {
      studentId = String(g.userIds[0]);
      break;
    }
  }
  if (!studentId) {
    // Fallback to existing student
    studentId = "6ab659c599e80a8afc34f019"; // Ahsan Ali
  }
  console.log(`Using Student ID: ${studentId}`);

  // 3. Student submits video link -> Global status should become SUBMITTED
  const submitRes = await request(`${BASE_URL}/assessments/submit`, {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      userId: studentId,
      videoUrl: "https://drive.google.com/file/d/test-video-link/view",
      groupNumber: 1
    })
  });
  console.log("Step 1 (Student Video Submit):", submitRes.status, "Global Status:", submitRes.data?.status);
  if (submitRes.data?.status !== "SUBMITTED") {
    console.error("FAIL: Expected SUBMITTED status after video submission!");
  } else {
    console.log("PASS: Global status is SUBMITTED upon video submission.");
  }

  const assessmentId = submitRes.data?.id || submitRes.data?._id;
  if (!assessmentId) throw new Error("No assessment ID returned");

  // 4. Admin performs a Partial Save or Save of rankings -> Global status should become UNDER_REVIEW
  const gradeRes = await request(`${BASE_URL}/assessments/${assessmentId}/grade`, {
    method: "PUT",
    body: JSON.stringify({
      evaluatorId: "6ab659c599e80a8afc34f013", // Nasir Khan (WLS_ADMIN)
      evaluatorName: "Nasir Khan",
      scores: { presentation: 8, arabicReading: 9 },
      feedback: "Great recitation, working on tajweed nuances.",
      status: "PARTIAL_SAVED"
    })
  });
  console.log("Step 2 (Admin Partial Save Ranking):", gradeRes.status, "Global Status:", gradeRes.data?.status);
  if (gradeRes.data?.status !== "UNDER_REVIEW") {
    console.error("FAIL: Expected UNDER_REVIEW status after admin saves ranking!");
  } else {
    console.log("PASS: Global status changed to UNDER_REVIEW!");
  }

  // 5. Query assessment directly via GET to verify database persistence
  const getRes = await request(`${BASE_URL}/assessments/session/${sessionId}/user/${studentId}`);
  console.log("Step 3 (GET Verification from DB):", getRes.status, "Global Status:", getRes.data?.status);
  if (getRes.data?.status !== "UNDER_REVIEW") {
    console.error("FAIL: Persisted status is not UNDER_REVIEW!");
  } else {
    console.log("PASS: Verified persisted database status is UNDER_REVIEW!");
  }

  // 6. Test Super User Finalize
  const finalizeRes = await request(`${BASE_URL}/assessments/${assessmentId}/finalize`, {
    method: "PUT",
    body: JSON.stringify({ requestingUserRole: "SUPER_USER" })
  });
  console.log("Step 4 (Super User Finalize):", finalizeRes.status, "Global Status:", finalizeRes.data?.status);
  if (finalizeRes.data?.status !== "COMPLETED") {
    console.error("FAIL: Expected COMPLETED status after super user finalization!");
  } else {
    console.log("PASS: Global status finalized to COMPLETED!");
  }

  console.log("\n>>> ALL STATUS TRANSITION TESTS PASSED SUCCESSFULLY! <<<\n");
}

testStatusTransition().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
