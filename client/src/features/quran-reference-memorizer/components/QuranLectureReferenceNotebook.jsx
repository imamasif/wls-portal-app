// client/src/features/quran-reference-memorizer/components/QuranLectureReferenceNotebook.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Select,
  TextInput,
  Group,
  Stack,
  Badge,
  Card,
  Modal,
  Loader,
  ActionIcon,
  Tooltip,
  Paper,
  Tabs,
  Box,
  Divider,
  Table,
  SegmentedControl,
  SimpleGrid,
  useMantineColorScheme,
} from "@mantine/core";
import {
  Play,
  FileText,
  Heart,
  Layers,
  BookOpen,
  Search,
  X,
  Sun,
  Moon,
  Share2,
  Bookmark,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Volume2,
  List,
  Download,
  ThumbsUp,
  Headphones,
} from "lucide-react";
import {
  IconBook,
  IconSearch,
  IconX,
  IconSun,
  IconMoon,
  IconPrinter,
  IconSparkles,
  IconChevronRight,
  IconBrandYoutube,
  IconExternalLink,
  IconEye,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconCheck,
  IconTable,
} from "@tabler/icons-react";
import { SURAH_LIST } from "../../../components/common/QuranVersePicker";
import { NotebookSpine } from "../../sticky-notes/components/NotebookSpine";
import { fetchQuranVerseFromProxy } from "../api/ayatsApi";

const CATEGORY_PALETTES = [
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
const CUTE_REACTIONS = [
  { id: "thumb", label: "Thumb", icon: ThumbsUp, emoji: "👍", color: "#2563eb", bg: "#eff6ff", glow: "rgba(37, 99, 235, 0.4)" },
  { id: "hear", label: "Hear", icon: Headphones, emoji: "👂", color: "#7c3aed", bg: "#f5f3ff", glow: "rgba(124, 58, 237, 0.4)" },
  { id: "love", label: "Love", icon: Heart, emoji: "❤️", color: "#db2777", bg: "#fdf2f8", glow: "rgba(219, 39, 119, 0.4)", fill: true },
  { id: "spread", label: "Spread", icon: Sparkles, emoji: "🌟", color: "#d97706", bg: "#fffbeb", glow: "rgba(217, 119, 6, 0.4)", fill: true },
];

// PROVISION: Ayat Images display flag
// Set to true once server populates ayat_image_eng_url, ayat_image_urdu_url, ayat_image_hindi_url
const SHOW_AYAT_IMAGES = false;

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
    endAyat: endAyat !== null ? endAyat : startAyat,
    isRange: endAyat !== null && endAyat !== startAyat,
  };
}

/**
 * Parses YouTube start and end timestamps from URL for friendly display
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
      if (isNaN(num)) return null;
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
      return `Starts at ${startFormatted}`;
    }
    if (endFormatted) {
      return `Ends at ${endFormatted}`;
    }
  } catch (_) {}
  return null;
}

/**
 * Converts any YouTube URL to an embed URL that natively respects start & end query parameters.
 */
export function getEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // If already a YouTube embed URL, preserve query params (start, end, etc.)
  if (trimmed.includes("youtube.com/embed/")) {
    return trimmed;
  }

  // Handle standard youtube.com/watch?v=...
  if (trimmed.includes("youtube.com/watch")) {
    try {
      const urlObj = new URL(trimmed);
      const vId = urlObj.searchParams.get("v");
      if (vId) {
        urlObj.searchParams.delete("v");
        // Convert t=130s to start=130 if start is not specified
        const t = urlObj.searchParams.get("t");
        if (t && !urlObj.searchParams.has("start")) {
          const seconds = parseInt(t.replace("s", ""), 10);
          if (!isNaN(seconds)) urlObj.searchParams.set("start", seconds);
          urlObj.searchParams.delete("t");
        }
        const qs = urlObj.searchParams.toString();
        return `https://www.youtube.com/embed/${vId}${qs ? `?${qs}` : ""}`;
      }
    } catch (_) {}
  }

  // Handle youtu.be/VIDEO_ID
  if (trimmed.includes("youtu.be/")) {
    try {
      const urlObj = new URL(trimmed);
      const vId = urlObj.pathname.replace(/^\//, "");
      if (vId) {
        const t = urlObj.searchParams.get("t");
        if (t && !urlObj.searchParams.has("start")) {
          const seconds = parseInt(t.replace("s", ""), 10);
          if (!isNaN(seconds)) urlObj.searchParams.set("start", seconds);
          urlObj.searchParams.delete("t");
        }
        const qs = urlObj.searchParams.toString();
        return `https://www.youtube.com/embed/${vId}${qs ? `?${qs}` : ""}`;
      }
    } catch (_) {}
  }

  return trimmed;
}

/**
 * Converts any YouTube URL (embed, watch, or youtu.be) into a direct YouTube watch URL
 * with clean timestamp parameter (?t=...s) so users can open and play it directly on YouTube
 * even if third-party website embedding has been restricted by the video owner.
 */
export function getYouTubeWatchUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();

  try {
    let videoId = "";
    let startTime = "";

    if (trimmed.includes("youtube.com/embed/")) {
      const urlObj = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
      videoId = urlObj.pathname.split("/embed/")[1]?.split("/")[0]?.split("?")[0] || "";
      startTime = urlObj.searchParams.get("start") || urlObj.searchParams.get("t") || "";
    } else if (trimmed.includes("youtube.com/watch")) {
      const urlObj = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
      videoId = urlObj.searchParams.get("v") || "";
      startTime = urlObj.searchParams.get("start") || urlObj.searchParams.get("t") || "";
    } else if (trimmed.includes("youtu.be/")) {
      const urlObj = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
      videoId = urlObj.pathname.replace(/^\//, "").split("?")[0] || "";
      startTime = urlObj.searchParams.get("start") || urlObj.searchParams.get("t") || "";
    }

    if (videoId) {
      const cleanStart = startTime ? String(startTime).replace("s", "") : "";
      return `https://www.youtube.com/watch?v=${videoId}${cleanStart ? `&t=${cleanStart}s` : ""}`;
    }
  } catch (_) {}

  return trimmed;
}

export const getLectureName = (lectureName) => {
  if (Array.isArray(lectureName)) return lectureName[0] || "";
  return typeof lectureName === "string" ? lectureName : "";
};

export const getLectureAliases = (lectureName) => {
  if (Array.isArray(lectureName)) return lectureName.slice(1);
  return [];
};

export const getLectureAllNames = (lectureName) => {
  if (Array.isArray(lectureName)) return lectureName.filter(Boolean);
  return lectureName ? [lectureName] : [];
};

