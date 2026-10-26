import {
  Heart,
  Sparkles,
  ThumbsUp,
  Headphones,
} from "lucide-react";

export const CATEGORY_PALETTES = [
  "#2563eb", // Blue
  "#059669", // Emerald
  "#7c3aed", // Violet
  "#d97706", // Amber
  "#dc2626", // Red
  "#0891b2", // Cyan
  "#4f46e5", // Indigo
  "#db2777", // Pink
  "#16a34a", // Green
  "#9333ea", // Purple
  "#ea580c", // Orange
  "#0284c7", // Sky
];

// 4 Cute Happy Reactions that pop around on circular click: Thumb, Hear, Love, Spread
export const CUTE_REACTIONS = [
  { id: "thumb", label: "Thumb", icon: ThumbsUp, emoji: "👍", color: "#2563eb", bg: "#eff6ff", glow: "rgba(37, 99, 235, 0.4)" },
  { id: "hear", label: "Hear", icon: Headphones, emoji: "👂", color: "#7c3aed", bg: "#f5f3ff", glow: "rgba(124, 58, 237, 0.4)" },
  { id: "love", label: "Love", icon: Heart, emoji: "❤️", color: "#db2777", bg: "#fdf2f8", glow: "rgba(219, 39, 119, 0.4)", fill: true },
  { id: "spread", label: "Spread", icon: Sparkles, emoji: "🌟", color: "#d97706", bg: "#fffbeb", glow: "rgba(217, 119, 6, 0.4)", fill: true },
];

// PROVISION: Ayat Images display flag
// Set to true once server populates ayat_image_eng_url, ayat_image_urdu_url, ayat_image_hindi_url
export const SHOW_AYAT_IMAGES = false;

/**
 * Normalizes all possible video sources on an ayat into a clean array of unique string URLs.
 */
export function getAyatVideoList(verse) {
  if (!verse) return [];
  const list = [];
  const add = (v) => {
    if (!v) return;
    if (Array.isArray(v)) {
      v.forEach((x) => {
        if (typeof x === "string") {
          const trimmed = x.trim();
          if (trimmed && !list.includes(trimmed)) list.push(trimmed);
        }
      });
    } else if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed && !list.includes(trimmed)) list.push(trimmed);
    }
  };

  add(verse.video_urls);
  add(verse.youtube_urls);
  add(verse.youtube_urls_eng);
  add(verse.video_urls_eng);
  add(verse.youtube_url_eng);
  add(verse.video_url_eng);
  add(verse.youtube_urls_urdu);
  add(verse.video_urls_urdu);
  add(verse.youtube_url_urdu);
  add(verse.video_url_urdu);
  add(verse.video_url);
  add(verse.youtube_url);

  return list;
}

/**
 * Parses user input searching for verse reference or range:
 * - SurahNumber:ayatnumber (e.g. "2:53", "02:53", "Surah 2:53")
 * - Surah#:ayatno-ayatnumber (Range, e.g. "2:50-60", "02:50-02:60", "2: 50 - 60")
 */
export function parseVerseSearch(query = "") {
  if (!query || typeof query !== "string") return null;
  const trimmed = query.trim();
  const regex = /^(?:surah\s*)?(\d+)\s*:\s*(\d+)(?:\s*-\s*(?:(?:surah\s*)?\d+\s*:\s*)?(\d+))?$/i;
  const match = trimmed.match(regex);
  if (!match) return null;
  const surah = parseInt(match[1], 10);
  const startAyat = parseInt(match[2], 10);
  const endAyat = match[3] ? parseInt(match[3], 10) : null;
  return {
    surah,
    startAyat,
    endAyat,
    isRange: endAyat !== null,
  };
}

/**
 * Formats seconds into mm:ss or hh:mm:ss
 */
export function parseVideoTimestamps(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const urlObj = new URL(url.includes("://") ? url : `https://${url}`);
    const start = urlObj.searchParams.get("start") || urlObj.searchParams.get("t");
    const end = urlObj.searchParams.get("end");

    if (!start && !end) return null;

    const formatSec = (s) => {
      const num = parseInt(String(s).replace("s", ""), 10);
      if (isNaN(num)) return s;
      const m = Math.floor(num / 60);
      const sec = num % 60;
      return `${m}:${String(sec).padStart(2, "0")}`;
    };

    const startFormatted = start ? formatSec(start) : null;
    const endFormatted = end ? formatSec(end) : null;

    if (startFormatted && endFormatted) {
      return `${startFormatted} - ${endFormatted}`;
    }
    if (startFormatted) {
      return `from ${startFormatted}`;
    }
    return `until ${endFormatted}`;
  } catch (_) {
    return null;
  }
}

/**
 * Converts YouTube video link to embeddable URL preserving timestamps (start & end).
 */
