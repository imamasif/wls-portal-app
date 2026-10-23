// server/src/features/ayats/ayats.usecase.js
import mongoose from "mongoose";
import Ajv from "ajv";
import { createAyatSchema, updateAyatSchema } from "./ayats.schema.js";
import { CreateAyatReq, UpdateAyatReq } from "./ayats.req.js";
import { AyatModel, LectureModel, CategoryModel } from "./ayats.model.js";
import { AyatMapper } from "./ayats.mapper.js";
import { normalizeAyatVideos } from "./ayats.res.js";

const ajv = new Ajv({ allErrors: true, coerceTypes: true, allowUnionTypes: true });
const validateCreate = ajv.compile(createAyatSchema);
const validateUpdate = ajv.compile(updateAyatSchema);

function buildIdQueries(val) {
  if (val === undefined || val === null || val === "") return [];
  const s = String(val);
  const arr = [{ _id: s }, { _id: val }];
  if (mongoose.Types.ObjectId.isValid(s)) {
    try {
      arr.push({ _id: new mongoose.Types.ObjectId(s) });
    } catch (_) {}
  }
  return arr;
}

function buildFieldIdQueries(fieldName, val) {
  if (val === undefined || val === null || val === "") return [];
  const s = String(val);
  const arr = [{ [fieldName]: s }, { [fieldName]: val }];
  if (mongoose.Types.ObjectId.isValid(s)) {
    try {
      arr.push({ [fieldName]: new mongoose.Types.ObjectId(s) });
    } catch (_) {}
  }
  return arr;
}

