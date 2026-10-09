// test-e2e.js
const BASE_URL = "http://localhost:5000/api";
const PROXY_URL = "http://localhost:5173/api";

const results = [];

function recordTest(name, passed, details = "") {
  results.push({ name, passed, details });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} | ${name} ${details ? `(${details})` : ""}`);
}

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

async function runEndToEndTests() {
  console.log("\n=======================================================");
  console.log("       WLS PORTAL END-TO-END INTEGRATION TEST SUITE     ");
  console.log("=======================================================\n");

  let superUser = null;
  let wlsAdmin = null;
  let studentUser = null;
  let testCreatedUserId = null;
  let testCreatedSessionId = null;

  // 1. HEALTH & CONNECTIVITY
  try {
    const res = await request("http://localhost:5000/api/health");
    recordTest("Backend Direct Health Probe (Port 5000)", res.ok, `Status: ${res.data?.status || res.status}`);
  } catch (err) {
    recordTest("Backend Direct Health Probe (Port 5000)", false, err.message);
  }

  try {
    const res = await request("http://localhost:5173");
    recordTest("Frontend Dev Server UI Probe (Port 5173)", res.ok, "Vite serving index.html");
  } catch (err) {
    recordTest("Frontend Dev Server UI Probe (Port 5173)", false, err.message);
  }

  try {
    const res = await request(`${PROXY_URL}/rules`);
    const ruleCount = Array.isArray(res.data) ? res.data.length : (res.data?.value?.length || 0);
    recordTest("Vite Reverse Proxy Routing (/api/* -> Port 5000)", res.ok && ruleCount > 0, `Proxy returned ${ruleCount} rules`);
  } catch (err) {
    recordTest("Vite Reverse Proxy Routing (/api/* -> Port 5000)", false, err.message);
  }

  // 2. AUTHENTICATION FLOWS
  try {
    const res = await request(`${BASE_URL}/users/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "syedimam@iipccanada.com",
        password: "DefaultPassword!"
      })
    });
    superUser = res.data;
    recordTest("Authentication: Super User Login", res.ok && superUser?.role === "SUPER_USER", `Logged in as ${superUser?.name} (${superUser?.role})`);
  } catch (err) {
    recordTest("Authentication: Super User Login", false, err.message);
  }

  try {
    const res = await request(`${BASE_URL}/users/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "nasirkhan@iipccanada.com",
        password: "DefaultPassword!"
      })
    });
    wlsAdmin = res.data;
    recordTest("Authentication: WLS Admin Login", res.ok && wlsAdmin?.role === "WLS_ADMIN", `Logged in as ${wlsAdmin?.name} (${wlsAdmin?.role})`);
  } catch (err) {
    recordTest("Authentication: WLS Admin Login", false, err.message);
  }

  try {
    const res = await request(`${BASE_URL}/users/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "ahsanriaz.ya@gmail.com",
        password: "DefaultPassword!"
      })
    });
    studentUser = res.data;
    recordTest("Authentication: Student User Login", res.ok && studentUser?.role === "USER", `Logged in as ${studentUser?.name} (${studentUser?.role})`);
  } catch (err) {
    recordTest("Authentication: Student User Login", false, err.message);
  }

  try {
    const res = await request(`${BASE_URL}/users/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "syedimam@iipccanada.com",
        password: "WrongPassword999!"
      })
    });
    recordTest("Authentication: Reject Invalid Password", res.status === 401, `Correctly returned HTTP 401 Unauthorized`);
  } catch (err) {
    recordTest("Authentication: Reject Invalid Password", false, err.message);
  }

  // 3. USER MANAGEMENT CRUD
  try {
    const res = await request(`${BASE_URL}/users`);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    recordTest("User Management: Get All Users", res.ok && count > 0, `Total users: ${count}`);
  } catch (err) {
    recordTest("User Management: Get All Users", false, err.message);
  }

  const testEmail = `test.e2e.${Date.now()}@example.com`;
  try {
    const res = await request(`${BASE_URL}/users`, {
      method: "POST",
      body: JSON.stringify({
        name: "E2E Automated User",
        email: testEmail,
        password: "DefaultPassword!",
        role: "USER",
        city: "Toronto",
        country: "Canada",
        groupNumbers: [1]
      })
    });
    const created = res.data?.user || res.data;
    testCreatedUserId = created?._id || created?.id;
    recordTest("User Management: Register New User", res.ok && !!testCreatedUserId, `Created ID: ${testCreatedUserId}`);
  } catch (err) {
    recordTest("User Management: Register New User", false, err.message);
  }

  // 4. CRITERIA ENGINE / RULES
  try {
    const res = await request(`${BASE_URL}/rules`);
    const count = Array.isArray(res.data) ? res.data.length : (res.data?.value?.length || 0);
    recordTest("Criteria Engine: Fetch Scoring Rules", res.ok && count >= 7, `${count} evaluation criteria loaded`);
  } catch (err) {
    recordTest("Criteria Engine: Fetch Scoring Rules", false, err.message);
  }

  // 5. WLS SESSION LIFECYCLE
  try {
    const res = await request(`${BASE_URL}/wls-sessions`);
    const sessions = Array.isArray(res.data) ? res.data : (res.data?.sessions || []);
    recordTest("WLS Sessions: Fetch All Sessions", res.ok, `Found ${sessions.length} sessions`);
  } catch (err) {
    recordTest("WLS Sessions: Fetch All Sessions", false, err.message);
  }

  try {
    const newSessionPayload = {
      topicName: `E2E Live Test Session - ${new Date().toLocaleDateString()}`,
      sessionDateTimeToronto: new Date().toISOString(),
      pdfBookletUrl: "https://example.com/test-booklet.pdf",
      quranVideoUrl: "https://youtube.com/watch?v=live-test",
      status: "ACTIVE",
      groupAssignments: {
        "1": {
          userIds: studentUser ? [studentUser.id || studentUser._id] : [],
          adminIds: wlsAdmin ? [wlsAdmin.id || wlsAdmin._id] : [],
          selectedAyats: ["Surah Al-Baqarah (2:1-5)"],
          instructions: "Automated E2E assignment testing"
        }
      }
    };
    const res = await request(`${BASE_URL}/wls-sessions`, {
      method: "POST",
      body: JSON.stringify(newSessionPayload)
    });
    const createdSession = res.data?.session || res.data;
    testCreatedSessionId = createdSession?._id || createdSession?.id;
    recordTest("WLS Sessions: Create New WLS Session", (res.status === 201 || res.status === 200) && !!testCreatedSessionId, `Created Session ID: ${testCreatedSessionId}`);
  } catch (err) {
    recordTest("WLS Sessions: Create New WLS Session", false, err.message);
  }

  // 6. QUIZ MANAGEMENT
  try {
    const res = await request(`${BASE_URL}/quizzes`);
    const quizzes = Array.isArray(res.data) ? res.data : [];
    recordTest("Quiz Management: Retrieve Quizzes", res.ok, `${quizzes.length} quizzes retrieved`);
  } catch (err) {
    recordTest("Quiz Management: Retrieve Quizzes", false, err.message);
  }

  // 7. UNIVERSITY PORTAL & PROGRESS
  try {
    const res = await request(`${BASE_URL}/universities/university-summary`);
    const totalEnrollments = res.data?.data?.totalEnrollments ?? res.data?.totalEnrollments ?? 0;
    recordTest("University Portal: Summary & Student Progress", res.ok && totalEnrollments > 0, `${totalEnrollments} student enrollments tracked`);
  } catch (err) {
    recordTest("University Portal: Summary & Student Progress", false, err.message);
  }

  try {
    const res = await request(`${BASE_URL}/universities/courses`);
    const courses = Array.isArray(res.data) ? res.data : [];
    recordTest("University Portal: Fetch Courses", res.ok, `${courses.length} courses listed`);
  } catch (err) {
    recordTest("University Portal: Fetch Courses", false, err.message);
  }

  // 8. NOTIFICATIONS & ATTENDANCE
  try {
    const targetUserId = superUser?.id || superUser?._id || "6ab659c599e80a8afc34f007";
    const res = await request(`${BASE_URL}/notifications/user/${targetUserId}`);
    recordTest("Notifications: Fetch User Notification Feed", res.ok, `Feed retrieved for user ${targetUserId}`);
  } catch (err) {
    recordTest("Notifications: Fetch User Notification Feed", false, err.message);
  }

  try {
    if (testCreatedSessionId) {
      const res = await request(`${BASE_URL}/wls-attendance/session/${testCreatedSessionId}`);
      recordTest("Attendance: Fetch Session Attendance Status", res.ok, `Tracking initialized for session ${testCreatedSessionId}`);
    } else {
      recordTest("Attendance: Fetch Session Attendance Status", false, "No sessionId available");
    }
  } catch (err) {
    recordTest("Attendance: Fetch Session Attendance Status", false, err.message);
  }

  // 9. CATEGORY LECTURES
  try {
    const res = await request(`${BASE_URL}/category-lectures`);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    recordTest("Category Lectures: Fetch Curriculum Index", res.ok && count > 0, `${count} categories found`);
  } catch (err) {
    recordTest("Category Lectures: Fetch Curriculum Index", false, err.message);
  }

  // 10. SOCIAL GROUPS
  try {
    const res = await request(`${BASE_URL}/social-groups`);
    recordTest("Social Groups: WhatsApp & Teams Integration", res.ok, "Groups retrieved");
  } catch (err) {
    recordTest("Social Groups: WhatsApp & Teams Integration", false, err.message);
  }

  // SUMMARY REPORT
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${((passed / total) * 100).toFixed(1)}%`);
  console.log("=======================================================\n");

  process.exit(failed === 0 ? 0 : 1);
}

runEndToEndTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
