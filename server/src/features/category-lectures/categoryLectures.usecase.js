import mongoose from "mongoose";
import Ajv from "ajv";
import { categoryValidationSchema } from "./categoryLectures.schema.js";
import {
  CategoryModel,
  LectureModel,
  AyatModel,
} from "./categoryLectures.model.js";

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(categoryValidationSchema);

export class CategoryLecturesUsecase {
  static async insertCategoryData(payload) {
    const isValid = validate(payload);
    if (!isValid) {
      throw new Error(`Validation failed: ${JSON.stringify(validate.errors)}`);
    }

    try {
      // 1. Create and save the Category (Master)
      const categoryData = {
        source: payload.source,
        compiler: payload.compiler,
        language: payload.language || "eng",
        category_id: payload.category_id,
        category_name: payload.category_name,
        total_lectures: payload.lectures ? payload.lectures.length : 0,
      };

      const savedCategory = await CategoryModel.create(categoryData);

      if (payload.lectures && payload.lectures.length > 0) {
        for (const l of payload.lectures) {
          // 2. Create and save the Lecture (Child of Category)
          const lectureData = {
            category_id_ref: savedCategory._id,
            lecture_id: l.lecture_id,
            lecture_name: l.lecture_name,
            language: l.language || "eng",
            year_delivered: l.year_delivered || "",
            total_ayats: l.ayat_references ? l.ayat_references.length : 0,
          };

          const savedLecture = await LectureModel.create(lectureData);

          // 3. Create and save Ayats (Child of Lecture)
          if (l.ayat_references && l.ayat_references.length > 0) {
            const ayatDocuments = l.ayat_references.map((a) => ({
              ...a,
              lecture_id: savedLecture._id,
            }));
            await AyatModel.insertMany(ayatDocuments);
          }
        }
      }

      return await this.getCategoryWithChildren(savedCategory._id);
    } catch (error) {
      throw new Error(
        `Error saving normalized category structure: ${error.message}`,
      );
    }
  }

  static async getCategoryWithChildren(categoryId) {
    const catStr = String(categoryId);
    const orCategory = [{ _id: catStr }, { _id: categoryId }];
    if (mongoose.Types.ObjectId.isValid(catStr)) {
      try {
        orCategory.push({ _id: new mongoose.Types.ObjectId(catStr) });
      } catch (_) {}
    }
    const category = await CategoryModel.findOne({ $or: orCategory }).lean();
    if (!category) return null;

    const catIdStr = String(category._id);
    const orLectures = [{ category_id_ref: catIdStr }, { category_id_ref: category._id }];
    if (mongoose.Types.ObjectId.isValid(catIdStr)) {
      try {
        orLectures.push({ category_id_ref: new mongoose.Types.ObjectId(catIdStr) });
      } catch (_) {}
    }

    const lectures = await LectureModel.find({ $or: orLectures }).lean();

    const lecturesWithAyats = await Promise.all(
      lectures.map(async (lecture) => {
        const lecStr = String(lecture._id);
        const orAyats = [{ lecture_id: lecStr }, { lecture_id: lecture._id }];
        if (mongoose.Types.ObjectId.isValid(lecStr)) {
          try {
            orAyats.push({ lecture_id: new mongoose.Types.ObjectId(lecStr) });
          } catch (_) {}
        }
        const ayats = await AyatModel.find({ $or: orAyats }).lean();
        return {
          ...lecture,
          ayat_references: ayats,
        };
      }),
    );

    return {
      ...category,
      lectures: lecturesWithAyats,
    };
  }

  static async getAllCategoriesData() {
    try {
      const categories = await CategoryModel.find().lean();
      return await Promise.all(
        categories.map((cat) => this.getCategoryWithChildren(cat._id)),
      );
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }

  static async getMetaCategories() {
    try {
      const categories = await CategoryModel.find().lean();

      return await Promise.all(
        categories.map(async (cat) => {
          const catStr = String(cat._id);
          const orLectures = [{ category_id_ref: catStr }, { category_id_ref: cat._id }];
          if (mongoose.Types.ObjectId.isValid(catStr)) {
            try {
              orLectures.push({ category_id_ref: new mongoose.Types.ObjectId(catStr) });
            } catch (_) {}
          }

          const lectures = await LectureModel.find({
            $or: orLectures,
          }).lean();

          const lecturesWithAyats = await Promise.all(
            lectures.map(async (lecture) => {
              const lecStr = String(lecture._id);
              const orAyats = [{ lecture_id: lecStr }, { lecture_id: lecture._id }];
              if (mongoose.Types.ObjectId.isValid(lecStr)) {
                try {
                  orAyats.push({ lecture_id: new mongoose.Types.ObjectId(lecStr) });
                } catch (_) {}
              }

              const ayats = await AyatModel.find({
                $or: orAyats,
              }).lean();

              return {
                _id: String(lecture._id),
                id: String(lecture._id),
                category_id: cat.category_id,
                category_id_ref: String(cat._id),
                lecture_id: lecture.lecture_id,
                lecture_name: lecture.lecture_name,
                year_delivered: lecture.year_delivered,
                ayat_count: ayats.length,
                total_ayats: ayats.length,
                ayat_references: ayats,
              };
            }),
          );

          return {
            _id: String(cat._id),
            id: String(cat._id),
            category_id: cat.category_id,
            category_name: cat.category_name,
            language: cat.language || "eng",
            total_lectures: lectures.length,
            lectures: lecturesWithAyats,
          };
        }),
      );
    } catch (error) {
      throw new Error(`Error fetching meta categories: ${error.message}`);
    }
  }
}
