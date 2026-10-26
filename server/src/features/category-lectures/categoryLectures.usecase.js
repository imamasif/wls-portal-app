import mongoose from "mongoose";
import Ajv from "ajv";
import { categoryValidationSchema } from "./categoryLectures.schema.js";
import {
  CategoryModel,
  LectureModel,
  AyatModel,
} from "./categoryLectures.model.js";
import { normalizeAyatVideos } from "../ayats/ayats.res.js";
import { normalizePdfUrls } from "./categoryLectures.mapper.js";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
const validate = ajv.compile(categoryValidationSchema);

export class CategoryLecturesUsecase {
  static async insertCategoryData(payload) {
    const isValid = validate(payload);
    if (!isValid) {
      throw new Error(`Validation failed: ${JSON.stringify(validate.errors)}`);
    }

    try {
      // 1. Create and save the Category (Master)
      const rawCategoryIcons = Array.isArray(payload.icon_url)
        ? payload.icon_url.filter(Boolean)
        : typeof payload.icon_url === "string" && payload.icon_url.trim()
        ? [payload.icon_url.trim()]
        : [];

      const categoryData = {
        source: payload.source,
        compiler: payload.compiler,
        language: payload.language || "eng",
        category_id: payload.category_id,
        category_name: payload.category_name,
        icon_url: rawCategoryIcons,
        total_lectures: payload.lectures ? payload.lectures.length : 0,
      };

      const savedCategory = await CategoryModel.create(categoryData);

      if (payload.lectures && payload.lectures.length > 0) {
        for (const l of payload.lectures) {
          const rawVideoUrls = Array.isArray(l.video_urls)
            ? l.video_urls
            : Array.isArray(l.videoUrls)
            ? l.videoUrls
            : l.video_url
            ? [l.video_url]
            : [];

          const rawLectureNames = Array.isArray(l.lecture_name)
            ? l.lecture_name
            : typeof l.lecture_name === "string" && l.lecture_name.trim()
            ? [l.lecture_name.trim()]
            : [];

          const rawPdfList = normalizePdfUrls(l);

          const rawLectureIcons = Array.isArray(l.icon_url)
            ? l.icon_url.filter(Boolean)
            : typeof l.icon_url === "string" && l.icon_url.trim()
            ? [l.icon_url.trim()]
            : [];

          const lectureData = {
            category_id_ref: savedCategory._id,
            lecture_id: l.lecture_id,
            lecture_name: rawLectureNames,
            language: l.language || "eng",
            year_delivered: l.year_delivered || "",
            season: l.season || "",
            episode: l.episode || "",
            video_url: l.video_url || l.videoUrl || (rawVideoUrls[0] || ""),
            video_urls: rawVideoUrls,
            youtube_urls: l.youtube_urls || [],
            facebook_urls: l.facebook_urls || [],
            full_lecture_video_url: l.full_lecture_video_url || "",
            seasons: l.seasons || [],
            episodes: l.episodes || l.episodesList || [],
            pdf_url: rawPdfList,
            icon_url: rawLectureIcons,
            total_ayats: l.ayat_references ? l.ayat_references.length : 0,
          };

          const savedLecture = await LectureModel.create(lectureData);

          // 3. Create and save Ayats (Child of Lecture)
          if (l.ayat_references && l.ayat_references.length > 0) {
            const ayatDocuments = l.ayat_references.map((a) => {
              const norm = normalizeAyatVideos(a);
              return {
                ...a,
                ...norm,
                lecture_id: savedLecture._id,
              };
            });
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
        const enrichedAyats = ayats.map((a) => {
          const norm = normalizeAyatVideos(a);
          return {
            ...a,
            ...norm,
          };
        });
        const rawVideoUrls = Array.isArray(lecture.video_urls)
          ? lecture.video_urls
          : Array.isArray(lecture.videoUrls)
          ? lecture.videoUrls
          : lecture.video_url
          ? [lecture.video_url]
          : [];

        const rawPdfList = normalizePdfUrls(lecture);
        const primaryPdf = rawPdfList[0] || { title: "", url: "" };

        const rawLectureIcons = Array.isArray(lecture.icon_url)
          ? lecture.icon_url.filter(Boolean)
          : typeof lecture.icon_url === "string" && lecture.icon_url.trim()
          ? [lecture.icon_url.trim()]
          : [];

        return {
          ...lecture,
          season: lecture.season || "",
          episode: lecture.episode || "",
          video_url: lecture.video_url || lecture.videoUrl || (rawVideoUrls[0] || ""),
          video_urls: rawVideoUrls,
          youtube_urls: lecture.youtube_urls || [],
          facebook_urls: lecture.facebook_urls || [],
          full_lecture_video_url: lecture.full_lecture_video_url || "",
          seasons: lecture.seasons || [],
          episodes: lecture.episodes || lecture.episodesList || [],
          pdf_url: rawPdfList,
          pdf_link: primaryPdf.url,
          pdf_booklet_urls: rawPdfList.map((p) => p.url),
          pdf_title: primaryPdf.title,
          icon_url: rawLectureIcons,
          ayat_references: enrichedAyats,
        };
      }),
    );

    const rawCategoryIcons = Array.isArray(category.icon_url)
      ? category.icon_url.filter(Boolean)
      : typeof category.icon_url === "string" && category.icon_url.trim()
      ? [category.icon_url.trim()]
      : [];

    return {
      ...category,
      icon_url: rawCategoryIcons,
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

              const enrichedAyats = ayats.map((a) => {
                const norm = normalizeAyatVideos(a);
                return {
                  ...a,
                  ...norm,
                };
              });

              const rawVideoUrls = Array.isArray(lecture.video_urls)
                ? lecture.video_urls
                : Array.isArray(lecture.videoUrls)
                ? lecture.videoUrls
                : lecture.video_url
                ? [lecture.video_url]
                : [];

              const rawPdfList = normalizePdfUrls(lecture);
              const primaryPdf = rawPdfList[0] || { title: "", url: "" };

              const rawLectureIcons = Array.isArray(lecture.icon_url)
                ? lecture.icon_url.filter(Boolean)
                : typeof lecture.icon_url === "string" && lecture.icon_url.trim()
                ? [lecture.icon_url.trim()]
                : [];

              return {
                _id: String(lecture._id),
                id: String(lecture._id),
                category_id: cat.category_id,
                category_id_ref: String(cat._id),
                lecture_id: lecture.lecture_id,
                lecture_name: lecture.lecture_name,
                language: lecture.language || cat.language || "eng",
                year_delivered: lecture.year_delivered || "",
                season: lecture.season || "",
                episode: lecture.episode || "",
                video_url: lecture.video_url || lecture.videoUrl || (rawVideoUrls[0] || ""),
                video_urls: rawVideoUrls,
                youtube_urls: lecture.youtube_urls || [],
                facebook_urls: lecture.facebook_urls || [],
                full_lecture_video_url: lecture.full_lecture_video_url || "",
                seasons: lecture.seasons || [],
                episodes: lecture.episodes || lecture.episodesList || [],
                pdf_url: rawPdfList,
                pdf_link: primaryPdf.url,
                pdf_booklet_urls: rawPdfList.map((p) => p.url),
                pdf_title: primaryPdf.title,
                icon_url: rawLectureIcons,
                ayat_count: enrichedAyats.length,
                total_ayats: enrichedAyats.length,
                ayat_references: enrichedAyats,
              };
            }),
          );

          const rawCatIcons = Array.isArray(cat.icon_url)
            ? cat.icon_url.filter(Boolean)
            : typeof cat.icon_url === "string" && cat.icon_url.trim()
            ? [cat.icon_url.trim()]
            : [];

          return {
            _id: String(cat._id),
            id: String(cat._id),
            category_id: cat.category_id,
            category_name: cat.category_name,
            language: cat.language || "eng",
            icon_url: rawCatIcons,
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
