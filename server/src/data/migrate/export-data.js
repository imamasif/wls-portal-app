import mongoose from "mongoose";
import fs from "fs";
// Adjust this path relative to D:\GENERAL\PROJECTS\wls-portal-app\server\src\data\migrate\
import {
  CategoryModel,
  LectureModel,
  AyatModel,
} from "../../features/category-lectures/categoryLectures.model.js";

async function exportData() {
  try {
    await mongoose.connect("mongodb://localhost:27017/wls-portal-db");

    const categories = await CategoryModel.find({}).lean();
    const lectures = await LectureModel.find({}).lean();
    const ayats = await AyatModel.find({}).lean();

    if (!fs.existsSync("./mongo_backup")) {
      fs.mkdirSync("./mongo_backup");
    }

    fs.writeFileSync(
      "./mongo_backup/categories.json",
      JSON.stringify(categories, null, 2),
    );
    fs.writeFileSync(
      "./mongo_backup/lectures.json",
      JSON.stringify(lectures, null, 2),
    );
    fs.writeFileSync(
      "./mongo_backup/ayats.json",
      JSON.stringify(ayats, null, 2),
    );

    console.log(
      "Successfully exported categories, lectures, and ayats to ./mongo_backup/",
    );
    process.exit(0);
  } catch (err) {
    console.error("Export failed:", err);
    process.exit(1);
  }
}

exportData();
