import { normalizeAyatVideos } from "../ayats/ayats.res.js";

export function normalizePdfUrls(l) {
  if (!l) return [];
  const rawCandidates = [];

  if (Array.isArray(l.pdf_url) && l.pdf_url.length > 0) {
    rawCandidates.push(...l.pdf_url);
  } else if (typeof l.pdf_url === "string" && l.pdf_url.trim()) {
    rawCandidates.push({ title: l.pdf_title || "", url: l.pdf_url.trim() });
  } else if (l.pdf_url && typeof l.pdf_url === "object" && (l.pdf_url.url || l.pdf_url.title)) {
    rawCandidates.push(l.pdf_url);
  }

  if (Array.isArray(l.pdf_booklet_urls) && l.pdf_booklet_urls.length > 0) {
    rawCandidates.push(...l.pdf_booklet_urls);
  }

  if (typeof l.pdf_link === "string" && l.pdf_link.trim()) {
    rawCandidates.push({ title: l.pdf_title || "", url: l.pdf_link.trim() });
  }

  const seenUrls = new Set();
  const result = [];
  const defaultTitle =
    (typeof l.pdf_title === "string" && l.pdf_title.trim()) ||
    (Array.isArray(l.lecture_name) ? l.lecture_name[0] : (typeof l.lecture_name === "string" ? l.lecture_name : ""));

  for (const item of rawCandidates) {
    let title = "";
    let url = "";

    if (typeof item === "string" && item.trim()) {
      title = defaultTitle;
      url = item.trim();
    } else if (item && typeof item === "object") {
      title = (typeof item.title === "string" && item.title.trim()) || defaultTitle;
      url = typeof item.url === "string" ? item.url.trim() : "";
    }

    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      result.push({ title, url });
    }
  }

  return result;
}

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
        const rawPdfList = normalizePdfUrls(l);
        const primaryPdf = rawPdfList[0] || { title: "", url: "" };
        const rawLectureIcons = Array.isArray(l.icon_url)
          ? l.icon_url.filter(Boolean)
          : typeof l.icon_url === "string" && l.icon_url.trim()
          ? [l.icon_url.trim()]
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
          pdf_url: rawPdfList,
          pdf_link: primaryPdf.url,
          pdf_booklet_urls: rawPdfList.map((p) => p.url),
          pdf_title: primaryPdf.title,
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
