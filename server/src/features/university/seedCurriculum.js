import { QuizModel } from "../quizzes/quiz.model.js";
import mongoose from "mongoose";
import {
  UniversityModel,
  DepartmentModel,
  SemesterModel,
  CourseModel,
  LectureModel,
} from "./university.model.js";

export async function syncUniversityCurriculum(force = false) {
  try {
    const deptCount = await DepartmentModel.countDocuments();
    if (deptCount > 0 && !force) {
      console.log("ℹ [Curriculum] Departments already exist. Skipping automatic seed to preserve user-managed departments.");
      return;
    }
    let uni = await UniversityModel.findOne({ isActive: true });
    if (!uni) {
      uni = await UniversityModel.create({
        name: "International Islamic Propagation Center (IIPC) University",
        code: "IIPC-U",
        description:
          "Systematic Quranic, Arabic, and Islamic Studies University offering undergraduate and certificate tracks.",
        foundedYear: 2026,
        address: "Canada",
        contactEmail: "info@iipc.ca",
        isActive: true,
      });
    }

    let dept = await DepartmentModel.findOne({ code: "QA" });
    if (!dept) {
      dept = await DepartmentModel.create({
        universityId: uni._id,
        name: "Quranic Arabic & Translation",
        code: "QA",
        description: "Department of Quranic Language, Grammar, and Recitation Studies",
        totalSemesters: 8,
        headOfDepartment: "Mohammad Shaikh",
        isActive: true,
      });
    }

    let sem1 = await SemesterModel.findOne({ departmentId: dept._id, semesterNumber: 1 });
    if (!sem1) {
      sem1 = await SemesterModel.create({
        universityId: uni._id,
        departmentId: dept._id,
        semesterNumber: 1,
        title: "Semester 1 - Foundation & Fundamentals",
        academicYear: "2026-2027",
        isActive: true,
      });
    }

    // Ensure Urdu Course
    let urduCourse = await CourseModel.findOne({ code: "CCQ-URDU-101" });
    if (!urduCourse) {
      urduCourse = await CourseModel.create({
        universityId: uni._id,
        departmentId: dept._id,
        semesterId: sem1._id,
        title: "Color Coded Quran by Muhammad Shaikh (Urdu Language)",
        code: "CCQ-URDU-101",
        description: "Comprehensive color-coded Quranic Arabic grammar and translation series by Mohammad Shaikh",
        credits: 4,
        isExamAvailable: true,
        examPassingPercentage: 70,
        examMaxAttempts: 3,
        isActive: true,
      });
    }

    // Ensure English Course
    let engCourse = await CourseModel.findOne({ code: "CCQ-ENG-101" });
    if (!engCourse) {
      engCourse = await CourseModel.create({
        universityId: uni._id,
        departmentId: dept._id,
        semesterId: sem1._id,
        title: "Color Coded Quran by Muhammad Shaikh (English Language)",
        code: "CCQ-ENG-101",
        description: "Comprehensive color-coded Quranic Arabic grammar and direct English translation series by Mohammad Shaikh",
        credits: 4,
        isExamAvailable: true,
        examPassingPercentage: 70,
        examMaxAttempts: 3,
        isActive: true,
      });
    }


    // Ensure "Allah and Aaliha Quiz" exists (Image 3)
    let quiz = await QuizModel.findOne({ title: "Allah and Aaliha Quiz" });
    if (!quiz) {
      quiz = await QuizModel.create({
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

    // Update Courses with 75% Passing Grade and 5 Max Attempts (Image 3)
    if (urduCourse) {
      urduCourse.examQuizId = quiz._id;
      urduCourse.examPassingPercentage = 75;
      urduCourse.examMaxAttempts = 5;
      urduCourse.isExamAvailable = true;
      await urduCourse.save();
    }
    if (engCourse) {
      engCourse.examQuizId = quiz._id;
      engCourse.examPassingPercentage = 75;
      engCourse.examMaxAttempts = 5;
      engCourse.isExamAvailable = true;
      await engCourse.save();
    }

    // Check if Urdu lectures already seeded
    const existingLecsCount = await LectureModel.countDocuments({ courseId: urduCourse._id });
    if (existingLecsCount === 0) {
      console.log("Seeding lectures for Color Coded Quran (Urdu)...");
      const defaultVideoUrl = "https://www.youtube.com/watch?v=0h6xT52z58I";

      const lecturesData = [
        // Topic: Introduction by Muhammad Shaikh
        {
          topicName: "Introduction by Muhammad Shaikh",
          title: "Learn Direct Translation in Urdu & English From The Book of God Color Coded by Muhammad Shaikh",
          description: "Overview of direct word-to-word color coded learning methodology",
          order: 1,
          durationSeconds: 11 * 60 + 12,
          isMandatory: true,
          videoUrls: ["https://www.youtube.com/watch?v=0h6xT52z58I"],
        },
        {
          topicName: "Introduction by Muhammad Shaikh",
          title: "Color Coded Quran Basic Grammar Introduction Urdu Language",
          description: "Essential grammatical markers, prefixes, and suffixes in Quranic Arabic",
          order: 2,
          durationSeconds: 44 * 60 + 14,
          isMandatory: true,
          videoUrls: ["https://www.youtube.com/watch?v=0h6xT52z58I"],
        },

        // Topic: Semester 1 - Topic 1 : Aaliha aur Allah
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 1",
          description: "Understanding deities and the Concept of Allah in Quran",
          order: 3,
          durationSeconds: 27 * 60 + 52,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Allah Aur Aalihah Session 01 Urdu Translation",
          description: "Interactive session on verse breakdown for Aaliha aur Allah",
          order: 4,
          durationSeconds: 29 * 60 + 12,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Introduction to Arabic Grammar | Arabic Grammar Series | Ep- 01 | Qari Aqib",
          description: "Foundational grammar introduction",
          order: 5,
          durationSeconds: 16 * 60 + 1,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 2",
          description: "Deeper exploration of false gods vs True Lord",
          order: 6,
          durationSeconds: 13 * 60 + 29,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Allah Aur Aalihah Session 02 Urdu Translation",
          description: "Grammar analysis session 02",
          order: 7,
          durationSeconds: 36 * 60 + 4,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "BASIC TERMS | Istilahaat | Arabic Grammar Series | Ep- 02 | Qari Aqib",
          description: "Basic Quranic linguistic terms",
          order: 8,
          durationSeconds: 17 * 60 + 6,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 3",
          description: "Part 3 of Allah Aur Aalihah lecture series",
          order: 9,
          durationSeconds: 16 * 60 + 40,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Allah Aur Aalihah Session 03 Urdu Translation",
          description: "Session 03 on word conjugation and meaning",
          order: 10,
          durationSeconds: 25 * 60 + 40,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "NOUN & AERAAB | Ism aur Aeraab | Arabic Grammar Series | Ep- 03 | Qari Aqib",
          description: "Arabic nouns and inflections (Aeraab)",
          order: 11,
          durationSeconds: 23 * 60 + 11,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Lecture 1 Allah Aur Aalihah | Muhammad Shaikh | Part 4",
          description: "Part 4 of Allah Aur Aalihah",
          order: 12,
          durationSeconds: 21 * 60 + 30,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "Allah Aur Aalihah Session 04 Urdu Translation",
          description: "Session 04 color coding review",
          order: 13,
          durationSeconds: 33 * 60,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 1: Aaliha aur Allah",
          title: "MUNSARIF ASMA | Aeraab aur Munsarif | Arabic Grammar Series | Ep- 04 | Qari Aqib",
          description: "Fully declinable nouns in Quranic Arabic",
          order: 14,
          durationSeconds: 24 * 60 + 1,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },

        // Topic: Semester 1 - Topic 2 : Iblees / Shaitaan
        {
          topicName: "Semester 1 - Topic 2: Iblees / Shaitaan",
          title: "Lecture 2: Iblees / Shaitaan | Muhammad Shaikh | Part 1",
          description: "Origins and characteristics of Iblees and Shaitaan",
          order: 15,
          durationSeconds: 32 * 60 + 2,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 2: Iblees / Shaitaan",
          title: "Lecture 2: Iblees / Shaitaan Session 01 Colors / Translation",
          description: "Color coded translation session on Iblees verses",
          order: 16,
          durationSeconds: 15 * 60 + 30,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 2: Iblees / Shaitaan",
          title: "Lecture 2: Iblees / Shaitaan | Muhammad Shaikh | Part 2",
          description: "The whispers and deceit mechanisms of Shaitan",
          order: 17,
          durationSeconds: 18 * 60 + 22,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 2: Iblees / Shaitaan",
          title: "Lecture 2: Iblees / Shaitaan Session 02 Colors / Translation",
          description: "Interactive session 02",
          order: 18,
          durationSeconds: 7 * 60 + 31,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },

        // Topic: Semester 1 - Topic 3 : Al-Kitab
        {
          topicName: "Semester 1 - Topic 3: Al-Kitab",
          title: "Lecture 3: Al-Kitab | Muhammad Shaikh | Part 1",
          description: "What is Al-Kitab as described in Quran?",
          order: 19,
          durationSeconds: 28 * 60 + 15,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 3: Al-Kitab",
          title: "Lecture 3: Al-Kitab Session 01 Urdu Translation",
          description: "Direct translation session on Al-Kitab",
          order: 20,
          durationSeconds: 20 * 60 + 45,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },

        // Topic: Semester 1 - Topic 4 : Quran (Matching Image 5 exactly!)
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran | Muhammad Shaikh | Part 1",
          description: "Comprehensive lecture on the nature and revelation of Al-Quran",
          order: 21,
          durationSeconds: 52 * 60 + 11,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran Session 01 Urdu Translation",
          description: "Color coded grammatical breakdown of Quran verses",
          order: 22,
          durationSeconds: 14 * 60 + 30,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Introduction to Arabic Grammar | Arabic Grammar Series",
          description: "Short grammar review",
          order: 23,
          durationSeconds: 1 * 60 + 51,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran | Muhammad Shaikh | Part 2",
          description: "Part 2 of Quran lecture",
          order: 24,
          durationSeconds: 45 * 60 + 36,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran Session 02 Urdu Translation",
          description: "Session 02 translation and analysis",
          order: 25,
          durationSeconds: 21 * 60 + 34,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "BASIC TERMS | Istilahaat | Arabic Grammar Series | Ep- 02",
          description: "Key grammatical terms",
          order: 26,
          durationSeconds: 17 * 60 + 8,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran | Muhammad Shaikh | Part 3",
          description: "Part 3 of the Quran lecture series",
          order: 27,
          durationSeconds: 25 * 60 + 50,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran Session 03 Urdu Translation",
          description: "Session 03 on Quranic vocabulary",
          order: 28,
          durationSeconds: 30 * 60 + 52,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "NOUN & AERAAB | Ism aur Aeraab | Arabic Grammar Series",
          description: "Grammar lesson on nouns and case endings",
          order: 29,
          durationSeconds: 23 * 60 + 10,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran | Muhammad Shaikh | Part 4",
          description: "Part 4 of the Quran series",
          order: 30,
          durationSeconds: 10 * 60 + 14,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "Lecture 4: Quran Session 04 Urdu Translation",
          description: "Session 04 of Quran translation",
          order: 31,
          durationSeconds: 34 * 60 + 1,
          isMandatory: true,
          videoUrls: [defaultVideoUrl],
        },
        {
          topicName: "Semester 1 - Topic 4: Quran",
          title: "MUNSARIF ASMA | Aeraab aur Munsarif | Arabic Grammar Series",
          description: "Arabic grammar series on declensions",
          order: 32,
          durationSeconds: 34 * 60 + 1,
          isMandatory: false,
          videoUrls: [defaultVideoUrl],
        },
      ];

      const docs = lecturesData.map((l) => ({
        ...l,
        courseId: urduCourse._id,
        isActive: true,
      }));
      await LectureModel.insertMany(docs);
      console.log(`✅ Seeded ${docs.length} lectures for Color Coded Quran (Urdu).`);
    }

    return { uni, dept, sem1, urduCourse, engCourse };
  } catch (err) {
    console.error("syncUniversityCurriculum error:", err);
  }
}
