// server/src/data/seeders/seedCoursesAndProgress.js
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";

import { CourseModel } from "../../features/courses/courses.model.js";
import { UserModel } from "../../features/users/user.model.js";
import { EnrollmentModel } from "../../features/enrollments/enrollments.model.js";
import { UniversityModel } from "../../features/universities/universities.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/wls-portal-db";

const parseDurationToMinutes = (durStr) => {
  if (!durStr) return 0;
  const parts = durStr.trim().split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
  } else if (parts.length === 2) {
    return parts[0] + Math.round(parts[1] / 60);
  }
  return 5;
};

async function seedCoursesAndProgress() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected.");

    let university = await UniversityModel.findOne({});
    if (!university) {
      console.log(
        "🏛️ No university found. Creating default university structure...",
      );
      university = await UniversityModel.create({
        name: "IIPC CANADA Quranic Educational University",
        code: "IIPC-CAN-QEU",
        foundedYear: 2026,
        active: true,
      });
    }

    const urduCourseData = {
      title: "Learn Direct Translation in Urdu From The Book of God",
      code: "QUR-UR-101",
      universityId: university._id,
      semester: "Semester 1",
      active: true,
      topics: [
        {
          topicName: "Introduction by Muhammad Shaikh",
          lectures: [
            {
              lectureName:
                "Learn Direct Translation in Urdu & English From The Book of God Color Coded by Muhammad Shaikh",
              durationMinutes: parseDurationToMinutes("11:12"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Color Coded Quran Basic Grammar Introduction Urdu Language",
              durationMinutes: parseDurationToMinutes("44:14"),
              isRequired: true,
              isActive: true,
            },
          ],
        },
        {
          topicName: "Semester 1 - Topic 1 : Aaliha aur Allah",
          lectures: [
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 1",
              durationMinutes: parseDurationToMinutes("27:52"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 01 Urdu Translation",
              durationMinutes: parseDurationToMinutes("29:12"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Introduction to Arabic Grammar | Arabic Grammar Series | Ep- 01 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("16:01"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 2",
              durationMinutes: parseDurationToMinutes("13:29"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 02 Urdu Translation",
              durationMinutes: parseDurationToMinutes("36:04"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "BASIC TERMS | Istilahaat | Arabic Grammar Series | Ep- 02 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("17:06"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 3",
              durationMinutes: parseDurationToMinutes("16:40"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 03 Urdu Translation",
              durationMinutes: parseDurationToMinutes("25:40"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "NOUN & AERAAB | Ism aur Aeraab | Arabic Grammar Series | Ep- 03 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("23:11"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 4",
              durationMinutes: parseDurationToMinutes("21:30"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 04 Urdu Translation",
              durationMinutes: parseDurationToMinutes("33:00"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "MUNSARIF ASMA | Aeraab aur Munsarif | Arabic Grammar Series | Ep- 04 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("24:01"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 5",
              durationMinutes: parseDurationToMinutes("05:39"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 05 Urdu Translation",
              durationMinutes: parseDurationToMinutes("42:50"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "GAIR MUNSARIF ASMA | Aeraab aur Gair Munsarif | Arabic Grammar Series | Ep- 05 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("24:46"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 6",
              durationMinutes: parseDurationToMinutes("11:44"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 06 Urdu Translation",
              durationMinutes: parseDurationToMinutes("44:43"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "MABNEE ASMA | Muarab & Mabnee | Arabic Grammar Series | Ep- 06 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("13:43"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 7",
              durationMinutes: parseDurationToMinutes("24:02"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 07 Urdu Translation",
              durationMinutes: parseDurationToMinutes("42:47"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "JINS | Muzakar & Mu`anas | Arabic Grammar Series | Ep- 07 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("26:09"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 8",
              durationMinutes: parseDurationToMinutes("20:19"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 08 Urdu Translation",
              durationMinutes: parseDurationToMinutes("40:19"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "ADDAD | Singular & Plural | Arabic Grammar Series | Ep- 08 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("16:24"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 9",
              durationMinutes: parseDurationToMinutes("20:16"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Allah Aur Aalihah Session 09 Urdu Translation",
              durationMinutes: parseDurationToMinutes("40:01"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "JAMA SALIM | Addad | Muzakar & Mu`anas | Plural | Arabic Grammar Series | Ep- 09 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("21:57"),
              isRequired: true,
              isActive: true,
            },
          ],
        },
        {
          topicName: "Semester 1 - Topic 2 : Iblees / Shaitaan",
          lectures: [
            {
              lectureName:
                "Lecture 2: Iblees / Shaitaan | Muhammad Shaikh | Part 1",
              durationMinutes: parseDurationToMinutes("32:02"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 2: Iblees / Shaitaan Session 01 Colors / Translation",
              durationMinutes: parseDurationToMinutes("15:30"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Introduction to Arabic Grammar | Arabic Grammar Series | Ep- 01 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("16:01"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 2: Iblees / Shaitaan | Muhammad Shaikh | Part 2",
              durationMinutes: parseDurationToMinutes("18:22"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 2: Iblees / Shaitaan Session 02 Colors / Translation",
              durationMinutes: parseDurationToMinutes("07:31"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "BASIC TERMS | Istilahaat | Arabic Grammar Series | Ep- 02 | Qari Aqib",
              durationMinutes: parseDurationToMinutes("17:06"),
              isRequired: true,
              isActive: true,
            },
          ],
        },
      ],
    };

    const englishCourseData = {
      title: "Learn Direct Translation in English From The Book of God",
      code: "QUR-EN-101",
      universityId: university._id,
      semester: "Semester 1",
      active: true,
      topics: [
        {
          topicName: "Introduction by Muhammad Shaikh",
          lectures: [
            {
              lectureName:
                "Learn Direct Translation in Urdu & English From The Book of God Color Coded by Muhammad Shaikh",
              durationMinutes: parseDurationToMinutes("11:01"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Color Coded Quran Basic Grammar Introduction English Language",
              durationMinutes: parseDurationToMinutes("56:10"),
              isRequired: true,
              isActive: true,
            },
          ],
        },
        {
          topicName: "Semester 1 - Topic 1 : gods and Allah",
          lectures: [
            {
              lectureName: "Lecture 1: gods & Allah | Muhammad Shaikh | Part 1",
              durationMinutes: parseDurationToMinutes("31:42"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1: gods & Allah Session 01 Colors / Translation",
              durationMinutes: parseDurationToMinutes("29:56"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Quranic Grammar MADE EASY – Lesson 1 | Arabic101",
              durationMinutes: parseDurationToMinutes("15:15"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName: "Lecture 1: gods & Allah | Muhammad Shaikh | Part 2",
              durationMinutes: parseDurationToMinutes("19:22"),
              isRequired: true,
              isActive: true,
            },
            {
              lectureName:
                "Lecture 1: gods & Allah Session 02 Colors / Translation",
              durationMinutes: parseDurationToMinutes("32:13"),
              isRequired: true,
              isActive: true,
            },
          ],
        },
      ],
    };

    console.log("📚 Inserting Urdu and English Courses...");
    await CourseModel.deleteMany({
      code: { $in: ["QUR-UR-101", "QUR-EN-101"] },
    });

    const urduCourse = await CourseModel.create(urduCourseData);
    const englishCourse = await CourseModel.create(englishCourseData);
    console.log(
      "✅ Seeded Courses:",
      urduCourse.title,
      "and",
      englishCourse.title,
    );

    const students = await UserModel.find({});
    console.log(
      `👤 Found ${students.length} students to generate enrollment records for.`,
    );

    // Completely clear all student enrollments to avoid duplicate key conflicts
    await EnrollmentModel.deleteMany({});
    console.log("🧹 Cleared old enrollment records.");

    const enrollmentDocs = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentIdStr = student._id.toString();

      // Generate unique roll numbers by combining course code identifier and unique student id slice
      enrollmentDocs.push({
        userId: student._id,
        universityId: university._id,
        enrolledCourseId: urduCourse._id,
        assignedSemesterId: university._id,
        batchId: university._id,
        rollNumber: `UR-${1000 + i}-${studentIdStr.substring(14)}`,
        courseProgress: "0%",
        lessonProgress:
          "0/" +
          urduCourse.topics.reduce((acc, t) => acc + t.lectures.length, 0),
        status: "ACTIVE",
      });

      enrollmentDocs.push({
        userId: student._id,
        universityId: university._id,
        enrolledCourseId: englishCourse._id,
        assignedSemesterId: university._id,
        batchId: university._id,
        rollNumber: `EN-${1000 + i}-${studentIdStr.substring(14)}`,
        courseProgress: "0%",
        lessonProgress:
          "0/" +
          englishCourse.topics.reduce((acc, t) => acc + t.lectures.length, 0),
        status: "ACTIVE",
      });
    }

    await EnrollmentModel.insertMany(enrollmentDocs);
    console.log("✅ Successfully seeded student course enrollments!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Course & Enrollment Seeding Failed:", err);
    process.exit(1);
  }
}

seedCoursesAndProgress();
