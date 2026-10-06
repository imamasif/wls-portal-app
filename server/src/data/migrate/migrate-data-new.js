import mongoose from "mongoose";
import fs from "fs";
import {
  CategoryModel,
  LectureModel,
  AyatModel,
} from "../../../features/category-lectures/categoryLectures.model.js";

async function runSeed() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/wls-portal-db",
    );
    console.log("Connected to MongoDB for seeding...");

    // Clear existing collections
    await AyatModel.deleteMany({});
    await LectureModel.deleteMany({});
    await CategoryModel.deleteMany({});
    console.log("Cleared old collections.");

    const rawData = fs.readFileSync("./iipc_data.json", "utf-8");
    const data = JSON.parse(rawData);

    for (const catData of data.categories) {
      // 1. Create Category
      const category = await CategoryModel.create({
        source: data.source,
        compiler: data.compiler,
        language: data.language,
        category_id: catData.category_id,
        category_name: catData.category_name,
        total_lectures: catData.lectures.length,
      });

      for (const lecData of catData.lectures) {
        // 2. Create Lecture referencing Category ObjectId
        const lecture = await LectureModel.create({
          category_id_ref: category._id,
          lecture_id: lecData.lecture_id,
          lecture_name: lecData.lecture_name,
          language: lecData.language || data.language,
          year_delivered: lecData.year_delivered,
          total_ayats: lecData.ayats.length,
        });

        // 3. Create Ayats referencing both Category and Lecture ObjectIds
        const ayatDocs = lecData.ayats.map((ayat) => ({
          ...ayat,
          category_id_ref: category._id,
          lecture_id: lecture._id,
        }));

        if (ayatDocs.length > 0) {
          await AyatModel.insertMany(ayatDocs);
        }
      }
    }

    console.log(
      "Successfully seeded all categories, lectures, and ayats end-to-end!",
    );
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

runSeed();
