import mongoose from "mongoose";

const ayatSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed },
    category_id_ref: {
      type: mongoose.Schema.Types.Mixed,
    },
    lecture_id: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    surah_number: { type: Number, required: true },
    surah_name: { type: String, default: "" },
    ayat_number: { type: Number, required: true },
    arabic_text: { type: String, default: "" },
    english_translation: { type: String, default: "" },
    urdu_translation: { type: String, default: "" },
    hindi_translation: { type: String, default: "" },
    points_notes_eng: { type: String, default: "" },
    points_notes_urdu: { type: String, default: "" },
    points_notes_hindi: { type: String, default: "" },
    quest_answer: { type: Boolean, default: false },
    question_text: { type: String, default: "" },
    video_url_eng: { type: mongoose.Schema.Types.Mixed, default: "" },
    youtube_url_eng: { type: mongoose.Schema.Types.Mixed, default: "" },
    facebook_url_eng: { type: mongoose.Schema.Types.Mixed, default: "" },
    video_url_urdu: { type: mongoose.Schema.Types.Mixed, default: "" },
    youtube_url_urdu: { type: mongoose.Schema.Types.Mixed, default: "" },
    facebook_url_urdu: { type: mongoose.Schema.Types.Mixed, default: "" },
    video_urls: { type: [String], default: [] },
    youtube_urls: { type: [String], default: [] },
    youtube_urls_eng: { type: [String], default: [] },
    youtube_urls_urdu: { type: [String], default: [] },
    video_urls_eng: { type: [String], default: [] },
    video_urls_urdu: { type: [String], default: [] },
    ayat_image_eng_url: { type: String, default: "" },
    ayat_image_urdu_url: { type: String, default: "" },
    ayat_image_hindi_url: { type: String, default: "" },
  },
  { strict: false },
);

const lectureSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed },
    category_id_ref: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    lecture_id: { type: Number, required: true },
    lecture_name: { type: [String], required: true },
    title: { type: String, default: "" },
    language: { type: String, default: "eng" },
    year_delivered: { type: String, default: "" },
    season: { type: String, default: "" },
    episode: { type: String, default: "" },
    video_url: { type: String, default: "" },
    video_urls: { type: [String], default: [] },
    youtube_urls: { type: [String], default: [] },
    facebook_urls: { type: [String], default: [] },
    full_lecture_video_url: { type: String, default: "" },
    seasons: { type: Array, default: [] },
    episodes: { type: Array, default: [] },
    pdf_url: { type: [String], default: [] },
    icon_url: { type: [String], default: [] },
    total_ayats: { type: Number, default: 0 },
  },
  { strict: false },
);

const categorySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed },
    source: { type: String, required: true },
    compiler: { type: String, required: true },
    category_id: { type: Number, required: true },
    category_name: { type: String, required: true },
    language: { type: String, default: "eng" },
    icon_url: { type: [String], default: [] },
    total_lectures: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false },
);

export const AyatModel = mongoose.model("Ayat", ayatSchema);
export const LectureModel = mongoose.model("Lecture", lectureSchema);
export const CategoryModel = mongoose.model("Category", categorySchema);