export function QuranLectureReferenceNotebook({ user }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Raw categories from API
  const [metaCategories, setMetaCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Language Tag: "eng" | "urdu" | "hindi" (Default: "eng")
  const [activeLanguage, setActiveLanguage] = useState("eng");

  // Active Category & Lecture
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeLectureIndex, setActiveLectureIndex] = useState(0);

  // Active Season inside the active lecture
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);

  // Liked Lectures map
  const [likedMap, setLikedMap] = useState({});

  // View Mode: "NOTEBOOK" (Category & Lecture Notebook) or "CONCORDANCE" (114-Chapter Sequence)
  const [viewMode, setViewMode] = useState("NOTEBOOK");

  // Top Filter Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSurah, setFilterSurah] = useState("");
  const [filterAyat, setFilterAyat] = useState("");

  // Excel-like Grid Sorting
  const [sortField, setSortField] = useState("SURAH_THEN_AYAT");

  // Page Flip Animation state
  const [isFlipping, setIsFlipping] = useState(false);

  // Modal inspection states
  const [activeAyatModal, setActiveAyatModal] = useState(null);
  const [isFetchingLiveArabic, setIsFetchingLiveArabic] = useState(false);
  const [liveArabicText, setLiveArabicText] = useState("");

  // Citations & Attached Clips Modal: { verse, citations }
  const [activeCitationsModal, setActiveCitationsModal] = useState(null);

  // Active Reaction Picker Popover lecture ID
  const [openReactionLectureId, setOpenReactionLectureId] = useState(null);

  // Active Video Player Modal: { title, url }
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Multi-Video Picker Modal (for ayats with multiple youtube/video links)
  const [activeMultiVideoModal, setActiveMultiVideoModal] = useState(null);

  // Pop Action Modal for orbital buttons: 'pdf' | 'episodes' | 'verses'
  const [activeActionModal, setActiveActionModal] = useState(null);
  const [actionModalLecture, setActionModalLecture] = useState(null);

  // Fetch Meta Categories on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch("/api/category-lectures/meta")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setMetaCategories(data);
        }
      })
      .catch((err) => console.error("Error loading categories:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Categories by selected Language Tag
  const languageCategories = useMemo(() => {
    return metaCategories.filter((c) => {
      const l = (c.language || "eng").toLowerCase();
      return l === activeLanguage.toLowerCase();
    });
  }, [metaCategories, activeLanguage]);

  // Safe Active Category
  const activeCategory = useMemo(() => {
    if (languageCategories.length === 0) return null;
    const clamped = Math.min(activeCategoryIndex, languageCategories.length - 1);
    return languageCategories[clamped] || null;
  }, [languageCategories, activeCategoryIndex]);

  // Lectures for active category
  const activeLectures = useMemo(() => {
    if (!activeCategory) return [];
    return activeCategory.lectures || [];
  }, [activeCategory]);

  // Safe Active Lecture
  const activeLecture = useMemo(() => {
    if (activeLectures.length === 0) return null;
    const clamped = Math.min(activeLectureIndex, activeLectures.length - 1);
    return activeLectures[clamped] || null;
  }, [activeLectures, activeLectureIndex]);

  // Reset active season when lecture changes
  useEffect(() => {
    setActiveSeasonIndex(0);
  }, [activeLectureIndex, activeCategoryIndex]);

  // Seasons list from DB
  const seasonsList = useMemo(() => {
    if (!activeLecture) return [];
    if (Array.isArray(activeLecture.seasons) && activeLecture.seasons.length > 0) {
      return activeLecture.seasons;
    }
    // Fallback: check video URLs or full lecture video url
    const fallbackUrls = [
      ...(activeLecture.full_lecture_video_url ? [activeLecture.full_lecture_video_url] : []),
      ...(Array.isArray(activeLecture.video_urls) ? activeLecture.video_urls : []),
      ...(Array.isArray(activeLecture.youtube_urls) ? activeLecture.youtube_urls : []),
    ];
    if (fallbackUrls.length > 0) {
      return [
        {
          season_name: activeLecture.season || "Season 1",
          year_delivered: activeLecture.year_delivered || "",
          episodes: fallbackUrls.map((u, i) => ({
            episode_number: `Part ${String(i + 1).padStart(2, "0")}`,
            episode_title: `Full Session Recording ${i + 1}`,
            episode_url: u,
          })),
        },
      ];
    }
    return [];
  }, [activeLecture]);

  const currentSeason = useMemo(() => {
    if (seasonsList.length === 0) return null;
    const idx = Math.min(activeSeasonIndex, seasonsList.length - 1);
    return seasonsList[idx] || seasonsList[0];
  }, [seasonsList, activeSeasonIndex]);

  const episodesList = useMemo(() => {
    if (!currentSeason) return [];
    return Array.isArray(currentSeason.episodes) ? currentSeason.episodes : [];
  }, [currentSeason]);

  // Handle circular click to toggle popover showing 4 cute reactions (Thumb, Hear, Love, Spread)
  const handleCircularLikeClick = (id, e) => {
    if (e) e.stopPropagation();
    setOpenReactionLectureId((prev) => (prev === id ? null : id));
  };

  // Choose reaction or toggle off if clicked again
  const handleSelectReaction = (id, reaction, e) => {
    if (e) e.stopPropagation();
    const existing = likedMap[id];
    if (existing && (existing.id === reaction.id || (existing === true && reaction.id === "love"))) {
      setLikedMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setLikedMap((prev) => ({
        ...prev,
        [id]: reaction,
      }));
    }
    setOpenReactionLectureId(null);
  };

  // Legacy fallback toggle if needed
  const handleLikeToggle = (id, e) => {
    if (e) e.stopPropagation();
    const existing = likedMap[id];
    if (existing) {
      setLikedMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setLikedMap((prev) => ({
        ...prev,
        [id]: CUTE_REACTIONS[2], // default to love
      }));
    }
  };

  // Open orbital action modal
  const openActionModal = (type, lecture, e) => {
    if (e) e.stopPropagation();
    if (type === "video") {
      // Find the first valid video URL from DB
      const firstEpUrl =
        (lecture.seasons && lecture.seasons[0]?.episodes?.[0]?.episode_url) ||
        lecture.full_lecture_video_url ||
        (Array.isArray(lecture.video_urls) ? lecture.video_urls[0] : "") ||
        (Array.isArray(lecture.youtube_urls) ? lecture.youtube_urls[0] : "") ||
        lecture.video_url ||
        "";
      if (firstEpUrl) {
        setActiveVideoModal({
          title: `Lecture ${lecture.lecture_id}: ${getLectureName(lecture.lecture_name)}`,
          url: firstEpUrl,
        });
      } else {
        setActionModalLecture(lecture);
        setActiveActionModal("episodes");
      }
      return;
    }
    setActionModalLecture(lecture);
    setActiveActionModal(type);
  };

  // Handle Language Tag Change
  const handleLanguageChange = (lang) => {
    if (lang === activeLanguage) return;
    setIsFlipping(true);
    setTimeout(() => {
      setActiveLanguage(lang);
      setActiveCategoryIndex(0);
      setActiveLectureIndex(0);
      setIsFlipping(false);
    }, 180);
  };

  // Handle Category Flip
  const handleCategoryChange = (index) => {
    if (index === activeCategoryIndex) return;
    setIsFlipping(true);
    setTimeout(() => {
      setActiveCategoryIndex(index);
      setActiveLectureIndex(0);
      setIsFlipping(false);
    }, 180);
  };

  // Handle Lecture Flip
  const handleLectureChange = (index) => {
    if (index === activeLectureIndex) return;
    setIsFlipping(true);
    setTimeout(() => {
      setActiveLectureIndex(index);
      setIsFlipping(false);
    }, 150);
  };

  // Ayat options for selected Surah in top filter
  const currentSurahObj = useMemo(() => {
    return SURAH_LIST.find((s) => s.value === filterSurah);
  }, [filterSurah]);

  const filterAyatOptions = useMemo(() => {
    if (!currentSurahObj) return [];
    return Array.from({ length: currentSurahObj.total }, (_, i) => ({
      value: String(i + 1),
      label: `Ayat ${i + 1}`,
    }));
  }, [currentSurahObj]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterSurah("");
    setFilterAyat("");
    setSortField("SURAH_THEN_AYAT");
  };

  const hasActiveFilters = searchQuery || filterSurah || filterAyat;

  // STRICT VALIDATION: Filter out Surah 0 and Ayat 0
  const isValidQuranicVerse = (a) => {
    const s = Number(a.surah_number);
    const ay = Number(a.ayat_number);
    return !isNaN(s) && s >= 1 && s <= 114 && !isNaN(ay) && ay >= 1;
  };

  // Filter & Sort helper
  const processAndSortAyats = (rawList) => {
    // 1. Strict Quranic verse validation
    let list = rawList.filter(isValidQuranicVerse);

    // 2. Filter by Surah
    if (filterSurah) {
      list = list.filter((a) => Number(a.surah_number) === Number(filterSurah));
    }

    // 3. Filter by Ayat
    if (filterAyat) {
      list = list.filter((a) => Number(a.ayat_number) === Number(filterAyat));
    }

    // 4. Check for SurahNumber:ayatnumber or Range Search Query
    const verseSearch = parseVerseSearch(searchQuery);

    if (verseSearch) {
      const minA = Math.min(verseSearch.startAyat, verseSearch.endAyat);
      const maxA = Math.max(verseSearch.startAyat, verseSearch.endAyat);
      list = list.filter((a) => {
        const s = Number(a.surah_number);
        const ay = Number(a.ayat_number);
        return s === verseSearch.surah && ay >= minA && ay <= maxA;
      });
    } else if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const activeLecNames = activeLecture ? getLectureAllNames(activeLecture.lecture_name) : [];
      const matchesActiveLecTitle = activeLecNames.some((n) => n.toLowerCase().includes(q));

      // If active lecture title matches search term, keep all verses in this lecture!
      if (!matchesActiveLecTitle) {
        list = list.filter((a) => {
          const sName = (a.surah_name || "").toLowerCase();
          const eng = (a.english_translation || "").toLowerCase();
          const urdu = (a.urdu_translation || "").toLowerCase();
          const arab = (a.arabic_text || "").toLowerCase();
          const notes = (a.points_notes_eng || a.points_notes_urdu || a.points_notes || "").toLowerCase();
          const qText = (a.question_text || "").toLowerCase();
          const sNum = String(a.surah_number);
          const aNum = String(a.ayat_number);

          // Support matching lecture aliases if attached
          const aLecNames = getLectureAllNames(a.lecture_name || a.lecture_names);
          const matchesLec = aLecNames.some((n) => n.toLowerCase().includes(q));

          return (
            sName.includes(q) ||
            eng.includes(q) ||
            urdu.includes(q) ||
            arab.includes(q) ||
            notes.includes(q) ||
            qText.includes(q) ||
            matchesLec ||
            sNum === q ||
            aNum === q
          );
        });
      }
    }

    // 5. Excel-Style Sorting
    list.sort((a, b) => {
      const sA = Number(a.surah_number);
      const sB = Number(b.surah_number);
      const ayA = Number(a.ayat_number);
      const ayB = Number(b.ayat_number);

      if (sortField === "SURAH_ASC") {
        if (sA !== sB) return sA - sB;
        return ayA - ayB;
      }
      if (sortField === "SURAH_DESC") {
        if (sA !== sB) return sB - sA;
        return ayA - ayB;
      }
      if (sortField === "AYAT_ASC") {
        if (ayA !== ayB) return ayA - ayB;
        return sA - sB;
      }
      if (sortField === "AYAT_DESC") {
        if (ayA !== ayB) return ayB - ayA;
        return sA - sB;
      }
      if (sA !== sB) return sA - sB;
      return ayA - ayB;
    });

    return list;
  };

  // Global map indexing all unique occurrences of every verse merged by Lecture across Categories & languages
  const verseCitationsMap = useMemo(() => {
    const rawMap = new Map();
    if (!Array.isArray(metaCategories)) return new Map();

    metaCategories.forEach((cat) => {
      const catLang = (cat.language || "eng").toLowerCase();
      const lectures = cat.lectures || [];

      lectures.forEach((lec) => {
        const ayats = lec.ayat_references || [];
        ayats.forEach((ayat) => {
          if (!isValidQuranicVerse(ayat)) return;
          const key = `${ayat.surah_number}:${ayat.ayat_number}`;

          if (!rawMap.has(key)) {
            rawMap.set(key, new Map());
          }

          const verseLecturesMap = rawMap.get(key);
          const lecKey = `${catLang}_${String(cat._id || cat.category_id || "")}_${String(lec._id || lec.lecture_id || "")}`;
          const vList = getAyatVideoList(ayat);

          if (!verseLecturesMap.has(lecKey)) {
            verseLecturesMap.set(lecKey, {
              category_id: String(cat._id || cat.category_id || ""),
              category_name: cat.category_name || "General Category",
              language: catLang,
              lecture_id: String(lec._id || lec.lecture_id || ""),
              lecture_number: lec.lecture_id,
              lecture_name: getLectureName(lec.lecture_name),
              lecture_names: getLectureAllNames(lec.lecture_name),
              season: lec.season || "",
              episode: lec.episode || "",
              year_delivered: lec.year_delivered || "",
              video_urls: [...vList],
              video_url: vList[0] || "",
              notesList: ayat.points_notes_eng || ayat.points_notes_urdu || ayat.points_notes ? [ayat.points_notes_eng || ayat.points_notes_urdu || ayat.points_notes] : [],
              questionsList: ayat.question_text ? [ayat.question_text] : [],
              points_notes: ayat.points_notes_eng || ayat.points_notes_urdu || ayat.points_notes || "",
              question_text: ayat.question_text || "",
              quest_answer: ayat.quest_answer || false,
              ayat_image_eng_url: ayat.ayat_image_eng_url || "",
              ayat_image_urdu_url: ayat.ayat_image_urdu_url || "",
              ayat_image_hindi_url: ayat.ayat_image_hindi_url || "",
            });
          } else {
            // MERGE into existing lecture citation (show lecture ONCE, combine all clips)
            const existing = verseLecturesMap.get(lecKey);

            // Merge video URLs avoiding duplicates
            vList.forEach((u) => {
              if (u && !existing.video_urls.includes(u)) {
                existing.video_urls.push(u);
              }
            });
            if (!existing.video_url && existing.video_urls.length > 0) {
              existing.video_url = existing.video_urls[0];
            }

            // Merge notes
            const n = ayat.points_notes_eng || ayat.points_notes_urdu || ayat.points_notes;
            if (n && !existing.notesList.includes(n)) {
              existing.notesList.push(n);
              existing.points_notes = existing.notesList.join(" • ");
            }

            // Merge questions
            if (ayat.question_text && !existing.questionsList.includes(ayat.question_text)) {
              existing.questionsList.push(ayat.question_text);
              existing.question_text = existing.questionsList.join(" • ");
            }

            // Merge images if missing
            if (!existing.ayat_image_eng_url && ayat.ayat_image_eng_url) existing.ayat_image_eng_url = ayat.ayat_image_eng_url;
            if (!existing.ayat_image_urdu_url && ayat.ayat_image_urdu_url) existing.ayat_image_urdu_url = ayat.ayat_image_urdu_url;
            if (!existing.ayat_image_hindi_url && ayat.ayat_image_hindi_url) existing.ayat_image_hindi_url = ayat.ayat_image_hindi_url;
          }
        });
      });
    });

    const resultMap = new Map();
    rawMap.forEach((lecMap, verseKey) => {
      resultMap.set(verseKey, Array.from(lecMap.values()));
    });

    return resultMap;
  }, [metaCategories]);

  // Verses inside current active lecture
  const currentLectureVerses = useMemo(() => {
    if (!activeLecture) return [];
    const raw = activeLecture.ayat_references || [];
    return processAndSortAyats(raw);
  }, [activeLecture, filterSurah, filterAyat, searchQuery, sortField]);

  // 114-Chapter Sequence Concordance (strictly 1 to 114)
  const chapterConcordance = useMemo(() => {
    const verseMap = new Map();

    metaCategories.forEach((cat) => {
      const catLang = (cat.language || "eng").toLowerCase();
      if (activeLanguage !== "all" && catLang !== activeLanguage.toLowerCase()) return;

      const lectures = cat.lectures || [];
      lectures.forEach((lec) => {
        const ayats = lec.ayat_references || [];
        ayats.forEach((ayat) => {
          if (!isValidQuranicVerse(ayat)) return;

          const key = `${ayat.surah_number}:${ayat.ayat_number}`;

          if (!verseMap.has(key)) {
            verseMap.set(key, {
              key,
              surah_number: Number(ayat.surah_number),
              surah_name: ayat.surah_name || `Surah ${ayat.surah_number}`,
              ayat_number: Number(ayat.ayat_number),
              arabic_text: ayat.arabic_text || "",
              english_translation: ayat.english_translation || "",
              urdu_translation: ayat.urdu_translation || "",
              hindi_translation: ayat.hindi_translation || "",
              points_notes_eng: ayat.points_notes_eng || "",
              points_notes_urdu: ayat.points_notes_urdu || "",
              question_text: ayat.question_text || "",
              quest_answer: ayat.quest_answer || false,
              video_urls: getAyatVideoList(ayat),
              video_url_eng: ayat.video_url_eng || ayat.youtube_url_eng || "",
              video_url_urdu: ayat.video_url_urdu || ayat.youtube_url_urdu || "",
              occurrences: [],
            });
          }

          const existing = verseMap.get(key);
          const vList = getAyatVideoList(ayat);
          const lecKey = `${catLang}_${String(cat._id || cat.category_id)}_${String(lec._id || lec.lecture_id)}`;
          const existingOcc = existing.occurrences.find((o) => o.key === lecKey);

          if (!existingOcc) {
            existing.occurrences.push({
              key: lecKey,
              category_id: String(cat._id || cat.category_id),
              category_name: cat.category_name,
              language: catLang,
              lecture_id: String(lec._id || lec.lecture_id),
              lecture_number: lec.lecture_id,
              lecture_name: getLectureName(lec.lecture_name),
              lecture_names: getLectureAllNames(lec.lecture_name),
              season: lec.season || "",
              episode: lec.episode || "",
              year_delivered: lec.year_delivered,
              video_url: vList[0] || "",
              video_urls: [...vList],
              points_notes:
                ayat.points_notes_eng || ayat.points_notes_urdu || ayat.points_notes || "",
            });
          } else {
            vList.forEach((u) => {
              if (u && !existingOcc.video_urls.includes(u)) {
                existingOcc.video_urls.push(u);
              }
            });
          }
        });
      });
    });

    let allVerses = Array.from(verseMap.values());
    allVerses = processAndSortAyats(allVerses);

    // Group by Surah Number (1 to 114)
    const groupedBySurah = new Map();
    allVerses.forEach((verse) => {
      const sNum = verse.surah_number;
      if (!groupedBySurah.has(sNum)) {
        const sObj = SURAH_LIST.find((s) => Number(s.value) === sNum);
        groupedBySurah.set(sNum, {
          surah_number: sNum,
          surah_name: sObj ? sObj.label : verse.surah_name || `Surah ${sNum}`,
          verses: [],
        });
      }
      groupedBySurah.get(sNum).verses.push(verse);
    });

    return Array.from(groupedBySurah.values());
  }, [metaCategories, activeLanguage, filterSurah, filterAyat, searchQuery, sortField]);

  // Click on any verse row to open Modal & fetch Arabic from Quran API proxy
  const handleOpenAyatModal = async (verse) => {
    const cKey = `${verse.surah_number}:${verse.ayat_number}`;
    const citations = verse.citations || verseCitationsMap.get(cKey) || [];
    setActiveAyatModal({ ...verse, citations });
    setLiveArabicText(verse.arabic_text || "");

    if (verse.surah_number && verse.ayat_number) {
      setIsFetchingLiveArabic(true);
      try {
        const liveData = await fetchQuranVerseFromProxy(
          verse.surah_number,
          verse.ayat_number
        );
        if (liveData && liveData.arabic) {
          setLiveArabicText(liveData.arabic);
        }
      } catch (err) {
        console.warn("Could not fetch live Arabic text, using stored text:", err);
      } finally {
        setIsFetchingLiveArabic(false);
      }
    }
  };

  // Format verse reference as Surah#:Ayat# e.g. 02:15, 02:127
  const formatVerseRef = (surah, ayat) => {
    const s = String(surah || 0).padStart(2, "0");
    const a = String(ayat || 0).padStart(2, "0");
    return `${s}:${a}`;
  };

  return (
    <Container size="xl" py="lg">
      <style>{`
        /* 3D Notebook Canvas */
        .notebook-wrapper {
          perspective: 1400px;
          perspective-origin: 50% 50%;
        }
        .notebook-book-3d {
          position: relative;
          display: flex;
          flex-direction: row;
          border-radius: 20px;
          overflow: hidden;
          background: ${isDark ? "#1a1b1e" : "#f8fafc"};
          box-shadow: 
            0 25px 60px -15px rgba(0, 0, 0, 0.35),
            0 12px 25px -10px rgba(0, 0, 0, 0.2),
            0 0 0 1px ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"},
            inset 0 2px 0 rgba(255, 255, 255, 0.85);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        /* Floating Orbital Action Icon Container */
        .lecture-chip-wrapper {
          position: relative;
          display: inline-block;
        }
        .lecture-orbital-bar {
          position: absolute;
          top: -38px;
          left: 50%;
          transform: translateX(-50%) scale(0.75);
          opacity: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 50;
        }
        .lecture-chip-wrapper:hover .lecture-orbital-bar {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(-6px) scale(1);
        }
        .orbital-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          transition: transform 0.18s ease, filter 0.18s ease;
        }
        .orbital-btn:hover {
          transform: scale(1.22);
          filter: brightness(1.15);
        }

        /* Interactive Lecture Tab Chip */
        .lecture-binder-tab {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid #d1d5db;
          cursor: pointer;
          background: #ffffff;
          color: #374151;
        }
        .lecture-binder-tab:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(79, 70, 229, 0.22);
          border-color: #4f46e5 !important;
          background: linear-gradient(180deg, #ffffff 0%, #eef2ff 100%) !important;
          color: #4338ca !important;
        }
        .lecture-binder-tab.active {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
          color: #ffffff !important;
          border-color: #4338ca !important;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
        }

        /* Excel-like Grid Rows */
        .excel-row {
          transition: background-color 0.15s ease, transform 0.15s ease;
          cursor: pointer;
        }
        .excel-row:hover {
          background-color: ${isDark ? "#1e293b" : "#f0f7ff"} !important;
        }

        .excel-table th {
          background-color: ${isDark ? "#0f172a" : "#f1f5f9"} !important;
          color: ${isDark ? "#e2e8f0" : "#334155"} !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          user-select: none;
          padding: 10px 12px !important;
          border-bottom: 2px solid ${isDark ? "#334155" : "#cbd5e1"} !important;
        }

        .excel-table td {
          padding: 9px 12px !important;
          border-bottom: 1px solid ${isDark ? "#1e293b" : "#e2e8f0"} !important;
          vertical-align: middle;
        }

        /* Calligraphy */
        .arabic-calligraphy {
          font-family: 'Amiri', 'Traditional Arabic', 'Scheherazade New', 'Lateef', serif;
          direction: rtl;
          text-align: right;
          line-height: 1.8;
        }
        .urdu-calligraphy {
          font-family: 'Nafees', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif;
          direction: rtl;
          text-align: right;
        }

        /* 3D Real PDF Icon Button */
        .pdf-3d-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(180deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
          color: #ffffff !important;
          font-weight: 800;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 12px;
          border: 1px solid #b91c1c;
          border-bottom: 3.5px solid #7f1d1d;
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.12s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
          outline: none;
        }
        .pdf-3d-btn:hover {
          background: linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%);
          box-shadow: 0 6px 14px rgba(220, 38, 38, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.65);
          transform: translateY(-1.5px);
        }
        .pdf-3d-btn:active {
          transform: translateY(2.5px);
          border-bottom: 1px solid #7f1d1d;
          box-shadow: 0 1px 3px rgba(220, 38, 38, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .pdf-badge-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          color: #dc2626;
          font-weight: 900;
          font-size: 9px;
          letter-spacing: 0.5px;
          padding: 2px 5px;
          border-radius: 5px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
          line-height: 1;
        }

        /* 3D Circular Reaction Button & Cute Floating Aura Popover */
        .circular-like-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid;
          border-bottom: 3px solid rgba(0, 0, 0, 0.18);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          position: relative;
          user-select: none;
        }
        .circular-like-btn:hover {
          transform: translateY(-2px) scale(1.08);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15) !important;
        }
        .circular-like-btn:active {
          transform: translateY(2px) scale(0.96);
          border-bottom-width: 1px;
        }

        .reaction-aura-popover {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: ${isDark ? "#1e1f23" : "#ffffff"};
          border-radius: 30px;
          box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.3), 0 4px 8px -2px rgba(0, 0, 0, 0.15);
          border: 1px solid ${isDark ? "#374151" : "#e2e8f0"};
          z-index: 1000;
          animation: popReactionIn 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popReactionIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px) scale(0.65);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .cute-reaction-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          outline: none;
        }
        .cute-reaction-btn:hover {
          transform: scale(1.35) translateY(-3px) !important;
          z-index: 10;
        }
        .cute-reaction-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .cute-reaction-btn:hover .cute-reaction-tooltip {
          opacity: 1;
        }
      `}</style>

      {/* Top Header Banner */}
      <Group justify="space-between" align="center" mb="md" px="xs">
        <Group gap="md">
          <Box
            style={{
              width: 50,
              height: 50,
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #059669 100%)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 6px 18px rgba(37, 99, 235, 0.4)",
            }}
          >
            <IconBook size={28} />
          </Box>
          <div>
            <Group gap="xs">
              <Title order={2} c={isDark ? "white" : "dark.8"} style={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                Quran Lecture Index Notebook
              </Title>
              <Badge variant="gradient" gradient={{ from: "indigo", to: "teal" }} size="sm">
                Excel Tabular Reference
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Choose Language Tag ➔ Pick Category ➔ Select Lecture ➔ Browse Tabular Verses with Live Quran API & Video Clips.
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { value: "NOTEBOOK", label: "📖 Category & Lecture Index" },
              { value: "CONCORDANCE", label: "📜 114-Surah Sequence" },
            ]}
            color="indigo"
            radius="xl"
            size="xs"
          />

          <ActionIcon variant="default" radius="xl" size={36} onClick={() => toggleColorScheme()} title="Toggle theme">
            {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
          </ActionIcon>

          <ActionIcon variant="default" radius="xl" size={36} onClick={() => window.print()} title="Print Notebook">
            <IconPrinter size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Top Aligned Search, Filter & Language Tags Bar */}
      <Paper p="sm" radius="lg" withBorder mb="lg" shadow="xs" style={{ background: isDark ? "#25262b" : "#ffffff" }}>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          {/* Prominent Language Tags */}
          <div>
            <Text size="11px" fw={700} c="dimmed" mb={4}>
              SELECT LANGUAGE:
            </Text>
            <Group gap={6}>
              {[
                { id: "eng", label: "📘 English", count: metaCategories.filter((c) => (c.language || "eng").toLowerCase() === "eng").length },
                { id: "urdu", label: "📗 Urdu", count: metaCategories.filter((c) => (c.language || "eng").toLowerCase() === "urdu").length },
                { id: "hindi", label: "📙 Hindi", count: metaCategories.filter((c) => (c.language || "eng").toLowerCase() === "hindi").length },
              ].map((lang) => {
                const isSelected = activeLanguage === lang.id;
                return (
                  <Button
                    key={lang.id}
                    size="xs"
                    radius="xl"
                    onClick={() => handleLanguageChange(lang.id)}
                    style={{
                      backgroundColor: isSelected ? "#facc15" : isDark ? "#374151" : "#f1f5f9",
                      color: isSelected ? "#000000" : isDark ? "#f3f4f6" : "#4b5563",
                      fontWeight: isSelected ? 800 : 600,
                      boxShadow: isSelected ? "0 4px 12px rgba(250, 204, 21, 0.45)" : "none",
                      border: isSelected ? "2px solid #ca8a04" : "1px solid #d1d5db",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {lang.label} ({lang.count})
                  </Button>
                );
              })}
            </Group>
          </div>

          {/* Search Input: Supports SurahNumber:ayatnumber (e.g. 2:53) or Range (e.g. 2:50-60) */}
          <TextInput
            placeholder="Search keyword, or Surah#:Ayat# (e.g. 2:53 or 2:50-60)..."
            leftSection={<IconSearch size={15} color="var(--mantine-color-dimmed)" />}
            rightSection={
              searchQuery ? (
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchQuery("")}>
                  <IconX size={12} />
                </ActionIcon>
              ) : null
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: 260, flex: 1.5 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Surah Filter"
            placeholder="All 114 Surahs"
            data={SURAH_LIST}
            clearable
            searchable
            value={filterSurah}
            onChange={(val) => {
              setFilterSurah(val || "");
              setFilterAyat("");
            }}
            style={{ width: 175 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Ayat Filter"
            placeholder={filterSurah ? "Ayat..." : "Pick Surah"}
            disabled={!filterSurah}
            data={filterAyatOptions}
            clearable
            searchable
            value={filterAyat}
            onChange={(val) => setFilterAyat(val || "")}
            style={{ width: 105 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Sort By"
            data={[
              { value: "SURAH_THEN_AYAT", label: "Surah then Ayat (Asc)" },
              { value: "SURAH_ASC", label: "Surah Number (1 ➔ 114)" },
              { value: "SURAH_DESC", label: "Surah Number (114 ➔ 1)" },
              { value: "AYAT_ASC", label: "Ayat Number (1 ➔ N)" },
              { value: "AYAT_DESC", label: "Ayat Number (N ➔ 1)" },
            ]}
            value={sortField}
            onChange={(val) => setSortField(val || "SURAH_THEN_AYAT")}
            style={{ width: 180 }}
            radius="md"
            size="xs"
          />

          {hasActiveFilters && (
            <Button variant="light" color="gray" size="xs" radius="md" leftSection={<IconX size={14} />} onClick={handleClearFilters}>
              Clear
            </Button>
          )}
        </Group>
      </Paper>

      {/* 3D NOTEBOOK CANVAS */}
      <div className="notebook-wrapper">
        <Card padding={0} radius="xl" withBorder className="notebook-book-3d">
          {/* Left Spiral Spine */}
          <NotebookSpine />

          {/* Central Main Binder Page */}
          <Box
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: isDark ? "#1e1f23" : "#ffffff",
              minHeight: 650,
            }}
          >
            {/* Top Binder Tabs (Lectures with Floating Orbital Action Icons) */}
            {viewMode === "NOTEBOOK" && (
              <Group
                justify="space-between"
                px="md"
                py="xs"
                style={{
                  borderBottom: isDark ? "1px solid #2c2e33" : "1px solid #eef2f6",
                  background: isDark ? "#141517" : "#f8fafc",
                }}
              >
                <Group gap="sm" style={{ flexWrap: "wrap", flex: 1, padding: "8px 0" }}>
                  {activeLectures.length === 0 ? (
                    <Text size="xs" c="dimmed">
                      No lectures found in this category.
                    </Text>
                  ) : (
                    activeLectures.map((lec, idx) => {
                      const count =
                        lec.total_ayats ||
                        lec.ayat_count ||
                        (lec.ayat_references ? lec.ayat_references.filter(isValidQuranicVerse).length : 0);
                      const isSelected = activeLectureIndex === idx;
                      const isLiked = !!likedMap[lec._id || lec.lecture_id];

                      return (
                        <div key={lec._id || idx} className="lecture-chip-wrapper">
                          {/* FLOATING ACTION ORBITAL POPOVER ICONS ON HOVER */}
                          <div className="lecture-orbital-bar">
                            {/* Watch Video Button */}
                            <button
                              type="button"
                              onClick={(e) => openActionModal("video", lec, e)}
                              title="Watch Lecture Video"
                              className="orbital-btn"
                              style={{ backgroundColor: "#dc2626" }}
                            >
                              <Play size={13} fill="currentColor" style={{ marginLeft: 2 }} />
                            </button>

                            {/* View PDF Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const pUrl =
                                  lec.pdf_link ||
                                  (Array.isArray(lec.pdf_booklet_urls) ? lec.pdf_booklet_urls[0] : "") ||
                                  lec.pdf_url;
                                if (pUrl) {
                                  window.open(pUrl, "_blank", "noopener,noreferrer");
                                } else {
                                  openActionModal("pdf", lec, e);
                                }
                              }}
                              title="View PDF Booklet & Notes"
                              className="orbital-btn"
                              style={{ backgroundColor: "#059669" }}
                            >
                              <FileText size={13} />
                            </button>

                            {/* Linked Quran Verses Button */}
                            <button
                              type="button"
                              onClick={(e) => openActionModal("verses", lec, e)}
                              title={`View ${count} Quran Verses`}
                              className="orbital-btn"
                              style={{ backgroundColor: "#d97706" }}
                            >
                              <BookOpen size={13} />
                            </button>

                            {/* Seasons & Episodes Button */}
                            <button
                              type="button"
                              onClick={(e) => openActionModal("episodes", lec, e)}
                              title="Seasons & Episodes Breakdown"
                              className="orbital-btn"
                              style={{ backgroundColor: "#4f46e5" }}
                            >
                              <Layers size={13} />
                            </button>

                            {/* Like / Bookmark Toggle */}
                            <button
                              type="button"
                              onClick={(e) => handleLikeToggle(lec._id || lec.lecture_id, e)}
                              title={isLiked ? "Unlike" : "Like Lecture"}
                              className="orbital-btn"
                              style={{ backgroundColor: isLiked ? "#db2777" : "#475569" }}
                            >
                              <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
                            </button>
                          </div>

                          {/* The Pill / Chip Button */}
                          <button
                            type="button"
                            className={`lecture-binder-tab ${isSelected ? "active" : ""}`}
                            onClick={() => handleLectureChange(idx)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            <span style={{ fontWeight: isSelected ? 800 : 600 }}>
                              Lec {lec.lecture_id}: {getLectureName(lec.lecture_name)}
                            </span>
                            {getLectureAliases(lec.lecture_name).length > 0 && (
                              <span
                                title={`Also known as: ${getLectureAliases(lec.lecture_name).join(", ")}`}
                                style={{
                                  fontSize: "9px",
                                  background: isSelected ? "rgba(255,255,255,0.25)" : isDark ? "rgba(99,102,241,0.25)" : "#e0e7ff",
                                  color: isSelected ? "#ffffff" : "#4338ca",
                                  padding: "1px 5px",
                                  borderRadius: "6px",
                                  fontWeight: 700,
                                }}
                              >
                                AKA: {getLectureAliases(lec.lecture_name)[0]}
                              </span>
                            )}
                            <span
                              style={{
                                background: isSelected ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                                color: isSelected ? "#ffffff" : "#475569",
                                padding: "2px 7px",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: 700,
                              }}
                            >
                              {count} ayats
                            </span>

                            {isLiked && (
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  backgroundColor: "#ec4899",
                                }}
                              />
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </Group>

                {activeLecture && (
                  <Text size="xs" c="dimmed" fs="italic" style={{ whiteSpace: "nowrap" }}>
                    Active:{" "}
                    <Text span fw={800} c="indigo.6">
                      Lec {activeLecture.lecture_id}
                    </Text>{" "}
                    • {currentLectureVerses.length} Quran Verses
                  </Text>
                )}
              </Group>
            )}

            {/* Middle Page Body */}
            <Box
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                position: "relative",
              }}
            >
              <Box
                style={{
                  flex: 1,
                  padding: "20px 24px",
                  maxHeight: 720,
                  overflowY: "auto",
                }}
              >
                {isLoading ? (
                  <Stack align="center" justify="center" py="xl" style={{ minHeight: 300 }}>
                    <Loader size="md" color="indigo" />
                    <Text size="sm" c="dimmed">
                      Loading Quran Lecture Index...
                    </Text>
                  </Stack>
                ) : (
                  <>
                    {/* SELECTED LECTURE SHOWCASE DASHBOARD (Before the Ayat Grid) */}
                    {activeCategory && activeLecture && viewMode === "NOTEBOOK" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "16px",
                          marginBottom: "20px",
                        }}
                      >
                        {/* Main Lecture Info Card (Left) */}
                        <Paper
                          p="md"
                          radius="lg"
                          withBorder
                          style={{
                            gridColumn: "span 2",
                            background: isDark ? "#141517" : "#ffffff",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <Group justify="space-between" align="flex-start" mb="sm">
                              <div>
                                <Group gap={6} mb={4}>
                                  <Text size="11px" fw={700} c="indigo.6" tt="uppercase" style={{ letterSpacing: 0.5 }}>
                                    {activeCategory.category_name}
                                  </Text>
                                  <Text size="11px" c="dimmed">•</Text>
                                  <Badge size="xs" variant="light" color="indigo">
                                    {currentSeason ? currentSeason.season_name : "Lecture Series"}
                                  </Badge>
                                  {activeLecture.year_delivered && (
                                    <>
                                      <Text size="11px" c="dimmed">•</Text>
                                      <Text size="11px" c="dimmed">
                                        Year {activeLecture.year_delivered}
                                      </Text>
                                    </>
                                  )}
                                </Group>

                                <Title order={3} style={{ fontWeight: 800, fontSize: "1.3rem", color: isDark ? "#ffffff" : "#1e293b" }}>
                                  Lec {activeLecture.lecture_id}: {getLectureName(activeLecture.lecture_name)}
                                </Title>
                                {getLectureAliases(activeLecture.lecture_name).length > 0 && (
                                  <Group gap={6} mt={6}>
                                    <Text size="xs" c="dimmed" fw={700}>
                                      Also Known As:
                                    </Text>
                                    {getLectureAliases(activeLecture.lecture_name).map((alias, aIdx) => (
                                      <Badge key={aIdx} size="sm" variant="light" color="indigo">
                                        {alias}
                                      </Badge>
                                    ))}
                                  </Group>
                                )}
                              </div>

                              <Group gap="sm" align="center">
                                {/* 3D Circular Reaction Button with 4 Cute Floating Icons */}
                                <div style={{ position: "relative", display: "inline-block" }}>
                                  {openReactionLectureId === (activeLecture._id || activeLecture.lecture_id) && (
                                    <>
                                      {/* Click outside backdrop */}
                                      <div
                                        style={{ position: "fixed", inset: 0, zIndex: 998 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenReactionLectureId(null);
                                        }}
                                      />
                                      {/* The 4 Cute Small Icons popping all around */}
                                      <div className="reaction-aura-popover">
                                        {CUTE_REACTIONS.map((r) => {
                                          const IconComp = r.icon;
                                          const isCurrent = likedMap[activeLecture._id || activeLecture.lecture_id]?.id === r.id;
                                          return (
                                            <button
                                              key={r.id}
                                              type="button"
                                              className="cute-reaction-btn"
                                              onClick={(e) => handleSelectReaction(activeLecture._id || activeLecture.lecture_id, r, e)}
                                              title={`${r.label} (${r.emoji})`}
                                              style={{
                                                backgroundColor: r.bg,
                                                color: r.color,
                                                borderColor: isCurrent ? r.color : "transparent",
                                                boxShadow: `0 4px 10px ${r.glow}`,
                                                transform: isCurrent ? "scale(1.2)" : "scale(1)",
                                              }}
                                            >
                                              <IconComp size={15} fill={r.fill || isCurrent ? "currentColor" : "none"} />
                                              <span className="cute-reaction-tooltip">{r.label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    className="circular-like-btn"
                                    onClick={(e) => handleCircularLikeClick(activeLecture._id || activeLecture.lecture_id, e)}
                                    title={
                                      likedMap[activeLecture._id || activeLecture.lecture_id]
                                        ? `Reacted: ${likedMap[activeLecture._id || activeLecture.lecture_id]?.label || "Liked"} (Click to change)`
                                        : "Click to react with love, hear, thumb, spread"
                                    }
                                    style={{
                                      backgroundColor: likedMap[activeLecture._id || activeLecture.lecture_id]?.bg || (isDark ? "#2c2e33" : "#f8fafc"),
                                      color: likedMap[activeLecture._id || activeLecture.lecture_id]?.color || (isDark ? "#94a3b8" : "#64748b"),
                                      borderColor: likedMap[activeLecture._id || activeLecture.lecture_id]?.color || (isDark ? "#3f444e" : "#cbd5e1"),
                                      boxShadow: likedMap[activeLecture._id || activeLecture.lecture_id]
                                        ? `0 4px 12px ${likedMap[activeLecture._id || activeLecture.lecture_id]?.glow || "rgba(219,39,119,0.35)"}`
                                        : "0 3px 6px rgba(0,0,0,0.06)",
                                    }}
                                  >
                                    {(() => {
                                      const rec = likedMap[activeLecture._id || activeLecture.lecture_id];
                                      if (!rec) return <Heart size={16} />;
                                      const IconComp = rec.icon || Heart;
                                      return typeof IconComp === "function" ? (
                                        <IconComp size={16} fill={rec.fill ? "currentColor" : "none"} />
                                      ) : (
                                        <span style={{ fontSize: 16 }}>{rec.emoji || "❤️"}</span>
                                      );
                                    })()}
                                  </button>
                                </div>

                                {/* 3D Real PDF Icon Button with tactile click feel */}
                                <button
                                  type="button"
                                  className="pdf-3d-btn"
                                  onClick={() => {
                                    const pdfUrl =
                                      activeLecture.pdf_link ||
                                      (Array.isArray(activeLecture.pdf_booklet_urls) ? activeLecture.pdf_booklet_urls[0] : "") ||
                                      activeLecture.pdf_url;
                                    if (pdfUrl) {
                                      window.open(pdfUrl, "_blank", "noopener,noreferrer");
                                    } else {
                                      openActionModal("pdf", activeLecture);
                                    }
                                  }}
                                  title="View Official PDF Booklet & Study Notes"
                                >
                                  <span className="pdf-badge-icon">PDF</span>
                                  <span>
                                    {activeLecture.pdf_link || activeLecture.pdf_booklet_urls?.length ? "PDF Booklet" : "Lecture Notes & PDF"}
                                  </span>
                                  <Download size={13} style={{ opacity: 0.9 }} />
                                </button>
                              </Group>
                            </Group>

                            {/* Lecture Stats Badges */}
                            <Group gap="xs" mt="md">
                              <Badge color="blue" variant="light" size="sm" leftSection={<BookOpen size={12} />}>
                                {currentLectureVerses.length} Quran Verses Linked
                              </Badge>
                              <Badge color="violet" variant="light" size="sm" leftSection={<Layers size={12} />}>
                                {seasonsList.length} Season(s) • {episodesList.length} Episodes
                              </Badge>
                              {activeLecture.year_delivered && (
                                <Badge color="gray" variant="light" size="sm">
                                  Year: {activeLecture.year_delivered}
                                </Badge>
                              )}
                            </Group>
                          </div>

                          {/* Full lecture video quick link if available */}
                          {(activeLecture.full_lecture_video_url || (activeLecture.video_urls && activeLecture.video_urls.length > 0)) && (
                            <Group justify="space-between" align="center" mt="md" p="xs" style={{ background: isDark ? "#1e1f23" : "#f8fafc", borderRadius: 8 }}>
                              <Text size="xs" c="dimmed">
                                Full lecture recording is available to watch:
                              </Text>
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="light"
                                leftSection={<Play size={11} fill="currentColor" />}
                                onClick={() => {
                                  const vUrl =
                                    activeLecture.full_lecture_video_url ||
                                    (activeLecture.video_urls && activeLecture.video_urls[0]) ||
                                    "";
                                  if (vUrl) {
                                    setActiveVideoModal({
                                      title: `${getLectureName(activeLecture.lecture_name)} - Full Recording`,
                                      url: vUrl,
                                    });
                                  }
                                }}
                              >
                                Stream Full Lecture
                              </Button>
                            </Group>
                          )}
                        </Paper>

                        {/* Season & Episodes List Panel (Right) */}
                        <Paper
                          p="md"
                          radius="lg"
                          withBorder
                          style={{
                            background: isDark ? "#141517" : "#ffffff",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <Group justify="space-between" align="center" mb={8}>
                              <Group gap={6}>
                                <List size={16} color="#4f46e5" />
                                <Text size="sm" fw={800}>Season & Episodes</Text>
                              </Group>

                              {/* Season Selector / Badges if multiple seasons */}
                              {seasonsList.length > 1 ? (
                                <Group gap={4}>
                                  {seasonsList.map((s, sIdx) => {
                                    const isCurrent = activeSeasonIndex === sIdx;
                                    return (
                                      <Button
                                        key={sIdx}
                                        size="compact-xs"
                                        radius="xl"
                                        variant={isCurrent ? "filled" : "light"}
                                        color="indigo"
                                        onClick={() => setActiveSeasonIndex(sIdx)}
                                        style={{ fontSize: 10, fontWeight: 700 }}
                                      >
                                        {s.season_name || `Season ${sIdx + 1}`}
                                      </Button>
                                    );
                                  })}
                                </Group>
                              ) : seasonsList.length === 1 ? (
                                <Badge size="xs" variant="light" color="indigo">
                                  {seasonsList[0].season_name || "Season 1"}
                                </Badge>
                              ) : null}
                            </Group>

                            <Text size="11px" c="dimmed" mb="xs">
                              {currentSeason
                                ? `${currentSeason.season_name} • ${episodesList.length} episodes available`
                                : "Episodes and recorded parts in this lecture series:"}
                            </Text>

                            {episodesList.length === 0 ? (
                              <Paper p="sm" radius="md" withBorder ta="center" style={{ background: isDark ? "#1e1f23" : "#f8fafc" }}>
                                <Text size="xs" c="dimmed">
                                  No video episodes uploaded yet for this lecture.
                                </Text>
                              </Paper>
                            ) : (
                              <Stack gap={6} style={{ maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                                {episodesList.map((ep, idx) => (
                                  <Paper
                                    key={ep.id || idx}
                                    p="xs"
                                    radius="md"
                                    withBorder
                                    onClick={() => {
                                      const epUrl = ep.episode_url || ep.videoUrl || ep.video_url;
                                      if (epUrl) {
                                        setActiveVideoModal({
                                          title: `${getLectureName(activeLecture.lecture_name)} - ${ep.episode_title || ep.title || `Episode ${idx + 1}`}`,
                                          url: epUrl,
                                        });
                                      }
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      background: idx === 0 ? (isDark ? "#1e1b4b33" : "#eef2ff") : "transparent",
                                      borderColor: idx === 0 ? "#6366f1" : undefined,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "7px 10px",
                                      transition: "all 0.15s ease",
                                    }}
                                    className="hover:scale-[1.01]"
                                  >
                                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          width: 22,
                                          height: 22,
                                          borderRadius: "50%",
                                          backgroundColor: "#4f46e5",
                                          color: "white",
                                          fontSize: 10,
                                          fontWeight: 800,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {idx + 1}
                                      </div>
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <Text size="xs" fw={700} lineClamp={1} style={{ maxWidth: 200 }}>
                                          {ep.episode_title || ep.title || ep.episode_number || `Episode ${idx + 1}`}
                                        </Text>
                                        <Text size="9px" c="dimmed">
                                          {ep.episode_number ? `${ep.episode_number} • ` : ""}
                                          {ep.duration || "Watch Episode"}
                                        </Text>
                                      </div>
                                    </Group>
                                    <ActionIcon size="sm" variant="subtle" color="indigo">
                                      <Play size={13} fill="currentColor" />
                                    </ActionIcon>
                                  </Paper>
                                ))}
                              </Stack>
                            )}
                          </div>

                          {/* Pro Tip Box */}
                          <Paper
                            p="xs"
                            radius="md"
                            mt="xs"
                            style={{
                              background: isDark ? "#1e1f23" : "#f0fdf4",
                              border: `1px solid ${isDark ? "#2c2e33" : "#bbf7d0"}`,
                            }}
                          >
                            <Group gap={6} mb={2}>
                              <Sparkles size={13} color="#059669" />
                              <Text size="10px" fw={800} c="teal.8">
                                Pro Tip
                              </Text>
                            </Group>
                            <Text size="10px" c="dimmed" style={{ lineHeight: 1.4 }}>
                              Hover any chip at the top to pop out quick video, PDF, or episode controls directly!
                            </Text>
                          </Paper>
                        </Paper>
                      </div>
                    )}

                    {/* Section Header: Key Quranic References */}
                    {activeCategory && activeLecture && viewMode === "NOTEBOOK" && (
                      <Paper
                        p="xs"
                        px="md"
                        radius="md"
                        mb="sm"
                        style={{
                          background: isDark ? "#2d3748" : "#f1f5f9",
                          borderLeft: "4px solid #facc15",
                        }}
                      >
                        <Group justify="space-between" align="center">
                          <Group gap="xs">
                            <BookOpen size={16} color="#4f46e5" />
                            <Text size="xs" fw={800} tt="uppercase" c={isDark ? "white" : "dark.8"} style={{ letterSpacing: 0.5 }}>
                              Key Quranic References in this Lecture
                            </Text>
                          </Group>

                          <Badge color="teal" size="sm" variant="light">
                            {currentLectureVerses.length} Ayats
                          </Badge>
                        </Group>
                      </Paper>
                    )}

                    {/* MODE 1: EXCEL-LIKE BEAUTIFUL TABULAR INDEX */}
                    {viewMode === "NOTEBOOK" && (
                      <div>
                        {currentLectureVerses.length === 0 ? (
                          <Paper p="xl" ta="center" radius="md" withBorder>
                            <Text size="sm" c="dimmed">
                              No Quran verses cited in this lecture matching the active filters or search query.
                            </Text>
                            {parseVerseSearch(searchQuery) && (
                              <Text size="xs" c="indigo" mt="xs" fw={600}>
                                Tip: Try switching to the "📜 114-Surah Sequence" tab above to locate this verse across all lectures!
                              </Text>
                            )}
                          </Paper>
                        ) : (
                          <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                            <Table className="excel-table" highlightOnHover striped={false}>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th style={{ width: 45, textAlign: "center" }}>#</Table.Th>
                                  <Table.Th
                                    style={{ minWidth: 130, width: "1%", whiteSpace: "nowrap", cursor: "pointer" }}
                                    onClick={() => {
                                      if (sortField === "SURAH_ASC") setSortField("SURAH_DESC");
                                      else if (sortField === "SURAH_DESC") setSortField("AYAT_ASC");
                                      else if (sortField === "AYAT_ASC") setSortField("AYAT_DESC");
                                      else setSortField("SURAH_ASC");
                                    }}
                                    title="Click to toggle sort: Surah / Ayat"
                                  >
                                    <Group gap={4} wrap="nowrap">
                                      <span>Surah# : Ayat#</span>
                                      {sortField === "SURAH_ASC" && <IconSortAscending size={14} color="#2563eb" />}
                                      {sortField === "SURAH_DESC" && <IconSortDescending size={14} color="#2563eb" />}
                                      {sortField === "AYAT_ASC" && <IconSortAscending size={14} color="#059669" />}
                                      {sortField === "AYAT_DESC" && <IconSortDescending size={14} color="#059669" />}
                                      {sortField === "SURAH_THEN_AYAT" && <IconArrowsSort size={14} color="#2563eb" />}
                                      {!sortField && <IconArrowsSort size={12} color="#94a3b8" />}
                                    </Group>
                                  </Table.Th>
                                  <Table.Th style={{ minWidth: 280 }}>Translation Preview</Table.Th>
                                  <Table.Th style={{ width: 110, whiteSpace: "nowrap", textAlign: "center" }}>Video Clip(s)</Table.Th>
                                  <Table.Th style={{ width: 160, textAlign: "center", whiteSpace: "nowrap" }}>Lectures Cited & Clips</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {currentLectureVerses.map((verse, idx) => {
                                  const videoList = getAyatVideoList(verse);

                                  return (
                                    <Table.Tr
                                      key={verse._id || idx}
                                      className="excel-row"
                                      onClick={() => {
                                        const cKey = `${verse.surah_number}:${verse.ayat_number}`;
                                        const citations = verseCitationsMap.get(cKey) || [];
                                        handleOpenAyatModal({
                                          ...verse,
                                          citations,
                                          category_name: activeCategory?.category_name,
                                          lecture_name: getLectureName(activeLecture?.lecture_name),
                                        });
                                      }}
                                    >
                                      <Table.Td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                                        {idx + 1}
                                      </Table.Td>

                                      <Table.Td style={{ whiteSpace: "nowrap", width: "1%" }}>
                                        <Badge
                                          color="indigo"
                                          size="sm"
                                          variant="filled"
                                          style={{
                                            fontFamily: "monospace",
                                            fontWeight: 800,
                                            fontSize: 12,
                                            letterSpacing: "0.5px",
                                            padding: "4px 8px",
                                          }}
                                          title={`${verse.surah_name || `Surah ${verse.surah_number}`}, Ayat ${verse.ayat_number}`}
                                        >
                                          {formatVerseRef(verse.surah_number, verse.ayat_number)}
                                        </Badge>
                                      </Table.Td>

                                      <Table.Td>
                                        <Text size="xs" c="dark.7" lineClamp={2} style={{ lineHeight: 1.5 }}>
                                          {verse.english_translation || verse.urdu_translation || "Click row to view full Arabic & translation"}
                                        </Text>
                                      </Table.Td>

                                      {/* Video Clip(s) Column: 1 Video or Multi-Videos Dialogue */}
                                      <Table.Td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap", width: "1%", textAlign: "center" }}>
                                        {videoList.length === 0 ? (
                                          <Text size="10px" c="dimmed">
                                            -
                                          </Text>
                                        ) : videoList.length === 1 ? (
                                          <Button
                                            size="compact-xs"
                                            color="red"
                                            variant="light"
                                            leftSection={<Play size={11} fill="currentColor" />}
                                            onClick={() =>
                                              setActiveVideoModal({
                                                title: `${getLectureName(activeLecture.lecture_name)} - Surah ${verse.surah_number}:${verse.ayat_number}`,
                                                url: videoList[0],
                                              })
                                            }
                                          >
                                            Clip
                                          </Button>
                                        ) : (
                                          /* MULTI-VIDEO LINK ICON & DIALOGUE TRIGGER */
                                          <Button
                                            size="compact-xs"
                                            color="red"
                                            variant="filled"
                                            leftSection={<Play size={11} fill="currentColor" />}
                                            rightSection={
                                              <span
                                                style={{
                                                  background: "white",
                                                  color: "#dc2626",
                                                  borderRadius: 10,
                                                  padding: "1px 5px",
                                                  fontSize: 9,
                                                  fontWeight: 800,
                                                }}
                                              >
                                                {videoList.length}
                                              </span>
                                            }
                                            onClick={() =>
                                              setActiveMultiVideoModal({
                                                title: `${getLectureName(activeLecture.lecture_name)} - Surah ${formatVerseRef(verse.surah_number, verse.ayat_number)}`,
                                                videos: videoList,
                                                verse,
                                              })
                                            }
                                            title={`Click to pick from ${videoList.length} video links`}
                                            style={{ boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)" }}
                                          >
                                            Clips
                                          </Button>
                                        )}
                                      </Table.Td>

                                      {/* Replaces "View" with "Lectures Cited & Clips" */}
                                      <Table.Td
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textAlign: "center", whiteSpace: "nowrap", width: "1%" }}
                                      >
                                        {(() => {
                                          const cKey = `${verse.surah_number}:${verse.ayat_number}`;
                                          const citations = verseCitationsMap.get(cKey) || [];
                                          const count = citations.length || 1;
                                          const hasUrdu = citations.some((c) => c.language === "urdu");
                                          const hasEng = citations.some((c) => c.language === "eng");

                                          return (
                                            <Button
                                              size="compact-xs"
                                              variant={count > 1 ? "filled" : "light"}
                                              color={count > 1 ? "indigo" : "blue"}
                                              leftSection={<Layers size={11} />}
                                              onClick={() => setActiveCitationsModal({ verse, citations })}
                                              title={`Cited in ${count} lecture(s) across English & Urdu (Click to view lectures and clips)`}
                                              style={{
                                                fontWeight: 700,
                                                fontSize: 11,
                                                borderRadius: 12,
                                                boxShadow: count > 1 ? "0 2px 6px rgba(79, 70, 229, 0.25)" : "none",
                                              }}
                                            >
                                              {count} {count === 1 ? "Lecture" : "Lectures"}
                                              {hasEng && hasUrdu ? " (Eng & Urdu)" : hasUrdu ? " (Urdu)" : ""}
                                            </Button>
                                          );
                                        })()}
                                      </Table.Td>
                                    </Table.Tr>
                                  );
                                })}
                              </Table.Tbody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MODE 2: 114-CHAPTER SEQUENCE CONCORDANCE */}
                    {viewMode === "CONCORDANCE" && (
                      <Stack gap="lg">
                        {chapterConcordance.length === 0 ? (
                          <Paper p="xl" ta="center" radius="md" withBorder>
                            <Text size="sm" c="dimmed">
                              No Quranic verses found matching the active search or filter.
                            </Text>
                          </Paper>
                        ) : (
                          chapterConcordance.map((ch) => (
                            <Paper
                              key={ch.surah_number}
                              p="md"
                              radius="md"
                              withBorder
                              style={{
                                background: isDark ? "#25262b" : "#f8fafc",
                                borderLeft: "4px solid #4f46e5",
                              }}
                            >
                              <Group justify="space-between" mb="sm">
                                <Group gap="xs">
                                  <Badge size="lg" color="indigo" variant="filled">
                                    Surah {ch.surah_number}
                                  </Badge>
                                  <Text fw={800} size="md" c={isDark ? "white" : "dark.8"}>
                                    {ch.surah_name}
                                  </Text>
                                </Group>
                                <Badge size="sm" variant="light" color="teal">
                                  {ch.verses.length} Cited Ayats
                                </Badge>
                              </Group>

                              <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                                <Table className="excel-table" highlightOnHover>
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ minWidth: 120, width: "1%", whiteSpace: "nowrap" }}>Surah# : Ayat#</Table.Th>
                                      <Table.Th style={{ minWidth: 260 }}>Translation</Table.Th>
                                      <Table.Th>Cited in Lectures & Categories</Table.Th>
                                      <Table.Th style={{ width: 100, textAlign: "center" }}>Video(s)</Table.Th>
                                      <Table.Th style={{ width: 110, textAlign: "center", whiteSpace: "nowrap" }}>Citations</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {ch.verses.map((v, vIdx) => {
                                      const vList = getAyatVideoList(v);

                                      return (
                                        <Table.Tr key={vIdx} className="excel-row" onClick={() => handleOpenAyatModal(v)}>
                                          <Table.Td style={{ whiteSpace: "nowrap", width: "1%" }}>
                                            <Badge
                                              size="sm"
                                              color="indigo"
                                              variant="filled"
                                              style={{
                                                fontFamily: "monospace",
                                                fontWeight: 800,
                                                fontSize: 12,
                                                letterSpacing: "0.5px",
                                                padding: "4px 8px",
                                              }}
                                              title={`${ch.surah_name || `Surah ${ch.surah_number}`}, Ayat ${v.ayat_number}`}
                                            >
                                              {formatVerseRef(ch.surah_number, v.ayat_number)}
                                            </Badge>
                                          </Table.Td>

                                          <Table.Td>
                                            <Text size="xs" c="dark.6" lineClamp={2} style={{ lineHeight: 1.5 }}>
                                              {v.english_translation || v.urdu_translation}
                                            </Text>
                                          </Table.Td>

                                          <Table.Td>
                                            <Group gap={6} wrap="wrap">
                                              {v.occurrences.map((occ, oIdx) => (
                                                <Badge
                                                  key={oIdx}
                                                  size="xs"
                                                  color={occ.language === "urdu" ? "green" : "blue"}
                                                  variant="light"
                                                  style={{ textTransform: "none", fontWeight: 600 }}
                                                  title={`${occ.category_name} - ${getLectureName(occ.lecture_name) || `Lecture ${occ.lecture_number}`}`}
                                                >
                                                  {occ.category_name} - {getLectureName(occ.lecture_name) || `Lecture ${occ.lecture_number}`}
                                                </Badge>
                                              ))}
                                            </Group>
                                          </Table.Td>

                                          {/* Concordance Video Column */}
                                          <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                                            {vList.length === 0 ? (
                                              <Text size="10px" c="dimmed">-</Text>
                                            ) : vList.length === 1 ? (
                                              <Button
                                                size="compact-xs"
                                                color="red"
                                                variant="light"
                                                leftSection={<Play size={10} fill="currentColor" />}
                                                onClick={() =>
                                                  setActiveVideoModal({
                                                    title: `Surah ${v.surah_number}:${v.ayat_number} Clip`,
                                                    url: vList[0],
                                                  })
                                                }
                                              >
                                                Clip
                                              </Button>
                                            ) : (
                                              <Button
                                                size="compact-xs"
                                                color="red"
                                                variant="filled"
                                                leftSection={<Play size={10} fill="currentColor" />}
                                                rightSection={
                                                  <span
                                                    style={{
                                                      background: "white",
                                                      color: "#dc2626",
                                                      borderRadius: 8,
                                                      padding: "1px 4px",
                                                      fontSize: 8,
                                                      fontWeight: 800,
                                                    }}
                                                  >
                                                    {vList.length}
                                                  </span>
                                                }
                                                onClick={() =>
                                                  setActiveMultiVideoModal({
                                                    title: `Surah ${formatVerseRef(v.surah_number, v.ayat_number)} Video Clips`,
                                                    videos: vList,
                                                    verse: v,
                                                  })
                                                }
                                              >
                                                Clips
                                              </Button>
                                            )}
                                          </Table.Td>

                                          <Table.Td style={{ textAlign: "center", whiteSpace: "nowrap", width: "1%" }} onClick={(e) => e.stopPropagation()}>
                                            <Button
                                              size="compact-xs"
                                              variant="light"
                                              color="indigo"
                                              leftSection={<Layers size={11} />}
                                              onClick={() => setActiveCitationsModal({ verse: v, citations: v.occurrences })}
                                              title="View cited lectures & video clips"
                                              style={{ fontWeight: 700, fontSize: 11 }}
                                            >
                                              {v.occurrences.length} {v.occurrences.length === 1 ? "Lecture" : "Lectures"}
                                            </Button>
                                          </Table.Td>
                                        </Table.Tr>
                                      );
                                    })}
                                  </Table.Tbody>
                                </Table>
                              </div>
                            </Paper>
                          ))
                        )}
                      </Stack>
                    )}
                  </>
                )}
              </Box>

              {/* Right Side Ribbons (Categories of Selected Language) */}
              <Box
                style={{
                  width: 235,
                  borderLeft: isDark ? "1px solid #2c2e33" : "1px solid #eef2f6",
                  padding: "16px 6px 16px 16px",
                  background: isDark ? "#141517" : "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  overflowY: "auto",
                  maxHeight: 720,
                  overflowX: "visible",
                }}
              >
                <Group justify="space-between" px="xs" mb={2}>
                  <Text size="10px" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
                    {activeLanguage.toUpperCase()} CATEGORIES
                  </Text>
                  <Badge size="xs" variant="light" color="indigo" style={{ fontSize: 9 }}>
                    {languageCategories.length}
                  </Badge>
                </Group>

                {languageCategories.length === 0 ? (
                  <Text size="xs" c="dimmed" px="xs">
                    No categories in this language.
                  </Text>
                ) : (
                  languageCategories.map((cat, idx) => {
                    const isSelected = activeCategoryIndex === idx;
                    const catColor = CATEGORY_PALETTES[idx % CATEGORY_PALETTES.length];
                    const lecCount = cat.lectures ? cat.lectures.length : cat.total_lectures || 0;

                    return (
                      <Box
                        key={cat._id || idx}
                        onClick={() => handleCategoryChange(idx)}
                        style={{
                          position: "relative",
                          background: isSelected
                            ? `linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.12) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.5) 100%), ${catColor}`
                            : `${catColor}b5`,
                          color: "white",
                          padding: isSelected ? "10px 14px 10px 14px" : "7px 10px 7px 10px",
                          fontSize: isSelected ? 12 : 10.5,
                          fontWeight: isSelected ? 900 : 600,
                          cursor: "pointer",
                          clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 6px 50%)",
                          boxShadow: isSelected
                            ? "inset 0 2.5px 2px rgba(255,255,255,0.9), inset 0 -3px 3px rgba(0,0,0,0.55), inset 3px 0 2px rgba(255,255,255,0.4)"
                            : "inset 0 1px 0 rgba(255,255,255,0.25)",
                          filter: isSelected
                            ? "drop-shadow(-8px 6px 14px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(255,255,255,0.4))"
                            : "drop-shadow(1px 2px 3px rgba(0,0,0,0.12))",
                          transform: isSelected ? "translateX(-14px) scale(1.08)" : "translateX(0) scale(0.97)",
                          opacity: isSelected ? 1 : 0.82,
                          zIndex: isSelected ? 30 : 1,
                          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                        title={cat.category_name}
                      >
                        <Group gap={6} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                          {isSelected && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "#facc15",
                                boxShadow: "0 0 8px #facc15",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: isSelected ? 135 : 120,
                              textShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                            }}
                          >
                            {cat.category_name}
                          </span>
                        </Group>

                        <Badge
                          size="xs"
                          variant={isSelected ? "filled" : "white"}
                          color={isSelected ? "yellow" : "dark"}
                          style={{
                            marginRight: 6,
                            fontSize: isSelected ? 10 : 9,
                            fontWeight: 900,
                            color: isSelected ? "#000000" : undefined,
                            boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.3)" : "none",
                          }}
                        >
                          {lecCount}
                        </Badge>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>
        </Card>
      </div>

      {/* FULL AYAT DETAILS MODAL (Pop Dialogue with Live Arabic from Quran API) */}
      <Modal
        opened={!!activeAyatModal}
        onClose={() => setActiveAyatModal(null)}
        title={
          activeAyatModal && (
            <Group gap="xs">
              <Badge color="indigo" size="md" variant="filled" style={{ fontFamily: "monospace", fontWeight: 800 }}>
                {formatVerseRef(activeAyatModal.surah_number, activeAyatModal.ayat_number)}
              </Badge>
              <Text fw={700} size="sm">
                {activeAyatModal.surah_name || `Surah ${activeAyatModal.surah_number}`}
              </Text>
            </Group>
          )
        }
        size="lg"
        centered
        radius="md"
      >
        {activeAyatModal && (
          <Stack gap="sm">
            {/* Arabic Text Display */}
            <Paper p="md" radius="md" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", position: "relative" }}>
              <Group justify="space-between" mb={6}>
                <Badge size="xs" color="teal" variant="light">
                  Authentic Uthmani Text (Quran API)
                </Badge>
                {isFetchingLiveArabic && <Loader size="xs" color="teal" />}
              </Group>

              <Text className="arabic-calligraphy" style={{ fontSize: 24, color: "#065f46" }}>
                {liveArabicText || activeAyatModal.arabic_text || "Loading authentic text from Quran API..."}
              </Text>
            </Paper>

            {/* Multilingual Translation Tabs */}
            <Tabs defaultValue="english" color="indigo" radius="sm">
              <Tabs.List mb="xs">
                <Tabs.Tab value="english">English Translation</Tabs.Tab>
                {activeAyatModal.urdu_translation && <Tabs.Tab value="urdu">Urdu Translation</Tabs.Tab>}
                {activeAyatModal.hindi_translation && <Tabs.Tab value="hindi">Hindi Translation</Tabs.Tab>}
              </Tabs.List>

              <Tabs.Panel value="english">
                <Text size="xs" c="dark.7" style={{ lineHeight: 1.6 }}>
                  {activeAyatModal.english_translation || "No English translation provided."}
                </Text>
              </Tabs.Panel>

              {activeAyatModal.urdu_translation && (
                <Tabs.Panel value="urdu">
                  <Text className="urdu-calligraphy" size="xs" c="dark.7" style={{ lineHeight: 1.7 }}>
                    {activeAyatModal.urdu_translation}
                  </Text>
                </Tabs.Panel>
              )}

              {activeAyatModal.hindi_translation && (
                <Tabs.Panel value="hindi">
                  <Text size="xs" c="dark.7" style={{ lineHeight: 1.6 }}>
                    {activeAyatModal.hindi_translation}
                  </Text>
                </Tabs.Panel>
              )}
            </Tabs>

            {/* Lecture Points / Notes */}
            {(activeAyatModal.points_notes_eng || activeAyatModal.points_notes_urdu || activeAyatModal.points_notes) && (
              <Paper p="xs" radius="sm" style={{ background: "#fef3c7", borderLeft: "3px solid #f59e0b" }}>
                <Text size="xs" fw={700} c="dark.8" mb={2}>
                  💡 Lecture Notes & Explanations:
                </Text>
                <Text size="xs" c="dark.7">
                  {activeAyatModal.points_notes_eng || activeAyatModal.points_notes_urdu || activeAyatModal.points_notes}
                </Text>
              </Paper>
            )}

            {/* Question & Answer if any */}
            {activeAyatModal.quest_answer && activeAyatModal.question_text && (
              <Paper p="xs" radius="sm" style={{ background: "#eff6ff", borderLeft: "3px solid #3b82f6" }}>
                <Text size="xs" fw={700} c="blue.9" mb={2}>
                  ❓ Question Addressed in Lecture:
                </Text>
                <Text size="xs" c="dark.7">
                  {activeAyatModal.question_text}
                </Text>
              </Paper>
            )}

            {/* PROVISION: Ayat Images (English, Urdu, Hindi) - Kept hidden for now until server images updated */}
            {SHOW_AYAT_IMAGES && Boolean(activeAyatModal.ayat_image_eng_url || activeAyatModal.ayat_image_urdu_url || activeAyatModal.ayat_image_hindi_url) && (
              <Paper p="sm" radius="md" withBorder style={{ background: isDark ? "#141517" : "#f8fafc" }}>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    🖼️ Ayat Slide Image:
                  </Text>
                  <Badge size="xs" color="indigo" variant="light">Visual Reference</Badge>
                </Group>
                <Tabs defaultValue="eng_img" color="indigo" radius="sm">
                  <Tabs.List mb="xs">
                    {activeAyatModal.ayat_image_eng_url && <Tabs.Tab value="eng_img">English Image</Tabs.Tab>}
                    {activeAyatModal.ayat_image_urdu_url && <Tabs.Tab value="urdu_img">Urdu Image</Tabs.Tab>}
                    {activeAyatModal.ayat_image_hindi_url && <Tabs.Tab value="hindi_img">Hindi Image</Tabs.Tab>}
                  </Tabs.List>
                  {activeAyatModal.ayat_image_eng_url && (
                    <Tabs.Panel value="eng_img">
                      <div style={{ textAlign: "center", borderRadius: 8, overflow: "hidden", background: "#000" }}>
                        <img
                          src={activeAyatModal.ayat_image_eng_url}
                          alt="Ayat English Slide"
                          style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                        />
                      </div>
                    </Tabs.Panel>
                  )}
                  {activeAyatModal.ayat_image_urdu_url && (
                    <Tabs.Panel value="urdu_img">
                      <div style={{ textAlign: "center", borderRadius: 8, overflow: "hidden", background: "#000" }}>
                        <img
                          src={activeAyatModal.ayat_image_urdu_url}
                          alt="Ayat Urdu Slide"
                          style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                        />
                      </div>
                    </Tabs.Panel>
                  )}
                  {activeAyatModal.ayat_image_hindi_url && (
                    <Tabs.Panel value="hindi_img">
                      <div style={{ textAlign: "center", borderRadius: 8, overflow: "hidden", background: "#000" }}>
                        <img
                          src={activeAyatModal.ayat_image_hindi_url}
                          alt="Ayat Hindi Slide"
                          style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                        />
                      </div>
                    </Tabs.Panel>
                  )}
                </Tabs>
              </Paper>
            )}

            {/* Cited in Lectures & Categories (Both English & Urdu) */}
            {(() => {
              const cKey = `${activeAyatModal.surah_number}:${activeAyatModal.ayat_number}`;
              const citations = activeAyatModal.citations || verseCitationsMap.get(cKey) || [];
              if (citations.length === 0) return null;

              return (
                <Paper p="sm" radius="md" withBorder style={{ background: isDark ? "#141517" : "#f8fafc", borderColor: isDark ? "#2c2e33" : "#e2e8f0" }}>
                  <Group justify="space-between" mb="xs">
                    <Group gap={6}>
                      <Layers size={14} color="#4f46e5" />
                      <Text size="xs" fw={800} c={isDark ? "white" : "dark.8"}>
                        Cited in {citations.length} Lecture{citations.length === 1 ? "" : "s"} across Categories (English & Urdu):
                      </Text>
                    </Group>
                    <Badge size="xs" color="indigo" variant="light">
                      Lectures & Clips
                    </Badge>
                  </Group>

                  <Stack gap="xs" style={{ maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                    {citations.map((cite, cIdx) => {
                      const isEnglish = cite.language === "eng";
                      const isUrdu = cite.language === "urdu";
                      const langLabel = isEnglish ? "English" : isUrdu ? "Urdu" : cite.language;
                      const langColor = isEnglish ? "blue" : isUrdu ? "green" : "orange";

                      return (
                        <Paper key={cIdx} p="xs" radius="sm" withBorder style={{ background: isDark ? "#1e1f23" : "#ffffff" }}>
                          <Group justify="space-between" align="center" wrap="nowrap">
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <Group gap={6} mb={2}>
                                <Badge size="xs" color={langColor} variant="filled" style={{ fontSize: 9 }}>
                                  {isEnglish ? "📘" : isUrdu ? "📗" : "📙"} {langLabel}
                                </Badge>
                                <Text size="10px" fw={700} c="dimmed">
                                  {cite.category_name}
                                </Text>
                              </Group>
                              <Text size="xs" fw={700} lineClamp={1}>
                                Lec {cite.lecture_number}: {cite.lecture_name}
                              </Text>
                            </div>

                            {/* Attached Video Clips for this Lecture */}
                            {cite.video_urls && cite.video_urls.length > 0 && (
                              <Group gap={6} wrap="wrap">
                                {cite.video_urls.map((vUrl, vI) => {
                                  const ts = parseVideoTimestamps(vUrl);
                                  return (
                                    <Button
                                      key={vI}
                                      size="compact-xs"
                                      color="red"
                                      variant={cite.video_urls.length > 1 ? "filled" : "light"}
                                      leftSection={<Play size={10} fill="currentColor" />}
                                      onClick={() =>
                                        setActiveVideoModal({
                                          title: `${cite.lecture_name} - Surah ${activeAyatModal.surah_number}:${activeAyatModal.ayat_number} ${cite.video_urls.length > 1 ? `(Clip ${vI + 1})` : ""}`,
                                          url: vUrl,
                                        })
                                      }
                                      style={{ flexShrink: 0, fontWeight: 700 }}
                                    >
                                      {cite.video_urls.length === 1 ? "Play Clip" : `Clip ${vI + 1}`} {ts ? `(${ts})` : ""}
                                    </Button>
                                  );
                                })}
                              </Group>
                            )}
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              );
            })()}
          </Stack>
        )}
      </Modal>

      {/* CITATIONS & ATTACHED CLIPS MODAL (Shows in which lectures this verse came in English & Urdu) */}
      <Modal
        opened={!!activeCitationsModal}
        onClose={() => setActiveCitationsModal(null)}
        title={
          activeCitationsModal && (
            <Group gap="xs">
              <Badge color="indigo" size="md" variant="filled" style={{ fontFamily: "monospace", fontWeight: 800 }}>
                {formatVerseRef(activeCitationsModal.verse.surah_number, activeCitationsModal.verse.ayat_number)}
              </Badge>
              <Text fw={800} size="sm">
                {activeCitationsModal.verse.surah_name || `Surah ${activeCitationsModal.verse.surah_number}`} — Cited in {activeCitationsModal.citations.length} Lecture{activeCitationsModal.citations.length === 1 ? "" : "s"}
              </Text>
            </Group>
          )
        }
        size="lg"
        centered
        radius="lg"
      >
        {activeCitationsModal && (
          <Stack gap="md">
            {/* Translation Banner */}
            <Paper p="sm" radius="md" style={{ background: isDark ? "#1f2937" : "#f1f5f9" }}>
              <Text size="xs" fw={700} c="dimmed" mb={2}>
                TRANSLATION REFERENCE:
              </Text>
              <Text size="xs" c={isDark ? "gray.2" : "dark.8"} style={{ lineHeight: 1.5 }}>
                "{activeCitationsModal.verse.english_translation || activeCitationsModal.verse.urdu_translation || "Quranic verse"}"
              </Text>
            </Paper>

            <Text size="xs" fw={700} c="dimmed">
              ALL LECTURES & ATTACHED VIDEO CLIPS CITING THIS AYAT ({activeCitationsModal.citations.length}):
            </Text>

            <Stack gap="sm" style={{ maxHeight: 440, overflowY: "auto", paddingRight: 4 }}>
              {activeCitationsModal.citations.map((cite, cIdx) => {
                const isEnglish = cite.language === "eng";
                const isUrdu = cite.language === "urdu";
                const isHindi = cite.language === "hindi";
                const langLabel = isEnglish ? "English" : isUrdu ? "Urdu" : isHindi ? "Hindi" : cite.language;
                const langBadgeColor = isEnglish ? "blue" : isUrdu ? "green" : "orange";

                return (
                  <Paper
                    key={cIdx}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      background: isDark ? "#141517" : "#ffffff",
                      borderColor: isDark ? "#374151" : "#e2e8f0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Header: Category & Language Badges */}
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <div>
                        <Group gap={6} mb={3}>
                          <Badge size="xs" color={langBadgeColor} variant="filled">
                            {isEnglish ? "📘" : isUrdu ? "📗" : "📙"} {langLabel}
                          </Badge>
                          <Badge size="xs" color="gray" variant="light">
                            {cite.category_name}
                          </Badge>
                          {cite.season && (
                            <Badge size="xs" color="violet" variant="outline">
                              {cite.season}
                            </Badge>
                          )}
                          {cite.year_delivered && (
                            <Text size="10px" c="dimmed">
                              Yr {cite.year_delivered}
                            </Text>
                          )}
                        </Group>
                        <Text size="sm" fw={800} c={isDark ? "white" : "dark.8"}>
                          Lecture {cite.lecture_number}: {cite.lecture_name}
                        </Text>
                        {cite.lecture_names?.length > 1 && (
                          <Text size="10px" c="dimmed">
                            AKA: {cite.lecture_names.slice(1).join(", ")}
                          </Text>
                        )}
                      </div>

                      {/* Jump button */}
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="indigo"
                        rightSection={<ChevronRight size={12} />}
                        onClick={() => {
                          handleLanguageChange(cite.language);
                          const catIdx = metaCategories
                            .filter((c) => (c.language || "eng").toLowerCase() === cite.language)
                            .findIndex((c) => String(c._id || c.category_id) === cite.category_id || c.category_name === cite.category_name);
                          if (catIdx !== -1) {
                            setTimeout(() => {
                              setActiveCategoryIndex(catIdx);
                              const lecList = metaCategories.filter((c) => (c.language || "eng").toLowerCase() === cite.language)[catIdx]?.lectures || [];
                              const lIdx = lecList.findIndex((l) => String(l._id || l.lecture_id) === cite.lecture_id || l.lecture_id === cite.lecture_number);
                              if (lIdx !== -1) setActiveLectureIndex(lIdx);
                            }, 220);
                          }
                          setActiveCitationsModal(null);
                        }}
                      >
                        Open in Notebook
                      </Button>
                    </Group>

                    {/* Attached Video Clips */}
                    {cite.video_urls && cite.video_urls.length > 0 && (
                      <Box mt="xs" p="xs" style={{ background: isDark ? "#1e1b4b22" : "#f8fafc", borderRadius: 8 }}>
                        <Text size="11px" fw={700} c="red.8" mb={4}>
                          Attached Video Clip(s):
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          {cite.video_urls.map((vUrl, vI) => {
                            const ts = parseVideoTimestamps(vUrl);
                            return (
                              <Button
                                key={vI}
                                size="compact-xs"
                                color="red"
                                variant="filled"
                                leftSection={<Play size={10} fill="currentColor" />}
                                onClick={() =>
                                  setActiveVideoModal({
                                    title: `${cite.lecture_name} - Surah ${activeCitationsModal.verse.surah_number}:${activeCitationsModal.verse.ayat_number} (Clip ${vI + 1})`,
                                    url: vUrl,
                                  })
                                }
                                style={{ fontWeight: 700 }}
                              >
                                Play Clip {cite.video_urls.length > 1 ? `${vI + 1}` : ""} {ts ? `(${ts})` : ""}
                              </Button>
                            );
                          })}
                        </Group>
                      </Box>
                    )}

                    {/* Notes or Questions if present */}
                    {cite.points_notes && (
                      <Text size="xs" c="dimmed" mt={6} style={{ fontStyle: "italic" }}>
                        Notes: {cite.points_notes}
                      </Text>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* MULTI-VIDEO CLIP SELECTOR MODAL (Styled like Season Episodes) */}
      <Modal
        opened={!!activeMultiVideoModal}
        onClose={() => setActiveMultiVideoModal(null)}
        title={
          activeMultiVideoModal && (
            <Group gap="xs">
              <Badge color="red" size="md" variant="filled">
                {activeMultiVideoModal.videos.length} Video Clips
              </Badge>
              <Text fw={700} size="sm">
                {activeMultiVideoModal.title}
              </Text>
            </Group>
          )
        }
        size="md"
        centered
        radius="lg"
      >
        {activeMultiVideoModal && (
          <Stack gap="sm">
            <Text size="xs" c="dimmed">
              Multiple video explanations are linked for this verse. Select any clip to play:
            </Text>

            <Stack gap="xs">
              {activeMultiVideoModal.videos.map((url, idx) => {
                const timeRange = parseVideoTimestamps(url);

                return (
                  <Paper
                    key={idx}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    className="hover:border-red-400 hover:bg-red-50/20"
                    onClick={() => {
                      setActiveVideoModal({
                        title: `${activeMultiVideoModal.title} - Clip ${idx + 1}${timeRange ? ` (${timeRange})` : ""}`,
                        url,
                      });
                      setActiveMultiVideoModal(null);
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 11,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Group gap={6} align="center">
                            <Text size="xs" fw={700}>
                              Video Clip {idx + 1}
                            </Text>
                            {timeRange && (
                              <Badge size="xs" color="blue" variant="light">
                                ⏱ {timeRange}
                              </Badge>
                            )}
                          </Group>
                          <Text size="10px" c="dimmed" lineClamp={1}>
                            {url}
                          </Text>
                        </div>
                      </Group>

                      <Button
                        size="compact-xs"
                        color="red"
                        variant="filled"
                        leftSection={<Play size={11} fill="currentColor" />}
                      >
                        Play
                      </Button>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* POP ACTION MODALS: PDF / EPISODES / VERSES */}
      <Modal
        opened={!!activeActionModal && !!actionModalLecture}
        onClose={() => {
          setActiveActionModal(null);
          setActionModalLecture(null);
        }}
        title={
          actionModalLecture && (
            <Group gap="xs">
              {activeActionModal === "pdf" && <FileText size={18} color="#059669" />}
              {activeActionModal === "verses" && <BookOpen size={18} color="#d97706" />}
              {activeActionModal === "episodes" && <Layers size={18} color="#4f46e5" />}
              <Text fw={700} size="sm">
                Lec {actionModalLecture.lecture_id}: {getLectureName(actionModalLecture.lecture_name)}
              </Text>
            </Group>
          )
        }
        size="lg"
        centered
        radius="lg"
      >
        {actionModalLecture && (
          <div>
            {/* 1. PDF Material Modal */}
            {activeActionModal === "pdf" && (
              <Stack gap="md" ta="center" py="md">
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: "#d1fae5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                  }}
                >
                  <FileText size={30} />
                </div>
                <div>
                  <Title order={4}>
                    {actionModalLecture.pdf_title || `${getLectureName(actionModalLecture.lecture_name)} - Study Notes`}
                  </Title>
                  <Text size="xs" c="dimmed" mt={4}>
                    Official Lecture Transcripts, Notes & Quranic Ayat Indices
                  </Text>
                </div>
                <Group justify="center" mt="sm">
                  {actionModalLecture.pdf_link || (Array.isArray(actionModalLecture.pdf_booklet_urls) && actionModalLecture.pdf_booklet_urls.length > 0) ? (
                    <Button
                      color="teal"
                      radius="xl"
                      leftSection={<Download size={15} />}
                      onClick={() => {
                        const pdfUrl =
                          actionModalLecture.pdf_link ||
                          (Array.isArray(actionModalLecture.pdf_booklet_urls) ? actionModalLecture.pdf_booklet_urls[0] : "");
                        window.open(pdfUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Open PDF Booklet
                    </Button>
                  ) : (
                    <Badge color="gray" size="md">
                      PDF Booklet being digitized
                    </Badge>
                  )}
                </Group>
              </Stack>
            )}

            {/* 2. Linked Verses Modal */}
            {activeActionModal === "verses" && (
              <Stack gap="xs" style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                <Text size="xs" c="dimmed" mb={4}>
                  All {actionModalLecture.ayat_references?.length || 0} Quranic Verses Cited in this Lecture:
                </Text>
                {(actionModalLecture.ayat_references || []).map((verse, vIdx) => (
                  <Paper key={vIdx} p="sm" radius="md" withBorder style={{ background: "#f8fafc" }}>
                    <Group justify="space-between" mb={4}>
                      <Badge color="indigo" size="sm" variant="filled">
                        Ayat {formatVerseRef(verse.surah_number, verse.ayat_number)}
                      </Badge>
                      <Text size="xs" fw={700} c="dimmed">
                        {verse.surah_name}
                      </Text>
                    </Group>
                    <Text size="xs" c="dark.7" fs="italic">
                      "{verse.english_translation || verse.urdu_translation || "Quranic verse reference"}"
                    </Text>
                  </Paper>
                ))}
              </Stack>
            )}

            {/* 3. Seasons & Episodes Breakdown Modal */}
            {activeActionModal === "episodes" && (
              <Stack gap="xs">
                <Text size="xs" c="dimmed">
                  Season Episodes & Topic Parts:
                </Text>

                <Stack gap="xs" style={{ maxHeight: 380, overflowY: "auto" }}>
                  {(actionModalLecture.seasons && actionModalLecture.seasons.length > 0
                    ? actionModalLecture.seasons.flatMap((s) =>
                        (s.episodes || []).map((ep) => ({ ...ep, season_name: s.season_name }))
                      )
                    : (actionModalLecture.episodes || [])
                  ).map((ep, idx) => (
                    <Paper key={ep.id || idx} p="sm" radius="md" withBorder>
                      <Group justify="space-between" align="center">
                        <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              backgroundColor: "#4f46e5",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <Text size="xs" fw={700} lineClamp={1}>
                              {ep.episode_title || ep.title || `Episode ${idx + 1}`}
                            </Text>
                            <Text size="10px" c="dimmed">
                              {ep.season_name ? `${ep.season_name} • ` : ""}
                              {ep.episode_number || ep.duration || "Episode"}
                            </Text>
                          </div>
                        </Group>

                        <Button
                          size="compact-xs"
                          color="indigo"
                          variant="light"
                          leftSection={<Play size={11} fill="currentColor" />}
                          onClick={() => {
                            const epUrl = ep.episode_url || ep.videoUrl || ep.video_url;
                            if (epUrl) {
                              setActiveVideoModal({
                                title: `${getLectureName(actionModalLecture.lecture_name)} - ${ep.episode_title || ep.title || `Episode ${idx + 1}`}`,
                                url: epUrl,
                              });
                              setActiveActionModal(null);
                            }
                          }}
                        >
                          Play
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            )}
          </div>
        )}
      </Modal>

      {/* VIDEO PLAYER MODAL WITH NATIVE YOUTUBE IFRAME & START/END TIMESTAMP SUPPORT */}
      <Modal
        opened={!!activeVideoModal}
        onClose={() => setActiveVideoModal(null)}
        title={
          <Group gap="xs">
            <IconBrandYoutube size={20} color="red" />
            <Text fw={700} size="sm">
              {activeVideoModal?.title}
            </Text>
          </Group>
        }
        size="xl"
        centered
        radius="lg"
      >
        {activeVideoModal && (
          <div>
            {/* 16:9 Responsive Video Iframe (Natively supports ?start=...&end=... parameters) */}
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                borderRadius: "8px",
                backgroundColor: "#000",
              }}
            >
              <iframe
                src={getEmbedUrl(activeVideoModal.url)}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "8px",
                  border: "none",
                }}
              />
            </div>

            {/* If YouTube, provide direct fallback note and button */}
            {getEmbedUrl(activeVideoModal.url)?.includes("youtube.com") && (
              <Paper
                p="xs"
                radius="md"
                mt="sm"
                style={{
                  background: isDark ? "rgba(220, 38, 38, 0.15)" : "#fef2f2",
                  border: "1px solid rgba(220, 38, 38, 0.3)",
                }}
              >
                <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <Text size="xs" fw={700} c="red.8">
                      Playback Restricted by Video Owner?
                    </Text>
                    <Text size="11px" c="dimmed">
                      If YouTube says <i>"Playback on other websites has been disabled by the video owner"</i>, click here to watch directly on YouTube at this exact timestamp segment. (Channel owners can enable this under YouTube Studio ➔ Show more ➔ License ➔ "Allow embedding").
                    </Text>
                  </div>
                  <Button
                    component="a"
                    href={getYouTubeWatchUrl(activeVideoModal.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="red"
                    size="xs"
                    leftSection={<IconBrandYoutube size={15} />}
                  >
                    Watch on YouTube
                  </Button>
                </Group>
              </Paper>
            )}

            {/* Video Footer info and external link */}
            <Group justify="space-between" align="center" mt="md">
              <Text size="xs" c="dimmed" lineClamp={1} style={{ maxWidth: 420 }}>
                {activeVideoModal.url}
              </Text>
              <Group gap="xs">
                <Button
                  component="a"
                  href={getYouTubeWatchUrl(activeVideoModal.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  color="red"
                  variant="light"
                  leftSection={<IconBrandYoutube size={14} />}
                >
                  Open on YouTube
                </Button>
                <Button
                  size="xs"
                  color="gray"
                  variant="light"
                  onClick={() => setActiveVideoModal(null)}
                >
                  Close
                </Button>
              </Group>
            </Group>
          </div>
        )}
      </Modal>
    </Container>
  );
}
