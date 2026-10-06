import mongoose from "mongoose";
import {
  CategoryModel,
  LectureModel,
  AyatModel,
} from "../../features/category-lectures/categoryLectures.model.js"; // Adjust path as needed
import { lecturesData } from "./AYAT_OF_ALL_LECTURES.ts"; // Adjust path as needed

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/wls-portal-db";

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    for (const root of lecturesData) {
      console.log(`Processing source: ${root.source}`);

      for (const catData of root.categories) {
        // 1. Upsert Category
        const categoryDoc = await CategoryModel.findOneAndUpdate(
          { category_id: catData.category_id },
          {
            source: root.source,
            compiler: root.compiler,
            language: root.language,
            category_id: catData.category_id,
            category_name: catData.category_name,
            total_lectures: catData.booklets.length,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        console.log(` -> Category synced: ${categoryDoc.category_name}`);

        for (const lectureData of catData.booklets) {
          // Flatten ayat_references in case there are nested arrays (e.g., grouped ayats)
          const flattenedAyats = lectureData.ayat_references.flat(Infinity);

          // 2. Upsert Lecture
          const lectureDoc = await LectureModel.findOneAndUpdate(
            {
              category_id_ref: categoryDoc._id,
              lecture_id: lectureData.lecture_id,
            },
            {
              category_id_ref: categoryDoc._id,
              lecture_id: lectureData.lecture_id,
              lecture_name: lectureData.lecture_name,
              language: lectureData.language || root.language,
              year_delivered: lectureData.year_delievered || "",
              total_ayats: flattenedAyats.length,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );

          // Optional: clear existing ayats for this lecture before re-inserting to prevent duplicates on re-runs
          await AyatModel.deleteMany({ lecture_id: lectureDoc._id });

          // 3. Insert Ayats
          if (flattenedAyats.length > 0) {
            const ayatDocuments = flattenedAyats.map((ayat) => ({
              lecture_id: lectureDoc._id,
              surah_number: ayat.surah_number,
              surah_name: ayat.surah_name || "",
              ayat_number: ayat.ayat_number,
              arabic_text: ayat.arabic_text || "",
              english_translation: ayat.english_translation || "",
              urdu_translation: ayat.urdu_translation || "",
              hindi_translation: ayat.hindi_translation || "",
              points_notes: ayat.points_notes || "",
              quest_answer: ayat.quest_answer || false,
              question_text: ayat.question_text || "",
              video_url: ayat.video_url || "",
              youtube_url: ayat.youtube_url || "",
              facebook_url: ayat.facebook_url || "",
            }));

            await AyatModel.insertMany(ayatDocuments);
          }
        }
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedDatabase();
