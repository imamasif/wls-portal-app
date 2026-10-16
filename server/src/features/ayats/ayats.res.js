// server/src/features/ayats/ayats.res.js

export class AyatRes {
  constructor(data) {
    this._id = String(data._id || "");
    this.category_id_ref = data.category_id_ref ? String(data.category_id_ref) : "";
    this.category_name = data.category_name || "";
    this.lecture_id = data.lecture_id ? String(data.lecture_id) : "";
    this.lecture_name = data.lecture_name || "";
    this.surah_number = Number(data.surah_number) || 0;
    this.surah_name = data.surah_name || "";
    this.ayat_number = Number(data.ayat_number) || 0;
    this.arabic_text = data.arabic_text || "";
    this.english_translation = data.english_translation || "";
    this.urdu_translation = data.urdu_translation || "";
    this.hindi_translation = data.hindi_translation || "";
    this.points_notes_eng = data.points_notes_eng || "";
    this.points_notes_urdu = data.points_notes_urdu || "";
    this.points_notes_hindi = data.points_notes_hindi || "";
    this.quest_answer = Boolean(data.quest_answer);
    this.question_text = data.question_text || "";
    this.video_url_eng = data.video_url_eng || "";
    this.youtube_url_eng = data.youtube_url_eng || "";
    this.facebook_url_eng = data.facebook_url_eng || "";
    this.video_url_urdu = data.video_url_urdu || "";
    this.youtube_url_urdu = data.youtube_url_urdu || "";
    this.facebook_url_urdu = data.facebook_url_urdu || "";
    this.ayat_image_eng_url = data.ayat_image_eng_url || "";
    this.ayat_image_urdu_url = data.ayat_image_urdu_url || "";
    this.ayat_image_hindi_url = data.ayat_image_hindi_url || "";
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }
}

export class AyatListRes {
  constructor({ items, total, page, limit, totalPages }) {
    this.items = items.map((item) => new AyatRes(item));
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = totalPages;
  }
}
