// server/src/features/ayats/ayats.res.js

export function normalizeAyatVideos(item = {}) {
  const allUrls = [];

  const add = (v) => {
    if (!v) return;
    if (Array.isArray(v)) {
      v.forEach((x) => {
        if (typeof x === "string") {
          const trimmed = x.trim();
          if (trimmed && !allUrls.includes(trimmed)) allUrls.push(trimmed);
        }
      });
    } else if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed && !allUrls.includes(trimmed)) allUrls.push(trimmed);
    }
  };

  const collectSpecific = (fields) => {
    const list = [];
    fields.forEach((f) => {
      const val = item[f];
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach((x) => {
          if (typeof x === "string") {
            const trimmed = x.trim();
            if (trimmed && !list.includes(trimmed)) list.push(trimmed);
          }
        });
      } else if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed && !list.includes(trimmed)) list.push(trimmed);
      }
    });
    return list;
  };

  const engList = collectSpecific(["youtube_urls_eng", "video_urls_eng", "youtube_url_eng", "video_url_eng"]);
  const urduList = collectSpecific(["youtube_urls_urdu", "video_urls_urdu", "youtube_url_urdu", "video_url_urdu"]);

  add(item.video_urls);
  add(item.youtube_urls);
  add(engList);
  add(urduList);
  add(item.video_url);
  add(item.youtube_url);

  const primaryEng = engList[0] || (Array.isArray(item.youtube_url_eng) ? item.youtube_url_eng[0] : item.youtube_url_eng) || allUrls[0] || "";
  const primaryUrdu = urduList[0] || (Array.isArray(item.youtube_url_urdu) ? item.youtube_url_urdu[0] : item.youtube_url_urdu) || "";

  return {
    video_urls: allUrls,
    youtube_urls: allUrls,
    youtube_urls_eng: engList,
    video_urls_eng: engList,
    youtube_urls_urdu: urduList,
    video_urls_urdu: urduList,
    video_url_eng: String(primaryEng || "").trim(),
    youtube_url_eng: String(primaryEng || "").trim(),
    video_url_urdu: String(primaryUrdu || "").trim(),
    youtube_url_urdu: String(primaryUrdu || "").trim(),
    video_url: allUrls[0] || "",
    youtube_url: allUrls[0] || "",
  };
}

export class AyatRes {
  constructor(data) {
    this._id = String(data._id || "");
    this.category_id_ref = data.category_id_ref ? String(data.category_id_ref) : "";
    this.category_name = data.category_name || "";
    this.lecture_id = data.lecture_id ? String(data.lecture_id) : "";
    const allLecNames = Array.isArray(data.lecture_name)
      ? data.lecture_name
      : Array.isArray(data.lecture_names)
      ? data.lecture_names
      : data.lecture_name
      ? [data.lecture_name]
      : [];
    this.lecture_name = allLecNames[0] || (typeof data.lecture_name === "string" ? data.lecture_name : "");
    this.lecture_names = allLecNames;
    this.lecture_name_display = this.lecture_name;
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
    this.video_url = vNorm.video_url;
    this.youtube_url = vNorm.youtube_url;

    this.facebook_url_eng = typeof data.facebook_url_eng === "string" ? data.facebook_url_eng : "";
    this.facebook_url_urdu = typeof data.facebook_url_urdu === "string" ? data.facebook_url_urdu : "";
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
