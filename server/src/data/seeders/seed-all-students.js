import mongoose from "mongoose";
import process from "process";
import bcrypt from "bcrypt";
import fs from "fs";
import csv from "csv-parser";

import { UserModel } from "../../features/users/user.model.js";
import { UniversityModel } from "../../features/universities/universities.model.js";
import { BatchModel } from "../../features/batches/batches.model.js";
import { SemesterModel } from "../../features/semesters/semesters.model.js";
import { CourseModel } from "../../features/courses/courses.model.js";
import { EnrollmentModel } from "../../features/enrollments/enrollments.model.js";

import { SocialGroupModel } from "../../features/social-groups/social.model.js";
import { RuleModel } from "../../features/rules/rule.model.js";
import { WlsSessionModel } from "../../features/wls-session/wlsSession.model.js";
import { NotificationModel } from "../../features/notifications/notification.model.js";
import { AssessmentModel } from "../../features/wls-assessments/wlsAssessment.model.js";
import { WlsReportingModel } from "../../features/wls-reporting/wlsReporting.model.js";
import { MenuPermissionModel } from "../../features/menu-permissions/menuPermission.model.js";
import { QuizModel } from "../../features/quizzes/quiz.model.js";
import { QuizSubmissionModel } from "../../features/quiz-submissions/quizSubmission.model.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/wls-portal-db";

// Helper to parse CSV students
const loadStudentsFromCSV = () => {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync("students.csv")) {
      console.warn("⚠️ students.csv not found. Skipping CSV import.");
      return resolve([]);
    }
    fs.createReadStream("students.csv")
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

