import { connectDB } from "./src/common/database/db.js";
import "./src/features/quizzes/quiz.model.js";
import { UserModel } from "./src/features/users/user.model.js";
import {
  DepartmentModel,
  BatchModel,
  SemesterModel,
  CourseModel,
  LectureModel,
  StudentEnrollmentModel,
  StudentLectureProgressModel,
  StudentExamAttemptModel,
  CertificateModel,
  UniversityMessageModel,
} from "./src/features/university/university.model.js";
import { UniversityUseCase } from "./src/features/university/university.usecase.js";

async function runUniversityE2ETest() {
  console.log("===============================================================================");
  console.log("             UNIVERSITY SYSTEM END-TO-END VERIFICATION & AUDIT SUITE           ");
  console.log("===============================================================================\n");

  await connectDB();

  const auditLog = {
    passed: [],
    failed: [],
    derailments: [],
    recommendations: [],
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 0: CLEANUP PREVIOUS TEST RUN DATA
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 0] Cleaning up any prior test run artifacts...");
    const testEmails = [
      "test_student_qge@iipc.test",
      "test_student_qgu@iipc.test",
      "test_student_dual@iipc.test",
      "test_student_unenrolled@iipc.test",
      "test_student_boundary@iipc.test",
      "test_instructor@iipc.test",
    ];

    const existingTestUsers = await UserModel.find({ email: { $in: testEmails } });
    const testUserIds = existingTestUsers.map((u) => u._id);

    await StudentEnrollmentModel.deleteMany({ studentId: { $in: testUserIds } });
    await StudentLectureProgressModel.deleteMany({ studentId: { $in: testUserIds } });
    await StudentExamAttemptModel.deleteMany({ studentId: { $in: testUserIds } });
    await CertificateModel.deleteMany({ studentId: { $in: testUserIds } });
    await UniversityMessageModel.deleteMany({
      $or: [{ studentId: { $in: testUserIds } }, { instructorId: { $in: testUserIds } }],
    });
    await UserModel.deleteMany({ email: { $in: testEmails } });

    console.log("✓ Prior test artifacts cleanly removed.\n");

    // -------------------------------------------------------------------------
    // STEP 1: RESOLVE DEPARTMENTS, BATCHES, SEMESTERS, COURSES
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 1] Resolving Academic Entities...");
    const deptQGE = await DepartmentModel.findOne({ code: "QGE" });
    const deptQGU = await DepartmentModel.findOne({ code: "QGU" });

    if (!deptQGE || !deptQGU) {
      throw new Error("Departments QGE and/or QGU not found in database.");
    }
    console.log(`✓ Dept English: ${deptQGE.name} (_id: ${deptQGE._id})`);
    console.log(`✓ Dept Urdu:    ${deptQGU.name} (_id: ${deptQGU._id})`);

    const batchQGE = await BatchModel.findOne({ departmentId: deptQGE._id, year: 2026 });
    const batchQGU = await BatchModel.findOne({ departmentId: deptQGU._id, year: 2026 });

    const sem1QGE = await SemesterModel.findOne({ departmentId: deptQGE._id, semesterNumber: 1 });
    const sem1QGU = await SemesterModel.findOne({ departmentId: deptQGU._id, semesterNumber: 1 });

    const courseQGE = await CourseModel.findOne({ code: "QGE-01-002" }).populate("examQuizId");
    const courseQGU = await CourseModel.findOne({ code: "QGU-01-002" }).populate("examQuizId");

    if (!courseQGE || !courseQGU) {
      throw new Error("Target test courses (QGE-01-002 / QGU-01-002) not found.");
    }
    console.log(`✓ Test Course QGE: ${courseQGE.code} - "${courseQGE.title}" (ExamAvailable: ${courseQGE.isExamAvailable})`);
    console.log(`✓ Test Course QGU: ${courseQGU.code} - "${courseQGU.title}" (ExamAvailable: ${courseQGU.isExamAvailable})\n`);

    // -------------------------------------------------------------------------
    // STEP 2: CREATE TEST COHORT (USERS & INSTRUCTOR)
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 2] Creating Test Cohort Users...");
    
    // Instructor
    const instructor = await UserModel.create({
      name: "Dr. Farooq Instructor",
      email: "test_instructor@iipc.test",
      role: "WLS_ADMIN",
      roles: ["instructor", "university_admin"],
      password: "TestPassword123!",
    });

    // Link instructor to test courses
    courseQGE.instructorId = instructor._id;
    courseQGE.instructorName = instructor.name;
    await courseQGE.save();

    courseQGU.instructorId = instructor._id;
    courseQGU.instructorName = instructor.name;
    await courseQGU.save();

    // Student 1: Enrolled in QGE only
    const student1 = await UserModel.create({
      name: "Tariq QGE-Student",
      email: "test_student_qge@iipc.test",
      role: "USER",
      roles: ["university_student"],
      password: "TestPassword123!",
    });

    // Student 2: Enrolled in QGU only
    const student2 = await UserModel.create({
      name: "Zainab QGU-Student",
      email: "test_student_qgu@iipc.test",
      role: "USER",
      roles: ["university_student"],
      password: "TestPassword123!",
    });

    // Student 3: Enrolled in BOTH departments (Dual)
    const student3 = await UserModel.create({
      name: "Bilal Dual-Student",
      email: "test_student_dual@iipc.test",
      role: "USER",
      roles: ["university_student"],
      password: "TestPassword123!",
    });

    // Student 4: Unenrolled / No admission opened
    const student4 = await UserModel.create({
      name: "Sarah Unenrolled-Student",
      email: "test_student_unenrolled@iipc.test",
      role: "USER",
      roles: ["university_student"],
      password: "TestPassword123!",
    });

    // Student 5: Boundary test student (Incomplete mandatory lectures)
    const student5 = await UserModel.create({
      name: "Hamza Incomplete-Student",
      email: "test_student_boundary@iipc.test",
      role: "USER",
      roles: ["university_student"],
      password: "TestPassword123!",
    });

    console.log(`✓ Created 5 test students + 1 instructor.\n`);

    // -------------------------------------------------------------------------
    // STEP 3: PERFORM ENROLLMENTS & TEST MULTI-DEPARTMENT CO-EXISTENCE
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 3] Testing Department Enrollments & Roll Number Generation...");

    // Enroll Student 1 in QGE
    const enroll1 = await UniversityUseCase.enrollStudent({
      studentId: student1._id,
      departmentId: deptQGE._id,
      batchId: batchQGE?._id,
      semesterId: sem1QGE?._id,
    });
    console.log(`✓ Student 1 (Tariq) enrolled in QGE: Roll #${enroll1.rollNumber}`);

    // Enroll Student 2 in QGU
    const enroll2 = await UniversityUseCase.enrollStudent({
      studentId: student2._id,
      departmentId: deptQGU._id,
      batchId: batchQGU?._id,
      semesterId: sem1QGU?._id,
    });
    console.log(`✓ Student 2 (Zainab) enrolled in QGU: Roll #${enroll2.rollNumber}`);

    // Enroll Student 3 in BOTH QGE and QGU
    const enroll3QGE = await UniversityUseCase.enrollStudent({
      studentId: student3._id,
      departmentId: deptQGE._id,
      batchId: batchQGE?._id,
      semesterId: sem1QGE?._id,
    });
    const enroll3QGU = await UniversityUseCase.enrollStudent({
      studentId: student3._id,
      departmentId: deptQGU._id,
      batchId: batchQGU?._id,
      semesterId: sem1QGU?._id,
    });
    console.log(`✓ Student 3 (Bilal) enrolled in QGE (Roll #${enroll3QGE.rollNumber}) AND QGU (Roll #${enroll3QGU.rollNumber})`);

    // Enroll Student 5 in QGE
    const enroll5 = await UniversityUseCase.enrollStudent({
      studentId: student5._id,
      departmentId: deptQGE._id,
      batchId: batchQGE?._id,
      semesterId: sem1QGE?._id,
    });
    console.log(`✓ Student 5 (Hamza) enrolled in QGE: Roll #${enroll5.rollNumber}`);

    // Check Student 4 has NO enrollments
    const enrolls4 = await StudentEnrollmentModel.find({ studentId: student4._id });
    console.log(`✓ Student 4 (Sarah) has ${enrolls4.length} enrollments (Expected: 0).`);

    // Verify multi-department duplicate constraint within same dept
    let dupFailedAsExpected = false;
    try {
      await UniversityUseCase.enrollStudent({
        studentId: student1._id,
        departmentId: deptQGE._id,
      });
    } catch (err) {
      dupFailedAsExpected = true;
      console.log(`✓ Duplicate enrollment in same department properly prevented: "${err.message}"`);
    }
    if (!dupFailedAsExpected) {
      auditLog.derailments.push("Duplicate enrollment in same department was NOT blocked!");
    } else {
      auditLog.passed.push("Duplicate enrollment within same department is strictly guarded.");
    }
    console.log();

    // -------------------------------------------------------------------------
    // STEP 4: MANDATORY VS OPTIONAL VIDEO STUDY & ANTI-CHEAT ENGINE
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 4] Testing Mandatory vs. Optional Video Progress & Anti-Cheat Engine...");
    
    const lecturesQGE = await LectureModel.find({ courseId: courseQGE._id }).sort({ order: 1 });
    const mandatoryLecs = lecturesQGE.filter((l) => l.isMandatory !== false);
    const optionalLecs = lecturesQGE.filter((l) => l.isMandatory === false);

    console.log(`Course QGE-01-002 breakdown:`);
    console.log(`- Total Lectures:     ${lecturesQGE.length}`);
    console.log(`- Mandatory Lectures: ${mandatoryLecs.length}`);
    console.log(`- Optional Lectures:  ${optionalLecs.length}`);

    // --- Student 1 (Tariq): Complete ALL Mandatory lectures, TOUCH ZERO Optional lectures
    console.log("\nSimulating Student 1 (Tariq): Watching ALL 9 mandatory lectures end-to-end (0 optional touched)...");
    for (const mLec of mandatoryLecs) {
      const dur = mLec.durationSeconds || 1800;
      await UniversityUseCase.updateLectureWatchProgress({
        studentId: student1._id,
        courseId: courseQGE._id,
        lectureId: mLec._id,
        watchedSeconds: dur,
        totalDurationSeconds: dur,
        lastPositionSeconds: dur,
        markComplete: true,
      });
    }

    const progress1 = await UniversityUseCase.getStudentCourseProgress(student1._id, courseQGE._id);
    console.log(`Student 1 Progress Summary:`);
    console.log(`- Completed Mandatory: ${progress1.completedMandatory}/${progress1.totalMandatory}`);
    console.log(`- allMandatoryDone:    ${progress1.allMandatoryDone}`);
    console.log(`- Exam Unlocked:       ${progress1.exam.isExamUnlocked}`);

    if (progress1.allMandatoryDone && progress1.exam.isExamUnlocked) {
      auditLog.passed.push("Student 1: Untouched optional videos do NOT block exam or mandatory completion.");
      console.log("✓ PASS: Untouched optional videos do NOT block exam unlock!");
    } else {
      auditLog.failed.push("Student 1: Exam remained locked even though all mandatory lectures were completed.");
      console.log("✗ FAIL: Exam remained locked!");
    }

    // --- Student 5 (Hamza): Incomplete Mandatory lectures (watch 8 of 9 mandatory, watch ALL optional)
    console.log("\nSimulating Student 5 (Hamza): Watches 8 of 9 mandatory lectures + ALL 18 optional lectures...");
    for (let i = 0; i < mandatoryLecs.length - 1; i++) {
      const mLec = mandatoryLecs[i];
      const dur = mLec.durationSeconds || 1800;
      await UniversityUseCase.updateLectureWatchProgress({
        studentId: student5._id,
        courseId: courseQGE._id,
        lectureId: mLec._id,
        watchedSeconds: dur,
        totalDurationSeconds: dur,
        lastPositionSeconds: dur,
        markComplete: true,
      });
    }
    // Leave the 9th mandatory lecture partially watched (e.g. 30 seconds out of 1800 seconds)
    const skippedLec = mandatoryLecs[mandatoryLecs.length - 1];
    await UniversityUseCase.updateLectureWatchProgress({
      studentId: student5._id,
      courseId: courseQGE._id,
      lectureId: skippedLec._id,
      watchedSeconds: 30,
      totalDurationSeconds: skippedLec.durationSeconds || 1800,
      lastPositionSeconds: 30,
      markComplete: false,
    });

    // Hamza watches all 18 optional lectures
    for (const oLec of optionalLecs) {
      const dur = oLec.durationSeconds || 600;
      await UniversityUseCase.updateLectureWatchProgress({
        studentId: student5._id,
        courseId: courseQGE._id,
        lectureId: oLec._id,
        watchedSeconds: dur,
        totalDurationSeconds: dur,
        lastPositionSeconds: dur,
        markComplete: true,
      });
    }

    const progress5 = await UniversityUseCase.getStudentCourseProgress(student5._id, courseQGE._id);
    console.log(`Student 5 Progress Summary:`);
    console.log(`- Completed Mandatory: ${progress5.completedMandatory}/${progress5.totalMandatory}`);
    console.log(`- allMandatoryDone:    ${progress5.allMandatoryDone}`);
    console.log(`- Exam Unlocked:       ${progress5.exam.isExamUnlocked}`);

    if (!progress5.allMandatoryDone && !progress5.exam.isExamUnlocked) {
      auditLog.passed.push("Student 5: Incomplete mandatory lecture successfully keeps exam locked in UI model.");
      console.log("✓ PASS: Incomplete mandatory lecture correctly locks exam in progress evaluation!");
    } else {
      auditLog.failed.push("Student 5: Exam was unlocked despite incomplete mandatory lecture!");
      console.log("✗ FAIL: Exam was unlocked despite incomplete mandatory lecture!");
    }

    // --- Anti-Cheat Bypass Test: What if client sends markComplete: true with insufficient watch time on mandatory video?
    console.log("\nTesting Anti-Cheat Bypass on Mandatory Lecture...");
    const cheatTestProgress = await UniversityUseCase.updateLectureWatchProgress({
      studentId: student5._id,
      courseId: courseQGE._id,
      lectureId: skippedLec._id,
      watchedSeconds: 50, // 50s out of 1800s
      totalDurationSeconds: 1800,
      markComplete: true, // Attempt client spoof
    });

    if (!cheatTestProgress.isCompleted) {
      auditLog.passed.push("Anti-Cheat Engine: Spoofed markComplete=true with insufficient watch time was rejected.");
      console.log("✓ PASS: Anti-cheat rejected spoofed completion attempt on mandatory video!");
    } else {
      auditLog.derailments.push("Anti-Cheat Engine failed to reject spoofed completion!");
      console.log("✗ DERAILMENT: Anti-cheat accepted spoofed completion!");
    }
    console.log();

    // -------------------------------------------------------------------------
    // STEP 5: EXAM ATTEMPTS, PASS/FAIL, MULTIPLE ATTEMPTS, & ELIGIBILITY GATE
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 5] Testing Exam Gating, Multi-Attempt Flow & Grading...");

    // Test Gate: Hamza (Student 5) calling submitExamAttempt when mandatory lecture is NOT completed
    console.log("Testing Exam Submission Gate on Student 5 (Incomplete Mandatory)...");
    let hamzaBlocked = false;
    try {
      await UniversityUseCase.submitExamAttempt({
        studentId: student5._id,
        courseId: courseQGE._id,
        quizId: courseQGE.examQuizId._id,
        score: 90,
        maxScore: 100,
      });
      console.log("⚠️ WARNING: Student 5 was able to submit exam attempt despite incomplete mandatory lectures!");
      auditLog.derailments.push(
        "CRITICAL: Backend submitExamAttempt allowed submission without validating that all mandatory lectures were completed!"
      );
    } catch (err) {
      hamzaBlocked = true;
      console.log(`✓ PASS: Backend blocked exam submission: "${err.message}"`);
      auditLog.passed.push("Backend exam gate blocked student with incomplete mandatory lectures.");
    }

    // Test Gate: Sarah (Student 4 - Unenrolled) calling submitExamAttempt
    console.log("\nTesting Exam Submission Gate on Student 4 (Unenrolled)...");
    let sarahBlocked = false;
    try {
      await UniversityUseCase.submitExamAttempt({
        studentId: student4._id,
        courseId: courseQGE._id,
        quizId: courseQGE.examQuizId._id,
        score: 90,
        maxScore: 100,
      });
      console.log("⚠️ WARNING: Student 4 was able to submit exam attempt without enrollment!");
      auditLog.derailments.push("submitExamAttempt allowed exam submission for an unenrolled user!");
    } catch (err) {
      sarahBlocked = true;
      console.log(`✓ PASS: Backend blocked unenrolled student: "${err.message}"`);
      auditLog.passed.push("Backend exam gate blocked unenrolled student.");
    }

    // --- Student 1 (Tariq): Taking Exam with Multi-Attempt Simulation
    console.log("\nSimulating Student 1 (Tariq) - Attempt 1: FAILING SCORE (40%)...");
    const attempt1 = await UniversityUseCase.submitExamAttempt({
      studentId: student1._id,
      courseId: courseQGE._id,
      quizId: courseQGE.examQuizId._id,
      score: 40,
      maxScore: 100,
      percentage: 40,
      answers: [{ q: 1, a: "wrong" }],
    });
    console.log(`Attempt 1 Result: Score=${attempt1.score}%, Passed=${attempt1.isPassed}, Attempt #${attempt1.attemptNumber}`);

    if (!attempt1.isPassed && attempt1.attemptNumber === 1) {
      auditLog.passed.push("Exam Attempt 1: Correctly graded as FAILED (score < passing threshold).");
      console.log("✓ PASS: Attempt 1 properly recorded as failed.");
    } else {
      auditLog.failed.push("Exam Attempt 1: Failed grading calculation.");
    }

    // Check student progress after failing attempt 1: exam should still be available for re-take!
    const progressAfterAttempt1 = await UniversityUseCase.getStudentCourseProgress(student1._id, courseQGE._id);
    console.log(`After Attempt 1: attemptsCount=${progressAfterAttempt1.exam.attemptsCount}, isExamUnlocked=${progressAfterAttempt1.exam.isExamUnlocked}, hasPassedExam=${progressAfterAttempt1.exam.hasPassedExam}`);

    if (progressAfterAttempt1.exam.attemptsCount === 1 && progressAfterAttempt1.exam.isExamUnlocked) {
      auditLog.passed.push("Exam Re-Attempt: System keeps exam unlocked for 2nd attempt after failing attempt 1.");
      console.log("✓ PASS: System correctly allows re-attempt!");
    } else {
      auditLog.failed.push("Exam Re-Attempt: System did not keep exam unlocked after failed attempt.");
    }

    // --- Student 1 (Tariq) - Attempt 2: PASSING SCORE (85%)
    console.log("\nSimulating Student 1 (Tariq) - Attempt 2: PASSING SCORE (85%)...");
    const attempt2 = await UniversityUseCase.submitExamAttempt({
      studentId: student1._id,
      courseId: courseQGE._id,
      quizId: courseQGE.examQuizId._id,
      score: 85,
      maxScore: 100,
      percentage: 85,
      answers: [{ q: 1, a: "correct" }],
    });
    console.log(`Attempt 2 Result: Score=${attempt2.score}%, Passed=${attempt2.isPassed}, Attempt #${attempt2.attemptNumber}`);

    if (attempt2.isPassed && attempt2.attemptNumber === 2) {
      auditLog.passed.push("Exam Attempt 2: Correctly graded as PASSED (score >= 70%).");
      console.log("✓ PASS: Attempt 2 properly recorded as passed!");
    } else {
      auditLog.failed.push("Exam Attempt 2: Failed grading calculation.");
    }

    const progressAfterAttempt2 = await UniversityUseCase.getStudentCourseProgress(student1._id, courseQGE._id);
    console.log(`After Attempt 2: attemptsCount=${progressAfterAttempt2.exam.attemptsCount}, highestScore=${progressAfterAttempt2.exam.highestScore}%, hasPassedExam=${progressAfterAttempt2.exam.hasPassedExam}`);

    if (progressAfterAttempt2.exam.hasPassedExam && progressAfterAttempt2.exam.highestScore === 85) {
      auditLog.passed.push("Exam State: Course progress correctly reflects passed status and highest score (85%).");
      console.log("✓ PASS: Highest score and passing state reflected accurately!");
    }

    // --- Check Max Attempts Guard
    const maxAllowedAttempts = courseQGE.examMaxAttempts || 3;
    console.log(`\nSimulating attempts up to exhaustion limit (${maxAllowedAttempts} attempts)...`);
    
    // We already did attempt 1 and attempt 2. Fill attempts up to maxAllowedAttempts:
    for (let att = 3; att <= maxAllowedAttempts; att++) {
      await UniversityUseCase.submitExamAttempt({
        studentId: student1._id,
        courseId: courseQGE._id,
        quizId: courseQGE.examQuizId._id,
        score: 80,
        maxScore: 100,
      });
      console.log(`✓ Completed attempt #${att}`);
    }

    let exhaustedBlocked = false;
    try {
      await UniversityUseCase.submitExamAttempt({
        studentId: student1._id,
        courseId: courseQGE._id,
        quizId: courseQGE.examQuizId._id,
        score: 95,
        maxScore: 100,
      }); // Attempt (max + 1) -> should throw
    } catch (err) {
      exhaustedBlocked = true;
      console.log(`✓ PASS: Attempt #${maxAllowedAttempts + 1} blocked after exhausting all ${maxAllowedAttempts} max attempts: "${err.message}"`);
      auditLog.passed.push(`Max Exam Attempts: System strictly enforces max attempt ceiling (${maxAllowedAttempts} attempts).`);
    }
    if (!exhaustedBlocked) {
      auditLog.derailments.push("Max exam attempts ceiling was NOT enforced!");
    }
    console.log();

    // -------------------------------------------------------------------------
    // STEP 6: DUAL-ENROLLED STUDENT (STUDENT 3) IN BOTH DEPARTMENTS
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 6] Testing Dual-Enrolled Student (Bilal) Across Both Departments...");
    
    // Complete mandatory lectures in QGE for Student 3
    for (const mLec of mandatoryLecs) {
      const dur = mLec.durationSeconds || 1800;
      await UniversityUseCase.updateLectureWatchProgress({
        studentId: student3._id,
        courseId: courseQGE._id,
        lectureId: mLec._id,
        watchedSeconds: dur,
        totalDurationSeconds: dur,
        markComplete: true,
      });
    }

    // Take exam in QGE for Student 3
    const dualAttemptQGE = await UniversityUseCase.submitExamAttempt({
      studentId: student3._id,
      courseId: courseQGE._id,
      quizId: courseQGE.examQuizId._id,
      score: 92,
      maxScore: 100,
    });
    console.log(`✓ Dual student QGE exam result: Passed=${dualAttemptQGE.isPassed}, Roll=${dualAttemptQGE.rollNumber}`);

    // Complete mandatory lectures in QGU for Student 3
    const lecturesQGU = await LectureModel.find({ courseId: courseQGU._id }).sort({ order: 1 });
    const mandatoryLecsQGU = lecturesQGU.filter((l) => l.isMandatory !== false);

    for (const mLec of mandatoryLecsQGU) {
      const dur = mLec.durationSeconds || 1800;
      await UniversityUseCase.updateLectureWatchProgress({
        studentId: student3._id,
        courseId: courseQGU._id,
        lectureId: mLec._id,
        watchedSeconds: dur,
        totalDurationSeconds: dur,
        markComplete: true,
      });
    }

    // Take exam in QGU for Student 3
    const dualAttemptQGU = await UniversityUseCase.submitExamAttempt({
      studentId: student3._id,
      courseId: courseQGU._id,
      quizId: courseQGU.examQuizId._id,
      score: 88,
      maxScore: 100,
    });
    console.log(`✓ Dual student QGU exam result: Passed=${dualAttemptQGU.isPassed}, Roll=${dualAttemptQGU.rollNumber}`);

    if (dualAttemptQGE.rollNumber !== dualAttemptQGU.rollNumber) {
      auditLog.passed.push("Dual Enrollment: Exam attempts properly mapped each department's unique roll number.");
      console.log(`✓ PASS: Unique roll numbers cleanly isolated across departments (${dualAttemptQGE.rollNumber} vs ${dualAttemptQGU.rollNumber})`);
    } else {
      auditLog.failed.push("Dual Enrollment: Exam attempt roll numbers were not isolated!");
    }
    console.log();

    // -------------------------------------------------------------------------
    // STEP 7: SEMESTER PROMOTION & CERTIFICATES AWARDING
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 7] Testing Certificate Awarding & Semester Promotion...");

    // Award course certificate to Student 1 for QGE-01-002
    const courseCert = await UniversityUseCase.awardCertificate({
      studentId: student1._id,
      departmentId: deptQGE._id,
      courseId: courseQGE._id,
      type: "COURSE",
      title: `Certificate of Completion - ${courseQGE.title}`,
      grade: "EXCELLENT (A)",
    });
    console.log(`✓ Course Certificate Awarded: #${courseCert.certificateNumber} to ${courseCert.studentName}`);

    // Promote Student 1 to Semester 2
    const promoteResult = await UniversityUseCase.promoteStudent(student1._id, deptQGE._id);
    console.log(`✓ Promotion Result: Status=${promoteResult.status}, NextSem=${promoteResult.nextSemesterNumber}`);

    const updatedEnroll1 = await StudentEnrollmentModel.findById(enroll1._id);
    console.log(`Enrollment state after promotion: Sem=${updatedEnroll1.currentSemesterNumber}, Status=${updatedEnroll1.status}, CompletedSems=[${updatedEnroll1.completedSemesters}]`);

    if (updatedEnroll1.currentSemesterNumber === 2 && updatedEnroll1.completedSemesters.includes(1)) {
      auditLog.passed.push("Promotion Engine: Student successfully transitioned to Semester 2 with completion record.");
      console.log("✓ PASS: Student promoted to Semester 2 with completed semester history!");
    } else {
      auditLog.failed.push("Promotion Engine: Semester advancement failed to update enrollment state properly.");
    }

    // Check certificates issued to Student 1
    const certs1 = await UniversityUseCase.listCertificates({ studentId: student1._id });
    console.log(`✓ Student 1 total awarded certificates: ${certs1.length}`);
    certs1.forEach((c) => console.log(`  - [${c.type}] #${c.certificateNumber} - "${c.title}" (${c.grade})`));

    if (certs1.length >= 2) {
      auditLog.passed.push("Certificate Engine: Both Course Certificate and Semester Completion Certificate issued.");
    }
    console.log();

    // -------------------------------------------------------------------------
    // STEP 8: STUDENT <-> INSTRUCTOR DIRECT 1-ON-1 CHAT
    // -------------------------------------------------------------------------
    console.log(">>> [STEP 8] Testing Student-Instructor 1-on-1 Chat / Discussion...");

    // Student 1 sends message to Instructor
    const msg1 = await UniversityUseCase.sendMessage({
      courseId: courseQGE._id,
      studentId: student1._id,
      instructorId: instructor._id,
      senderId: student1._id,
      senderName: student1.name,
      senderRole: "student",
      message: "Assalam o alaikum Dr. Farooq, I have a question regarding Lecture 3 on Aaliha in the Quran.",
    });
    console.log(`✓ Student sent message [id: ${msg1._id}]: "${msg1.message}"`);

    // Instructor replies
    const msg2 = await UniversityUseCase.sendMessage({
      courseId: courseQGE._id,
      studentId: student1._id,
      instructorId: instructor._id,
      senderId: instructor._id,
      senderName: instructor.name,
      senderRole: "instructor",
      message: "Walaikum assalam Tariq! In Lecture 3, please pay special attention to verse 21:22 where...",
    });
    console.log(`✓ Instructor replied [id: ${msg2._id}]: "${msg2.message}"`);

    // Student follows up
    const msg3 = await UniversityUseCase.sendMessage({
      courseId: courseQGE._id,
      studentId: student1._id,
      instructorId: instructor._id,
      senderId: student1._id,
      senderName: student1.name,
      senderRole: "student",
      message: "JazakAllah khair Dr. Farooq, that clarifies it completely!",
    });
    console.log(`✓ Student followed up [id: ${msg3._id}]: "${msg3.message}"`);

    // Fetch conversation thread
    const conversation = await UniversityUseCase.getMessages(courseQGE._id, student1._id);
    console.log(`✓ Retrieved conversation thread: ${conversation.length} messages.`);

    if (
      conversation.length === 3 &&
      conversation[0].senderRole === "student" &&
      conversation[1].senderRole === "instructor" &&
      conversation[2].senderRole === "student"
    ) {
      auditLog.passed.push("Messaging Engine: Student-Instructor bidirectional discussion works cleanly and chronologically.");
      console.log("✓ PASS: Bidirectional messaging thread verified!");
    } else {
      auditLog.failed.push("Messaging Engine: Conversation thread ordering or count mismatch.");
    }
    console.log();

    // -------------------------------------------------------------------------
    // SUMMARY OF FINDINGS
    // -------------------------------------------------------------------------
    console.log("===============================================================================");
    console.log("                             AUDIT SUMMARY REPORT                              ");
    console.log("===============================================================================");
    console.log(`Passed Checks:  ${auditLog.passed.length}`);
    console.log(`Failed Checks:  ${auditLog.failed.length}`);
    console.log(`Derailments:    ${auditLog.derailments.length}`);
    console.log("\n[PASSED CHECKS]");
    auditLog.passed.forEach((p) => console.log(`✓ ${p}`));

    if (auditLog.failed.length > 0) {
      console.log("\n[FAILED CHECKS]");
      auditLog.failed.forEach((f) => console.log(`✗ ${f}`));
    }

    if (auditLog.derailments.length > 0) {
      console.log("\n[DERAILMENTS / VULNERABILITIES IDENTIFIED]");
      auditLog.derailments.forEach((d) => console.log(`⚠️ ${d}`));
    }

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Unexpected Error During University E2E Test:", err);
    process.exit(1);
  }
}

runUniversityE2ETest();
