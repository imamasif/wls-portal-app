import mongoose from "mongoose";

const ayatSchema = new mongoose.Schema({
  category_id_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  lecture_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
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
  video_url_eng: { type: String, default: "" },
  youtube_url_eng: { type: String, default: "" },
  facebook_url_eng: { type: String, default: "" },
  video_url_urdu: { type: String, default: "" },
  youtube_url_urdu: { type: String, default: "" },
  facebook_url_urdu: { type: String, default: "" },
  ayat_image_eng_url: { type: String, default: "" },
  ayat_image_urdu_url: { type: String, default: "" },
  ayat_image_hindi_url: { type: String, default: "" },
});

const lectureSchema = new mongoose.Schema({
  category_id_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  lecture_id: { type: Number, required: true },
  lecture_name: { type: String, required: true },
  year_delivered: { type: String, default: "" },
  total_ayats: { type: Number, default: 0 },
});

const categorySchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    compiler: { type: String, required: true },
    category_id: { type: Number, unique: true, required: true },
    category_name: { type: String, required: true },
    language: { type: String, default: "eng" },
    total_lectures: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const AyatModel = mongoose.model("Ayat", ayatSchema);
export const LectureModel = mongoose.model("Lecture", lectureSchema);
export const CategoryModel = mongoose.model("Category", categorySchema);