const seedMasterData = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected.");

    console.log("🌱 Wiping database collections completely...");
    await mongoose.connection.dropDatabase();
    console.log("✅ Database dropped cleanly.");

    // 1. SEED UNIVERSITY HIERARCHY
    console.log("🏛️ Seeding University and Academic Structure...");
    const university = await UniversityModel.create({
      name: "IIPC CANADA Quranic Educational University",
      code: "IIPC-CAN-QEU",
      foundedYear: 2026,
      active: true,
    });

    const batch = await BatchModel.create({
      universityId: university._id,
      admissionYear: 2026,
      departmentCode: "2026-QEU-1B",
      batchName: "1st Batch of 2026 - Quranic Studies",
      currentSequenceNumber: 1,
    });

    // 2. SEED COURSES
    console.log("📚 Seeding Courses...");
    const coursesData = [
      {
        title: "Color Coded Quran by Muhammad Shaikh (Urdu Language)",
        active: true,
      },
      {
        title: "Color Coded Quran by Muhammad Shaikh (English Language)",
        active: true,
      },
    ];
    const createdCourses = await CourseModel.insertMany(coursesData);
    const courseMap = {};
    createdCourses.forEach((c) => {
      courseMap[c.title] = c._id;
    });
    console.log(`✅ Seeded ${createdCourses.length} courses.`);

    // 3. SEED SEMESTER
    console.log("📖 Seeding Semesters...");
    const semester = await SemesterModel.create({
      semesterNumber: 1,
      title: "Semester 1: Core Tajweed & Recitation",
      courses: createdCourses.map((c) => c._id),
      active: true,
    });

    // 4. SEED USERS (Privileged Users + CSV Unique Students)
    const superUserNames = [
      "Syed Imam",
      "Alam Muhammed",
      "Fawad Gilani",
      "Jahanzaib Najam",
    ];
    const wlsAdminNames = [
      "Aazim Kamal",
      "Nasir Khan",
      "Salman Hunter",
      "Mukaram Khan",
    ];

    console.log(
      "👤 Seeding Users with secure password hashing ('DefaultPassword!')...",
    );
    let userDocs = [];

    const privilegedList = [
      ...superUserNames.map((name) => ({
        name,
        role: "SUPER_USER",
        groups: [1, 2],
      })),
      ...wlsAdminNames.map((name) => ({
        name,
        role: "WLS_ADMIN",
        groups: [2, 3],
      })),
    ];

    for (const p of privilegedList) {
      const email = `${p.name.toLowerCase().replace(/\s+/g, "")}@iipccanada.com`;
      userDocs.push({
        name: p.name,
        email,
        password: "DefaultPassword!",
        role: p.role,
        groupNumbers: p.groups,
        isActive: true,
        country: "Canada",
        city: "Toronto",
        phones: [
          { number: "+1 (416) 555-0199", type: "Mobile", isPrimary: true },
        ],
      });
    }

    // Load CSV students and extract unique users by email
    const csvStudents = await loadStudentsFromCSV();
    const uniqueStudentsMap = new Map();

    for (const row of csvStudents) {
      if (row.email && !uniqueStudentsMap.has(row.email)) {
        uniqueStudentsMap.set(row.email, {
          name: row.display_name || "Student",
          email: row.email,
          enrolledCourse: row.enrolled_course,
          courseProgress: row.course_progress || "0%",
          lesson: row.lesson || "0/83",
        });
      }
    }

    const uniqueStudentsList = Array.from(uniqueStudentsMap.values());

    for (const student of uniqueStudentsList) {
      userDocs.push({
        name: student.name,
        email: student.email,
        password: "DefaultPassword!",
        role: "USER",
        groupNumbers: [1, 2],
        isActive: true,
        country: "Canada",
        city: "Toronto",
        phones: [
          { number: "+1 (647) 555-0199", type: "Mobile", isPrimary: true },
        ],
      });
    }

    const createdUsers = [];
    for (const userData of userDocs) {
      const user = new UserModel(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(
      `✅ Successfully seeded and hashed ${createdUsers.length} users.`,
    );

    // 5. SEED STUDENT ENROLLMENTS & ROLL NUMBERS (YYYY-DEPT-ROLL)
    console.log("🎓 Seeding Student Enrollments & Roll Numbers...");
    const enrollmentDocs = [];
    let seq = 10001;

    for (const user of createdUsers) {
      let matchedCourseId = createdCourses[0]._id;
      let progress = "0%";
      let lessonProg = "0/83";

      if (user.role === "USER") {
        const studentData = uniqueStudentsMap.get(user.email);
        if (studentData) {
          matchedCourseId =
            courseMap[studentData.enrolledCourse] || createdCourses[0]._id;
          progress = studentData.courseProgress;
          lessonProg = studentData.lesson;
        }
      }

      const rollNumber = `2026-CE-${seq++}`;

      enrollmentDocs.push({
        userId: user._id,
        universityId: university._id,
        batchId: batch._id,
        rollNumber: rollNumber,
        enrolledCourseId: matchedCourseId,
        assignedSemesterId: semester._id,
        courseProgress: progress,
        lessonProgress: lessonProg,
        status: "ACTIVE",
      });
    }

    await EnrollmentModel.insertMany(enrollmentDocs);
    console.log(
      `✅ Seeded ${enrollmentDocs.length} student enrollment records with unique roll numbers.`,
    );

    // 6. SEED SOCIAL GROUPS & TEAMS
    console.log("💬 Seeding WhatsApp Groups & Microsoft Teams Channels...");
    await SocialGroupModel.create([
      {
        name: "WLS Group 1 - Core Leadership & Announcements",
        type: "WHATSAPP",
        allowedRoles: ["SUPER_USER", "WLS_ADMIN", "USER"],
        members: createdUsers
          .slice(0, 10)
          .map((u) => ({ userId: u._id, role: "MEMBER" })),
      },
      {
        name: "WLS Group 2 - Advanced Mentorship Circle",
        type: "WHATSAPP",
        allowedRoles: ["SUPER_USER", "WLS_ADMIN"],
        members: createdUsers
          .slice(0, 5)
          .map((u) => ({ userId: u._id, role: "ADMIN" })),
      },
      {
        name: "WLS MS Teams - General Faculty & Student Portal",
        type: "MICROSOFT_TEAMS",
        allowedRoles: ["SUPER_USER", "WLS_ADMIN", "USER"],
        members: createdUsers
          .slice(0, 20)
          .map((u) => ({ userId: u._id, role: "MEMBER" })),
      },
    ]);

    // 7. SEED RULES
    console.log("⚖️ Seeding Assessment Rules...");
    const rules = await RuleModel.create([
      {
        key: "presentation",
        criterion: "Presentation Quality & Fluency",
        maxScore: 10,
        isActive: true,
      },
      {
        key: "tajweed",
        criterion: "Tajweed Pronunciation & Rules",
        maxScore: 10,
        isActive: true,
      },
      {
        key: "memorization",
        criterion: "Memorization Accuracy / Hifz",
        maxScore: 10,
        isActive: true,
      },
    ]);

    // 8. SEED WLS SESSIONS
    console.log("📅 Seeding WLS Sessions...");
    const pastSession = await WlsSessionModel.create({
      topicName: "Tafseer & Recitation Module - Week 1 (Surah Al-Mulk)",
      sessionDateTimeToronto: new Date("2026-09-01T18:00:00-04:00"),
      videoDeadline: new Date("2026-08-31T23:59:59-04:00"),
      status: "ACTIVE",
    });

    // 9. SEED ASSESSMENTS & REPORTING
    console.log("📝 Seeding Submissions and Reports...");
    const regularUsers = createdUsers
      .filter((u) => u.role === "USER")
      .slice(0, 15);
    const adminUser =
      createdUsers.find((u) => u.role === "WLS_ADMIN") || createdUsers[0];

    const assessmentDocs = regularUsers.map((user, idx) => ({
      sessionId: pastSession._id,
      userId: user._id,
      videoSubmissionUrl: `https://youtube.com/watch?v=mock_submission_${idx}`,
      submissionDate: new Date("2026-08-30T14:30:00-04:00"),
      scores: [
        {
          ruleId: rules[0]._id,
          score: 8 + (idx % 3),
          feedback: "Good clear voice projection.",
        },
        {
          ruleId: rules[1]._id,
          score: 7 + (idx % 4),
          feedback: "Proper application of Madd rules.",
        },
        {
          ruleId: rules[2]._id,
          score: 9 - (idx % 2),
          feedback: "Excellent retention.",
        },
      ],
      totalScore: 24 + (idx % 3),
      maxPossibleScore: 30,
      gradedBy: adminUser.email,
      gradedAt: new Date("2026-09-02T10:00:00-04:00"),
      adminGeneralFeedback: "Great effort overall.",
    }));

    await AssessmentModel.insertMany(assessmentDocs);

    // 10. SEED QUIZZES
    console.log("❓ Seeding Quizzes...");
    await QuizModel.create({
      title: "Weekly Leadership & Tajweed Mastery Quiz #1",
      description: "Assessment covering fundamental recitation rules.",
      createdBy: adminUser._id,
      isPublished: true,
      questions: [
        {
          questionText:
            "What is the primary objective of applying Qalqalah rules?",
          questionType: "SINGLE_SELECT",
          options: [
            "Echo or bouncing sound on specific letters",
            "Softening nasal sounds",
            "Extending vowel duration",
          ],
          correctAnswers: ["Echo or bouncing sound on specific letters"],
          points: 5,
        },
      ],
    });

    // 11. SEED MENU HIERARCHY
    console.log("🧭 Seeding Unified Multi-Level Menu & Permissions...");
    await MenuPermissionModel.deleteMany({});

    await MenuPermissionModel.create({
      menuKey: "dashboard",
      label: "Dashboard",
      path: "/dashboard",
      order: 1,
      allowedRoles: ["SUPER_USER", "WLS_ADMIN", "USER"],
      scopeRestriction: "ALL",
    });

    console.log(
      "\n✅ Master Seeding Completed Successfully with University Hierarchy & Roll Numbers!",
    );
    console.log("👉 Default Password for all seeded users: DefaultPassword!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Master Seeding Failed:", error);
    process.exit(1);
  }
};

seedMasterData();
