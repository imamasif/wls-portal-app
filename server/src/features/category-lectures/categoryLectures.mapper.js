import { normalizeAyatVideos } from "../ayats/ayats.res.js";

export class CategoryMapper {
  static toResponse(doc) {
    const rawCategoryIcons = Array.isArray(doc.icon_url)
      ? doc.icon_url.filter(Boolean)
      : typeof doc.icon_url === "string" && doc.icon_url.trim()
      ? [doc.icon_url.trim()]
      : [];

    return {
      id: doc._id,
      source: doc.source,
      compiler: doc.compiler,
      language: doc.language,
      category_id: doc.category_id,
      category_name: doc.category_name,
      icon_url: rawCategoryIcons,
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
        const rawPdfUrls = Array.isArray(l.pdf_url)
          ? l.pdf_url.filter(Boolean)
          : typeof l.pdf_url === "string" && l.pdf_url.trim()
          ? [l.pdf_url.trim()]
          : Array.isArray(l.pdf_booklet_urls) && l.pdf_booklet_urls.length > 0
          ? l.pdf_booklet_urls.filter(Boolean)
          : typeof l.pdf_link === "string" && l.pdf_link.trim()
          ? [l.pdf_link.trim()]
          : [];
        const rawLectureIcons = Array.isArray(l.icon_url)
          ? l.icon_url.filter(Boolean)
          : typeof l.icon_url === "string" && l.icon_url.trim()
          ? [l.icon_url.trim()]
          : [];
        const title = l.title || l.pdf_title || l.pdfTitle || "";
        return {
          _id: l._id,
          id: l._id,
          lecture_id: l.lecture_id,
          lecture_name: rawLectureNames,
          lecture_name_display: rawLectureNames[0] || "",
          title,
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
          pdf_url: rawPdfUrls,
          pdf_link: rawPdfUrls[0] || "",
          pdf_booklet_urls: rawPdfUrls,
          pdf_title: title,
          icon_url: rawLectureIcons,
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
