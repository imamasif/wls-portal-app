import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

export async function populateCurriculumFromWeb(forceUri = null) {
  const uri = forceUri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wls-portal-db";
  console.log("Connecting to MongoDB at:", uri);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  const {
    UniversityModel,
    DepartmentModel,
    SemesterModel,
    CourseModel,
    LectureModel,
    StudentEnrollmentModel,
    StudentLectureProgressModel,
    StudentExamAttemptModel,
  } = await import("../src/features/university/university.model.js");
  const { QuizModel } = await import("../src/features/quizzes/quiz.model.js");

  const scrapedData = JSON.parse(fs.readFileSync(path.join(__dirname, "complete_curriculum.json"), "utf8"));

  // Ensure University
  let uni = await UniversityModel.findOne();
  if (!uni) {
    uni = await UniversityModel.create({
      name: "IIPC - International Islamic Propagation Center Canada University",
      viceChancellor: "Muhammad Shaikh",
      code: "IIPC-U",
      description: "Systematic Quranic, Arabic, and Islamic Studies University offering undergraduate and certificate tracks.",
      foundedYear: 2026,
      address: "Canada",
      contactEmail: "info@iipc.ca",
      isActive: true,
    });
  }

  // Ensure Quizzes exist
  let allahQuiz = await QuizModel.findOne({ title: "Allah and Aaliha Quiz" });
  if (!allahQuiz) {
    allahQuiz = await QuizModel.create({
      title: "Allah and Aaliha Quiz",
      description: "Alfaaz ke rang aur maienay ki shanakht karen.",
      isPublished: true,
      isActive: true,
      createdBy: "super_user",
      questions: [
        {
          questionText: "Quran mein 'Aalihah' ka lafzi mafhoom kya hai?",
          questionType: "SINGLE_SELECT",
          points: 10,
          options: ["Ma'bood / Deities", "Rabb", "Rasool", "Malaika"],
          correctAnswers: ["Ma'bood / Deities"],
        },
        {
          questionText: "Color coded translation mein Noun (Ism) ka aam taur par kaun sa rang makhsoos hai?",
          questionType: "SINGLE_SELECT",
          points: 10,
          options: ["Blue", "Red", "Green", "Black"],
          correctAnswers: ["Blue"],
        },
        {
          questionText: "Surah Al-Baqarah mein Tauheed ka bunyadi pegham kis lafz se wazeh hota hai?",
          questionType: "SINGLE_SELECT",
          points: 10,
          options: ["La Ilaha Illa Allah", "Al-Kitab", "Al-Hikmah", "Al-Furqan"],
          correctAnswers: ["La Ilaha Illa Allah"],
        },
        {
          questionText: "Munsarif Asma ki pehchan kya hai?",
          questionType: "SINGLE_SELECT",
          points: 10,
          options: [
            "Teenon aeraab qabool kartay hain",
            "Sirf do aeraab letay hain",
            "Mabnee rehtay hain",
            "In mein se koi nahi",
          ],
          correctAnswers: ["Teenon aeraab qabool kartay hain"],
        },
      ],
    });
  }

  let ibleesQuiz = await QuizModel.findOne({ title: { $in: ["Iblees / Shaitaan Quiz", "Devil / Satan Quiz"] } });
  if (!ibleesQuiz) {
    ibleesQuiz = await QuizModel.create({
      title: "Iblees / Shaitaan Quiz",
      description: "Iblees / Shaitaan topic concepts and understanding evaluation.",
      isPublished: true,
      isActive: true,
      createdBy: "super_user",
      questions: [
        {
          questionText: "Iblees ne Adam (AS) ko sajda karne se inkaar kis bina par kiya?",
          questionType: "SINGLE_SELECT",
          points: 10,
          options: ["Takabbur aur Barai", "Nafsani khwahish", "Malaika se dushmani", "In mein se koi nahi"],
          correctAnswers: ["Takabbur aur Barai"],
        },
        {
          questionText: "Quran mein Shaitaan ke waswasay se bachnay ke liye kis cheez ki talqeen ki gayi hai?",
          questionType: "SINGLE_SELECT",
          points: 10,
          options: ["Iste'aza (A'oodhu billah)", "Safar", "Sukoot", "Khamoshi"],
          correctAnswers: ["Iste'aza (A'oodhu billah)"],
        },
      ],
    });
  }

  console.log("Cleaning up all old university collections (departments, semesters, courses, lectures)...");
  await LectureModel.deleteMany({});
  await CourseModel.deleteMany({});
  await SemesterModel.deleteMany({});
  await DepartmentModel.deleteMany({});
  await StudentLectureProgressModel.deleteMany({});
  await StudentExamAttemptModel.deleteMany({});
  await StudentEnrollmentModel.deleteMany({});

  console.log("Cleared old records. Now seeding fresh curriculum from scraped web portal...");

  // User Requirements:
  // 1st department: Quranic Grammer - English (4 semesters, 5 courses in Semester 1, Sister Isha)
  // 2nd department: Quranic Grammer - Urdu (4 semesters, 5 courses in Semester 1, Br Aazim Kamal)
  const deptsConfig = [
    {
      code: "QGE",
      name: "Quranic Grammer - English",
      headOfDepartment: "Sister Isha",
      description: "Department of Quranic Language, Grammar, and through color code understand the Quranic Arabic (English Language)",
      scrapedKey: "QGE",
    },
    {
      code: "QGU",
      name: "Quranic Grammer - Urdu",
      headOfDepartment: "Br Aazim Kamal",
      description: "Department of Quranic Language, Grammar, and through color code understand the Quranic Arabic (Urdu Language)",
      scrapedKey: "QGU",
    },
  ];

  for (const dConf of deptsConfig) {
    console.log(`\nCreating Department: ${dConf.name} (${dConf.code})...`);
    const dept = await DepartmentModel.create({
      universityId: uni._id,
      name: dConf.name,
      code: dConf.code,
      description: dConf.description,
      headOfDepartment: dConf.headOfDepartment,
      totalSemesters: 4,
      isActive: true,
    });

    // Create 4 Semesters
    const semesterDocs = [];
    for (let s = 1; s <= 4; s++) {
      semesterDocs.push({
        universityId: uni._id,
        departmentId: dept._id,
        semesterNumber: s,
        title: `Semester ${s}${s === 1 ? " - Foundation & Core Curriculum" : ""}`,
        academicYear: "2026-2027",
        isActive: true,
      });
    }
    const createdSemesters = await SemesterModel.insertMany(semesterDocs);
    const sem1 = createdSemesters.find((s) => s.semesterNumber === 1);

    // In Semester 1, add the 5 courses
    const scrapedDept = scrapedData[dConf.scrapedKey];
    if (!scrapedDept) {
      console.error(`No scraped data for key ${dConf.scrapedKey}`);
      continue;
    }

    const courseCodes = [
      `${dConf.code}-01-001`,
      `${dConf.code}-01-002`,
      `${dConf.code}-01-003`,
      `${dConf.code}-01-004`,
      `${dConf.code}-01-005`,
    ];

    for (let cIdx = 0; cIdx < scrapedDept.courses.length; cIdx++) {
      const cSec = scrapedDept.courses[cIdx];
      const courseCode = courseCodes[cIdx] || `${dConf.code}-01-00${cIdx + 1}`;
      
      let quizId = null;
      let hasExam = false;
      if (cSec.courseTitle.includes("Allah")) {
        quizId = allahQuiz._id;
        hasExam = true;
      } else if (cSec.courseTitle.includes("Iblees") || cSec.courseTitle.includes("Devil")) {
        quizId = ibleesQuiz._id;
        hasExam = true;
      }

      console.log(`  Adding Course ${cIdx + 1}: [${courseCode}] ${cSec.courseTitle} (Instructor: ${dConf.headOfDepartment})...`);
      const course = await CourseModel.create({
        universityId: uni._id,
        departmentId: dept._id,
        semesterId: sem1._id,
        title: cSec.courseTitle,
        code: courseCode,
        description: `${cSec.courseTitle} - Semester 1 comprehensive lecture series by Muhammad Shaikh`,
        credits: 3,
        instructorName: dConf.headOfDepartment,
        isExamAvailable: hasExam,
        examQuizId: quizId,
        examPassingPercentage: 75,
        examMaxAttempts: 5,
        isActive: true,
      });

      // Insert all lectures for this course in exact sequence
      const lectureDocs = cSec.lessons.map((lesson, idx) => ({
        courseId: course._id,
        topicName: cSec.courseTitle,
        title: lesson.title,
        description: `Lecture video session for ${lesson.title}`,
        order: idx + 1,
        videoUrls: lesson.videoUrl ? [lesson.videoUrl] : [],
        isMandatory: true,
        durationSeconds: 1800,
        isActive: true,
      }));

      if (lectureDocs.length > 0) {
        await LectureModel.insertMany(lectureDocs);
        console.log(`    -> Inserted ${lectureDocs.length} sequential lectures (01 to ${String(lectureDocs.length).padStart(2, "0")})`);
      }
    }
  }

  console.log("\n=======================================================");
  console.log("VERIFYING DATABASE CONTENT:");
  const finalDepts = await DepartmentModel.find();
  const finalSems = await SemesterModel.find();
  const finalCourses = await CourseModel.find();
  const finalLectures = await LectureModel.find();
  console.log(`Total Departments: ${finalDepts.length}`);
  console.log(`Total Semesters: ${finalSems.length}`);
  console.log(`Total Courses: ${finalCourses.length}`);
  console.log(`Total Lectures: ${finalLectures.length}`);

  for (const d of finalDepts) {
    const sems = finalSems.filter(s => s.departmentId.toString() === d._id.toString());
    const crs = finalCourses.filter(c => c.departmentId.toString() === d._id.toString());
    console.log(`\nDept [${d.code}] ${d.name} (HOD: ${d.headOfDepartment}):`);
    console.log(`  Semesters: ${sems.length}`);
    console.log(`  Courses in Sem 1: ${crs.length}`);
    for (const c of crs) {
      const lecs = finalLectures.filter(l => l.courseId.toString() === c._id.toString());
      console.log(`    - [${c.code}] ${c.title} (${lecs.length} lectures, Exam: ${c.examQuizId ? "YES" : "NO"})`);
    }
  }

  return {
    departments: finalDepts.length,
    semesters: finalSems.length,
    courses: finalCourses.length,
    lectures: finalLectures.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  populateCurriculumFromWeb()
    .then(async () => {
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
