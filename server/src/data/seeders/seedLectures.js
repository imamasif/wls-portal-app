import mongoose from "mongoose";
import dotenv from "dotenv";
import { lecturesData } from "./AYAT_OF_ALL_LECTURES_03.ts";
import { CategoryWiseLecturesModel } from "../../features/category-lectures/categoryLectures.model.js";

dotenv.config();

async function seedDatabase() {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wls-portal-db";
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB for seeding at: ${mongoUri}`);

    // Clear existing records
    await CategoryWiseLecturesModel.deleteMany({});
    console.log("Cleared existing records from database.");

    // Extract the categories array from the root object wrapper
    const categoriesArray = lecturesData.categories || lecturesData;

    console.log(`Processing ${categoriesArray.length} categories...`);

    // Insert the data properly
    await CategoryWiseLecturesModel.insertMany(categoriesArray);
    console.log("Database seeded successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
