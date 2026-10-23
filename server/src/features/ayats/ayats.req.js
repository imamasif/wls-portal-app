// server/src/features/ayats/ayats.req.js
import { normalizeAyatVideos } from "./ayats.res.js";

export class CreateAyatReq {
  constructor(data) {
    this.category_id_ref = data.category_id_ref || "";
    this.lecture_id = data.lecture_id;
    this.surah_number = Number(data.surah_number);
    this.surah_name = String(data.surah_name || "").trim();
    this.ayat_number = Number(data.ayat_number);
    this.arabic_text = String(data.arabic_text || "").trim();
    this.english_translation = String(data.english_translation || "").trim();
    this.urdu_translation = String(data.urdu_translation || "").trim();
    this.hindi_translation = String(data.hindi_translation || "").trim();
    this.points_notes_eng = String(data.points_notes_eng || "").trim();
    this.points_notes_urdu = String(data.points_notes_urdu || "").trim();
    this.points_notes_hindi = String(data.points_notes_hindi || "").trim();
    this.quest_answer = Boolean(data.quest_answer);
    this.question_text = String(data.question_text || "").trim();

    const vNorm = normalizeAyatVideos(data);
    this.video_urls = vNorm.video_urls;
    this.youtube_urls = vNorm.youtube_urls;
    this.youtube_urls_eng = vNorm.youtube_urls_eng;
    this.video_urls_eng = vNorm.video_urls_eng;
    this.youtube_urls_urdu = vNorm.youtube_urls_urdu;
    this.video_urls_urdu = vNorm.video_urls_urdu;
    this.video_url_eng = vNorm.video_url_eng;
    this.youtube_url_eng = vNorm.youtube_url_eng;
    this.video_url_urdu = vNorm.video_url_urdu;
    this.youtube_url_urdu = vNorm.youtube_url_urdu;

    this.facebook_url_eng = String(data.facebook_url_eng || "").trim();
    this.facebook_url_urdu = String(data.facebook_url_urdu || "").trim();
    this.ayat_image_eng_url = String(data.ayat_image_eng_url || "").trim();
    this.ayat_image_urdu_url = String(data.ayat_image_urdu_url || "").trim();
    this.ayat_image_hindi_url = String(data.ayat_image_hindi_url || "").trim();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

export class UpdateAyatReq {
  constructor(data) {
    if (data.category_id_ref !== undefined) this.category_id_ref = data.category_id_ref;
    if (data.lecture_id !== undefined) this.lecture_id = data.lecture_id;
    if (data.surah_number !== undefined) this.surah_number = Number(data.surah_number);
    if (data.surah_name !== undefined) this.surah_name = String(data.surah_name || "").trim();
    if (data.ayat_number !== undefined) this.ayat_number = Number(data.ayat_number);
    if (data.arabic_text !== undefined) this.arabic_text = String(data.arabic_text || "").trim();
    if (data.english_translation !== undefined) this.english_translation = String(data.english_translation || "").trim();
    if (data.urdu_translation !== undefined) this.urdu_translation = String(data.urdu_translation || "").trim();
    if (data.hindi_translation !== undefined) this.hindi_translation = String(data.hindi_translation || "").trim();
    if (data.points_notes_eng !== undefined) this.points_notes_eng = String(data.points_notes_eng || "").trim();
    if (data.points_notes_urdu !== undefined) this.points_notes_urdu = String(data.points_notes_urdu || "").trim();
    if (data.points_notes_hindi !== undefined) this.points_notes_hindi = String(data.points_notes_hindi || "").trim();
    if (data.quest_answer !== undefined) this.quest_answer = Boolean(data.quest_answer);
    if (data.question_text !== undefined) this.question_text = String(data.question_text || "").trim();

    if (
      data.video_urls !== undefined ||
      data.youtube_urls !== undefined ||
      data.youtube_urls_eng !== undefined ||
      data.video_urls_eng !== undefined ||
      data.youtube_urls_urdu !== undefined ||
      data.video_urls_urdu !== undefined ||
      data.video_url_eng !== undefined ||
      data.youtube_url_eng !== undefined ||
      data.video_url_urdu !== undefined ||
      data.youtube_url_urdu !== undefined
    ) {
      const vNorm = normalizeAyatVideos(data);
      this.video_urls = vNorm.video_urls;
      this.youtube_urls = vNorm.youtube_urls;
      this.youtube_urls_eng = vNorm.youtube_urls_eng;
      this.video_urls_eng = vNorm.video_urls_eng;
      this.youtube_urls_urdu = vNorm.youtube_urls_urdu;
      this.video_urls_urdu = vNorm.video_urls_urdu;
      this.video_url_eng = vNorm.video_url_eng;
      this.youtube_url_eng = vNorm.youtube_url_eng;
      this.video_url_urdu = vNorm.video_url_urdu;
      this.youtube_url_urdu = vNorm.youtube_url_urdu;
    }

    if (data.facebook_url_eng !== undefined) this.facebook_url_eng = String(data.facebook_url_eng || "").trim();
    if (data.facebook_url_urdu !== undefined) this.facebook_url_urdu = String(data.facebook_url_urdu || "").trim();
    if (data.ayat_image_eng_url !== undefined) this.ayat_image_eng_url = String(data.ayat_image_eng_url || "").trim();
    if (data.ayat_image_urdu_url !== undefined) this.ayat_image_urdu_url = String(data.ayat_image_urdu_url || "").trim();
    if (data.ayat_image_hindi_url !== undefined) this.ayat_image_hindi_url = String(data.ayat_image_hindi_url || "").trim();
    this.updatedAt = new Date();
  }
}