export class AyatsUsecase {
  static async getAyatsList({
    page = 1,
    limit = 20,
    search = "",
    categoryId = "",
    lectureId = "",
    surahNumber,
    ayatNumber,
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (categoryId) {
      const catQueries = buildFieldIdQueries("category_id_ref", categoryId);
      if (catQueries.length > 0) query.$or = catQueries;
    }

    if (lectureId) {
      const lecQueries = buildFieldIdQueries("lecture_id", lectureId);
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: lecQueries }];
        delete query.$or;
      } else {
        query.$or = lecQueries;
      }
    }

    if (surahNumber) {
      query.surah_number = Number(surahNumber);
    }

    if (ayatNumber) {
      const aRangeMatch = String(ayatNumber).trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (aRangeMatch) {
        const minA = Math.min(Number(aRangeMatch[1]), Number(aRangeMatch[2]));
        const maxA = Math.max(Number(aRangeMatch[1]), Number(aRangeMatch[2]));
        query.ayat_number = { $gte: minA, $lte: maxA };
      } else {
        query.ayat_number = Number(ayatNumber);
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions = [];

      // Check for SurahNumber:ayatnumber or Surah#:ayatno-ayatnumber (Range)
      // e.g. "2:53", "02:53", "2:50-60", "Surah 2:53", "2: 50 - 60"
      const verseRefRegex = /^(?:surah\s*)?(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/i;
      const refMatch = term.match(verseRefRegex);

      if (refMatch) {
        const sNum = parseInt(refMatch[1], 10);
        const startAyat = parseInt(refMatch[2], 10);
        const endAyat = refMatch[3] ? parseInt(refMatch[3], 10) : null;

        if (endAyat !== null) {
          const minA = Math.min(startAyat, endAyat);
          const maxA = Math.max(startAyat, endAyat);
          searchConditions.push({
            surah_number: sNum,
            ayat_number: { $gte: minA, $lte: maxA },
          });
        } else {
          searchConditions.push({
            surah_number: sNum,
            ayat_number: startAyat,
          });
        }
      } else {
        const regex = new RegExp(term, "i");
        searchConditions.push(
          { surah_name: regex },
          { english_translation: regex },
          { urdu_translation: regex },
          { arabic_text: regex },
          { points_notes_eng: regex },
          { points_notes_urdu: regex },
          { question_text: regex }
        );
        if (!isNaN(term)) {
          searchConditions.push(
            { surah_number: Number(term) },
            { ayat_number: Number(term) }
          );
        }

        // Support searching by ANY lecture name / alias
        const matchingLectures = await LectureModel.find({
          $or: [
            { lecture_name: regex },
            { lecture_name: { $elemMatch: { $regex: regex } } },
          ],
        }).select("_id lecture_id").lean();

        if (matchingLectures.length > 0) {
          const lecIds = matchingLectures.flatMap((l) => [
            String(l._id),
            l._id,
            l.lecture_id,
            String(l.lecture_id),
          ]);
          searchConditions.push({ lecture_id: { $in: lecIds } });
        }
      }

      if (query.$and) {
        query.$and.push({ $or: searchConditions });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const [total, items] = await Promise.all([
      AyatModel.countDocuments(query),
      AyatModel.find(query).skip(skip).limit(limitNum).lean(),
    ]);

    // Efficiently collect lecture IDs and Category IDs to attach names
    const lectureIdSet = new Set();
    const categoryIdSet = new Set();

    items.forEach((item) => {
      if (item.lecture_id) lectureIdSet.add(String(item.lecture_id));
      if (item.category_id_ref) categoryIdSet.add(String(item.category_id_ref));
    });

    const [lectures, categories] = await Promise.all([
      lectureIdSet.size > 0
        ? LectureModel.find({
            $or: Array.from(lectureIdSet).flatMap((id) => buildIdQueries(id)),
          }).lean()
        : [],
      categoryIdSet.size > 0
        ? CategoryModel.find({
            $or: Array.from(categoryIdSet).flatMap((id) => buildIdQueries(id)),
          }).lean()
        : [],
    ]);

    const lectureMap = new Map();
    lectures.forEach((l) => {
      const allNames = Array.isArray(l.lecture_name)
        ? l.lecture_name
        : l.lecture_name
        ? [l.lecture_name]
        : [];
      const primaryName = allNames[0] || `Lecture ${l.lecture_id}`;
      const entry = { primaryName, allNames };
      lectureMap.set(String(l._id), entry);
      if (l.lecture_id) lectureMap.set(String(l.lecture_id), entry);
    });

    const categoryMap = new Map();
    categories.forEach((c) => {
      categoryMap.set(String(c._id), c.category_name || `Category ${c.category_id}`);
      if (c.category_id) categoryMap.set(String(c.category_id), c.category_name);
    });

    const enrichedItems = items.map((item) => {
      const lecEntry =
        lectureMap.get(String(item.lecture_id)) || {
          primaryName: Array.isArray(item.lecture_name)
            ? item.lecture_name[0] || `Lecture ${item.lecture_id}`
            : (item.lecture_name || `Lecture ${item.lecture_id}`),
          allNames: Array.isArray(item.lecture_name)
            ? item.lecture_name
            : item.lecture_name
            ? [item.lecture_name]
            : [],
        };
      const catName =
        categoryMap.get(String(item.category_id_ref)) ||
        (item.category_name ? item.category_name : "");
      return {
        ...item,
        lecture_name: lecEntry.primaryName,
        lecture_names: lecEntry.allNames,
        lecture_name_display: lecEntry.primaryName,
        category_name: catName,
      };
    });

    return AyatMapper.toListResponse({
      items: enrichedItems,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  }

  static async getAyatById(id) {
    const queries = buildIdQueries(id);
    const item = await AyatModel.findOne({ $or: queries }).lean();
    if (!item) return null;

    let lecture_name = "";
    let category_name = "";

    if (item.lecture_id) {
      const lecQueries = buildIdQueries(item.lecture_id);
      const lecture = await LectureModel.findOne({ $or: lecQueries }).lean();
      if (lecture) {
        lecture_name = Array.isArray(lecture.lecture_name)
          ? lecture.lecture_name[0] || ""
          : lecture.lecture_name || "";
        if (!item.category_id_ref && lecture.category_id_ref) {
          item.category_id_ref = lecture.category_id_ref;
        }
      }
    }

    if (item.category_id_ref) {
      const catQueries = buildIdQueries(item.category_id_ref);
      const category = await CategoryModel.findOne({ $or: catQueries }).lean();
      if (category) {
        category_name = category.category_name;
      }
    }

    return AyatMapper.toResponse(item, { lecture_name, category_name });
  }

  static async createAyat(rawPayload) {
    const valid = validateCreate(rawPayload);
    if (!valid) {
      throw new Error(`Validation error: ${JSON.stringify(validateCreate.errors)}`);
    }

    const reqData = new CreateAyatReq(rawPayload);
    // Automatically fill category_id_ref from lecture if missing
    if (!reqData.category_id_ref && reqData.lecture_id) {
      const lec = await LectureModel.findOne({
        $or: buildIdQueries(reqData.lecture_id),
      }).lean();
      if (lec && lec.category_id_ref) {
        reqData.category_id_ref = lec.category_id_ref;
      }
    }

    const created = await AyatModel.create(reqData);

    // Update total_ayats count on lecture
    try {
      if (reqData.lecture_id) {
        await LectureModel.updateMany(
          { $or: buildIdQueries(reqData.lecture_id) },
          { $inc: { total_ayats: 1 } }
        );
      }
    } catch (_) {}

    return this.getAyatById(created._id);
  }

  static async updateAyat(id, rawPayload) {
    const valid = validateUpdate(rawPayload);
    if (!valid) {
      throw new Error(`Validation error: ${JSON.stringify(validateUpdate.errors)}`);
    }

    const updateData = new UpdateAyatReq(rawPayload);
    const queries = buildIdQueries(id);

    const updated = await AyatModel.findOneAndUpdate(
      { $or: queries },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updated) {
      throw new Error(`Ayat record with id ${id} not found`);
    }

    return this.getAyatById(updated._id);
  }

  static async deleteAyat(id) {
    const queries = buildIdQueries(id);
    const existing = await AyatModel.findOne({ $or: queries }).lean();
    if (!existing) {
      throw new Error(`Ayat record with id ${id} not found`);
    }

    await AyatModel.deleteOne({ $or: queries });

    // Decrement count on lecture if applicable
    try {
      if (existing.lecture_id) {
        await LectureModel.updateMany(
          { $or: buildIdQueries(existing.lecture_id) },
          { $inc: { total_ayats: -1 } }
        );
      }
    } catch (_) {}

    return { success: true, message: "Ayat deleted successfully" };
  }

  /**
   * Reverse Lookup: Find all lecture and category occurrences of a given Surah and Ayat number (or range).
   */
  static async getVerseReferences(surahNumber, ayatNumber) {
    const surah = Number(surahNumber);
    if (!surah) {
      throw new Error("surah_number is required");
    }

    let ayatQuery;
    const rangeMatch = String(ayatNumber).trim().match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const minA = Math.min(Number(rangeMatch[1]), Number(rangeMatch[2]));
      const maxA = Math.max(Number(rangeMatch[1]), Number(rangeMatch[2]));
      ayatQuery = { $gte: minA, $lte: maxA };
    } else {
      const ayat = Number(ayatNumber);
      if (!ayat) {
        throw new Error("ayat_number is required");
      }
      ayatQuery = ayat;
    }

    const matches = await AyatModel.find({
      surah_number: surah,
      ayat_number: ayatQuery,
    }).lean();

    if (matches.length === 0) {
      return {
        surah_number: surah,
        ayat_number: ayatNumber,
        total_occurrences: 0,
        occurrences: [],
      };
    }

    // Load lectures and categories for matches
    const lectureIdSet = new Set(matches.map((m) => String(m.lecture_id)).filter(Boolean));
    const categoryIdSet = new Set(matches.map((m) => String(m.category_id_ref)).filter(Boolean));

    const [lectures, categories] = await Promise.all([
      lectureIdSet.size > 0
        ? LectureModel.find({
            $or: Array.from(lectureIdSet).flatMap((id) => buildIdQueries(id)),
          }).lean()
        : [],
      categoryIdSet.size > 0
        ? CategoryModel.find({
            $or: Array.from(categoryIdSet).flatMap((id) => buildIdQueries(id)),
          }).lean()
        : [],
    ]);

    const lectureMap = new Map();
    lectures.forEach((l) => {
      lectureMap.set(String(l._id), l);
      if (l.lecture_id) lectureMap.set(String(l.lecture_id), l);
    });

    const categoryMap = new Map();
    categories.forEach((c) => {
      categoryMap.set(String(c._id), c);
      if (c.category_id) categoryMap.set(String(c.category_id), c);
    });

    const occurrences = matches.map((m) => {
      const lec = lectureMap.get(String(m.lecture_id)) || null;
      let cat = null;
      if (m.category_id_ref) {
        cat = categoryMap.get(String(m.category_id_ref));
      } else if (lec && lec.category_id_ref) {
        cat = categoryMap.get(String(lec.category_id_ref));
      }

      const vNorm = normalizeAyatVideos(m);

      const allLecNames = Array.isArray(lec?.lecture_name)
        ? lec.lecture_name
        : lec?.lecture_name
        ? [lec.lecture_name]
        : [];
      const primaryLecName = allLecNames[0] || (lec ? `Lecture ${m.lecture_id}` : "");

      return {
        ayat_id: String(m._id),
        surah_number: m.surah_number,
        surah_name: m.surah_name || primaryLecName,
        ayat_number: m.ayat_number,
        arabic_text: m.arabic_text || "",
        english_translation: m.english_translation || "",
        urdu_translation: m.urdu_translation || "",
        hindi_translation: m.hindi_translation || "",
        points_notes_eng: m.points_notes_eng || "",
        points_notes_urdu: m.points_notes_urdu || "",
        points_notes_hindi: m.points_notes_hindi || "",
        quest_answer: m.quest_answer || false,
        question_text: m.question_text || "",
        video_urls: vNorm.video_urls,
        youtube_urls: vNorm.youtube_urls,
        video_url_eng: vNorm.video_url_eng,
        video_url_urdu: vNorm.video_url_urdu,
        video_url: vNorm.video_url,
        lecture_id: m.lecture_id,
        lecture_name: primaryLecName,
        lecture_names: allLecNames,
        lecture_name_display: primaryLecName,
        year_delivered: lec ? lec.year_delivered : "",
        category_id: cat ? (cat.category_id || cat._id) : (m.category_id_ref || ""),
        category_name: cat ? cat.category_name : "Category",
        language: cat ? (cat.language || "eng") : "eng",
      };
    });

    return {
      surah_number: surah,
      ayat_number: ayatNumber,
      total_occurrences: occurrences.length,
      occurrences,
    };
  }
}
