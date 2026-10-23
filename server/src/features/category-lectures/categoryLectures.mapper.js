import { normalizeAyatVideos } from "../ayats/ayats.res.js";

export class CategoryMapper {
  static toResponse(doc) {
    return {
      id: doc._id,
      source: doc.source,
      compiler: doc.compiler,
      language: doc.language,
      category_id: doc.category_id,
      category_name: doc.category_name,
      total_lectures:
        doc.total_lectures || (doc.lectures ? doc.lectures.length : 0),
      lectures: (doc.lectures || []).map((l) => {
        const rawVideoUrls = Array.isArray(l.video_urls)
          ? l.video_urls
          : Array.isArray(l.videoUrls)
          ? l.videoUrls
          : l.video_url
          ? [l.video_url]
          : [];
        const rawLectureNames = Array.isArray(l.lecture_name)
          ? l.lecture_name
          : l.lecture_name
          ? [l.lecture_name]
          : [];
        return {
          _id: l._id,
          id: l._id,
          lecture_id: l.lecture_id,
          lecture_name: rawLectureNames,
          lecture_name_display: rawLectureNames[0] || "",
          language: l.language,
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
          pdf_link: l.pdf_link || (Array.isArray(l.pdf_booklet_urls) ? l.pdf_booklet_urls[0] : "") || l.pdf_url || "",
          pdf_booklet_urls: l.pdf_booklet_urls || [],
          pdf_url: l.pdf_url || l.pdfUrl || "",
          pdf_title: l.pdf_title || l.pdfTitle || "",
          total_ayats:
            l.total_ayats || (l.ayat_references ? l.ayat_references.length : 0),
          ayat_references: (l.ayat_references || []).map((a) => {
            const vNorm = normalizeAyatVideos(a);
            return {
              ...a,
              ...vNorm,
            };
          }),
        };
      }),
    };
  }

  static toResponseList(docs) {
    return docs.map((doc) => CategoryMapper.toResponse(doc));
  }
}