export function getEmbedUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  try {
    // If it's already an embed link
    if (trimmed.includes("youtube.com/embed/")) {
      return trimmed;
    }

    // Standard youtube.com/watch?v=...
    if (trimmed.includes("youtube.com/watch")) {
      const urlObj = new URL(trimmed);
      const vId = urlObj.searchParams.get("v");
      if (!vId) return trimmed;

      const start = urlObj.searchParams.get("start");
      const t = urlObj.searchParams.get("t");
      if (!start && t) {
        const seconds = parseInt(t.replace("s", ""), 10);
        if (!isNaN(seconds)) urlObj.searchParams.set("start", seconds);
      }
      urlObj.searchParams.delete("v");
      const qs = urlObj.searchParams.toString();
      return `https://www.youtube.com/embed/${vId}${qs ? `?${qs}` : ""}`;
    }

    // Shortened youtu.be/...
    if (trimmed.includes("youtu.be/")) {
      const urlObj = new URL(trimmed);
      const vId = urlObj.pathname.replace(/^\//, "");
      if (!vId) return trimmed;

      const start = urlObj.searchParams.get("start");
      const t = urlObj.searchParams.get("t");
      if (!start && t) {
        const seconds = parseInt(t.replace("s", ""), 10);
        if (!isNaN(seconds)) urlObj.searchParams.set("start", seconds);
      }
      const qs = urlObj.searchParams.toString();
      return `https://www.youtube.com/embed/${vId}${qs ? `?${qs}` : ""}`;
    }

    return trimmed;
  } catch (_) {
    return trimmed;
  }
}

/**
 * Converts embed or shortened YouTube link into standard youtube.com/watch?v=... with &t=...
 */
export function getYouTubeWatchUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();

  try {
    let videoId = "";
    let startTime = "";

    if (trimmed.includes("youtube.com/embed/")) {
      const urlObj = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
      videoId = urlObj.pathname.replace("/embed/", "");
      startTime = urlObj.searchParams.get("start") || urlObj.searchParams.get("t") || "";
    } else if (trimmed.includes("youtu.be/")) {
      const urlObj = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
      videoId = urlObj.pathname.replace("/", "");
      startTime = urlObj.searchParams.get("t") || urlObj.searchParams.get("start") || "";
    } else if (trimmed.includes("youtube.com/watch")) {
      const urlObj = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
      videoId = urlObj.searchParams.get("v") || "";
      startTime = urlObj.searchParams.get("t") || urlObj.searchParams.get("start") || "";
    }

    if (videoId) {
      const cleanStart = startTime ? String(startTime).replace("s", "") : "";
      return `https://www.youtube.com/watch?v=${videoId}${cleanStart ? `&t=${cleanStart}s` : ""}`;
    }
  } catch (_) {}

  return trimmed;
}

/**
 * Returns Primary Lecture Name (Column B / index 0)
 */
export const getLectureName = (lectureName) => {
  if (Array.isArray(lectureName)) return lectureName[0] || "";
  return lectureName || "";
};

/**
 * Returns Alternative Names / Aliases (e.g. Column A at index 1)
 */
export const getLectureAliases = (lectureName) => {
  if (Array.isArray(lectureName) && lectureName.length > 1) {
    return lectureName.slice(1).filter(Boolean);
  }
  return [];
};

/**
 * Returns All Names for multi-alias search
 */
export const getLectureAllNames = (lectureName) => {
  if (Array.isArray(lectureName)) return lectureName.filter(Boolean);
  return lectureName ? [lectureName] : [];
};

/**
 * Format verse reference as Surah#:Ayat# e.g. 02:15, 02:127
 */
export const formatVerseRef = (surah, ayat) => {
  const s = String(surah || 0).padStart(2, "0");
  const a = String(ayat || 0).padStart(2, "0");
  return `${s}:${a}`;
};

/**
 * Resolves the icon image URL for a category from category.icon_url: { type: [String], default: [] }.
 * Rules:
 * - If more than one link: randomly pick one
 * - If one link: show that one
 * - If nothing: do not show anything (return "")
 */
export function getCategoryIconUrl(category) {
  if (!category) return "";
  const raw = category.icon_url;
  const list = Array.isArray(raw)
    ? raw.filter((u) => typeof u === "string" && u.trim().length > 0)
    : typeof raw === "string" && raw.trim().length > 0
    ? [raw.trim()]
    : [];

  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

/**
 * Resolves the icon image URL for a lecture from lecture.icon_url: { type: [String], default: [] }.
 * Rules:
 * - If more than one link: randomly pick one
 * - If one link: show that one
 * - If nothing: do not show anything (return "")
 */
export function getLectureIconUrl(lecture) {
  if (!lecture) return "";
  const raw = lecture.icon_url;
  const list = Array.isArray(raw)
    ? raw.filter((u) => typeof u === "string" && u.trim().length > 0)
    : typeof raw === "string" && raw.trim().length > 0
    ? [raw.trim()]
    : [];

  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}
