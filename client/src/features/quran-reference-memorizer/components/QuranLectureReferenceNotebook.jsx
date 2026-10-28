// client/src/features/quran-reference-memorizer/components/QuranLectureReferenceNotebook.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Card,
  Box,
  Stack,
  Loader,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { SURAH_LIST } from "../../../components/common/QuranVersePicker";
import { NotebookSpine } from "../../sticky-notes/components/NotebookSpine";
import { fetchQuranVerseFromProxy } from "../api/ayatsApi";

// Subcomponents
import { NotebookHeaderBar } from "./NotebookHeaderBar";
import { NotebookLectureTabs } from "./NotebookLectureTabs";
import { NotebookLectureDashboard } from "./NotebookLectureDashboard";
import { NotebookAyatTableView } from "./NotebookAyatTableView";
import { NotebookChapterConcordanceView } from "./NotebookChapterConcordanceView";
import { NotebookCategoryRibbons } from "./NotebookCategoryRibbons";
import { NotebookAyatDetailModal } from "./NotebookAyatDetailModal";
import { NotebookCitationsModal } from "./NotebookCitationsModal";
import { NotebookMultiVideoModal } from "./NotebookMultiVideoModal";
import { NotebookActionModal } from "./NotebookActionModal";
import { NotebookVideoPlayerModal } from "./NotebookVideoPlayerModal";

// Utilities & Constants
import {
  CATEGORY_PALETTES,
  CUTE_REACTIONS,
  SHOW_AYAT_IMAGES,
  getAyatVideoList,
  parseVerseSearch,
  parseVideoTimestamps,
  getEmbedUrl,
  getYouTubeWatchUrl,
  getLectureName,
  getLectureAliases,
  getLectureAllNames,
  formatVerseRef,
  getCategoryIconUrl,
  getLectureIconUrl,
} from "./notebookUtils";
import { PdfFileIcon } from "./PdfFileIcon";
import { MediaIconBadge } from "./MediaIconBadge";

// Re-export utility functions & constants for seamless backward compatibility
export {
  CATEGORY_PALETTES,
  CUTE_REACTIONS,
  SHOW_AYAT_IMAGES,
  getAyatVideoList,
  parseVerseSearch,
  parseVideoTimestamps,
  getEmbedUrl,
  getYouTubeWatchUrl,
  getLectureName,
  getLectureAliases,
  getLectureAllNames,
  formatVerseRef,
  getCategoryIconUrl,
  getLectureIconUrl,
  PdfFileIcon,
  MediaIconBadge,
};

// Helper to extract a sequence number from strings like "Episode 05", "Season 2", "Part 1"
function extractSeqNumber(str, fallback = 9999) {
  if (!str) return fallback;
  const match = String(str).match(/\d+/);
  return match ? parseInt(match[0], 10) : fallback;
}

// Strictly sort episodes in sequence: Episode 01, Episode 02, Episode 03... (1, 2, 3, 4...)
function sortEpisodesSequential(episodes = []) {
  if (!Array.isArray(episodes)) return [];
  return [...episodes].sort((a, b) => {
    const numA = extractSeqNumber(a.episode_number || a.episode_title || a.title);
    const numB = extractSeqNumber(b.episode_number || b.episode_title || b.title);
    if (numA !== numB) return numA - numB;
    return String(a.episode_number || a.episode_title || a.title || "").localeCompare(
      String(b.episode_number || b.episode_title || b.title || "")
    );
  });
}

// Strictly sort seasons in sequence: Season 1, Season 2... and each season's episodes
function sortSeasonsSequential(seasons = []) {
  if (!Array.isArray(seasons)) return [];
  return [...seasons]
    .sort((a, b) => {
      const numA = extractSeqNumber(a.season_name);
      const numB = extractSeqNumber(b.season_name);
      if (numA !== numB) return numA - numB;
      return String(a.season_name || "").localeCompare(String(b.season_name || ""));
    })
    .map((s) => ({
      ...s,
      episodes: sortEpisodesSequential(s.episodes || []),
    }));
}

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
    fetch(`/api/category-lectures/meta?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          // Strictly filter out Hindi categories - only English and Urdu are supported on this page
          const englishAndUrduOnly = data.filter((cat) => {
            const l = (cat.language || "eng").toLowerCase();
            return l !== "hindi" && l !== "hin";
          });
          const sortedData = englishAndUrduOnly.map((cat) => ({
            ...cat,
            lectures: Array.isArray(cat.lectures)
              ? [...cat.lectures]
                  .sort((a, b) => {
                    const numA = Number(a.lecture_id) || 0;
                    const numB = Number(b.lecture_id) || 0;
                    if (numA !== numB) return numA - numB;
                    return String(a.lecture_name || "").localeCompare(String(b.lecture_name || ""));
                  })
                  .map((lec) => ({
                    ...lec,
                    seasons: sortSeasonsSequential(lec.seasons || []),
                    episodes: sortEpisodesSequential(lec.episodes || []),
                  }))
              : [],
          }));
          setMetaCategories(sortedData);
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
    return metaCategories
      .filter((c) => {
        const l = (c.language || "eng").toLowerCase();
        return l === activeLanguage.toLowerCase();
      })
      .sort((a, b) => (Number(a.category_id) || 0) - (Number(b.category_id) || 0));
  }, [metaCategories, activeLanguage]);

  // Current active Category
  const activeCategory = useMemo(() => {
    if (languageCategories.length === 0) return null;
    const clamped = Math.min(activeCategoryIndex, languageCategories.length - 1);
    return languageCategories[clamped];
  }, [languageCategories, activeCategoryIndex]);

  // Lectures for the active Category (strictly sorted 1, 2, 3...)
  const activeLectures = useMemo(() => {
    if (!activeCategory || !Array.isArray(activeCategory.lectures)) return [];
    return [...activeCategory.lectures].sort((a, b) => {
      const numA = Number(a.lecture_id) || 0;
      const numB = Number(b.lecture_id) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.lecture_name || "").localeCompare(String(b.lecture_name || ""));
    });
  }, [activeCategory]);

  // Current active Lecture
  const activeLecture = useMemo(() => {
    if (activeLectures.length === 0) return null;
    const clamped = Math.min(activeLectureIndex, activeLectures.length - 1);
    return activeLectures[clamped];
  }, [activeLectures, activeLectureIndex]);

  // Seasons list for the active lecture (Strictly ordered Season 1, 2, 3...)
  const seasonsList = useMemo(() => {
    if (!activeLecture) return [];
    if (Array.isArray(activeLecture.seasons) && activeLecture.seasons.length > 0) {
      return sortSeasonsSequential(activeLecture.seasons);
    }
    // Fallback if episodes or single video urls present
    const fallbackUrls = [
      ...(Array.isArray(activeLecture.video_urls) ? activeLecture.video_urls : []),
      ...(Array.isArray(activeLecture.youtube_urls) ? activeLecture.youtube_urls : []),
      activeLecture.full_lecture_video_url,
    ].filter(Boolean);

    if (Array.isArray(activeLecture.episodes) && activeLecture.episodes.length > 0) {
      return [
        {
          season_name: activeLecture.season || "Season 1",
          episodes: sortEpisodesSequential(activeLecture.episodes),
        },
      ];
    }
    if (fallbackUrls.length > 0) {
      return [
        {
          season_name: activeLecture.season || "Season 1",
          episodes: fallbackUrls.map((u, i) => ({
            id: `ep_${i + 1}`,
            episode_number: `Episode ${i + 1}`,
            title: `Episode ${i + 1}`,
            episode_url: u,
          })),
        },
      ];
    }
    return [];
  }, [activeLecture]);

  // Current active Season
  const currentSeason = useMemo(() => {
    if (seasonsList.length === 0) return null;
    const idx = Math.min(activeSeasonIndex, seasonsList.length - 1);
    return seasonsList[idx];
  }, [seasonsList, activeSeasonIndex]);

  // Episodes list for the active season (Strictly ordered Episode 01, Episode 02, 3, 4...)
  const episodesList = useMemo(() => {
    if (!currentSeason) return [];
    return sortEpisodesSequential(Array.isArray(currentSeason.episodes) ? currentSeason.episodes : []);
  }, [currentSeason]);

  // Handle circular like click (opens cute reaction aura popover)
  const handleCircularLikeClick = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setOpenReactionLectureId((prev) => (prev === id ? null : id));
  };

  // Handle choosing one of the 4 cute happy reactions: thumb, hear, love, spread
  const handleSelectReaction = (id, reaction, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const existing = likedMap[id];
    setLikedMap((prev) => {
      const next = { ...prev };
      if (existing && existing.id === reaction.id) {
        delete next[id]; // Toggle off
      } else {
        next[id] = reaction; // Apply cute reaction
      }
      return next;
    });
    setOpenReactionLectureId(null);
  };

  // Handle Like toggle on top chips
  const handleLikeToggle = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const existing = likedMap[id];
    setLikedMap((prev) => {
      const next = { ...prev };
      if (existing) {
        delete next[id];
      } else {
        next[id] = CUTE_REACTIONS[2]; // Default to 'Love'
      }
      return next;
    });
  };

  // Open Pop Action Modal
  const openActionModal = (type, lecture, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const sortedLecture = lecture
      ? {
          ...lecture,
          seasons: sortSeasonsSequential(lecture.seasons || []),
          episodes: sortEpisodesSequential(lecture.episodes || []),
        }
      : lecture;

    if (type === "video") {
      const firstEpUrl =
        (sortedLecture.seasons && sortedLecture.seasons[0]?.episodes?.[0]?.episode_url) ||
        (sortedLecture.episodes && sortedLecture.episodes[0]?.episode_url) ||
        sortedLecture.full_lecture_video_url ||
        (sortedLecture.video_urls && sortedLecture.video_urls[0]) ||
        sortedLecture.video_url;
      if (firstEpUrl) {
        setActiveVideoModal({
          title: `${getLectureName(sortedLecture.lecture_name)} - Recording`,
          url: firstEpUrl,
        });
      } else {
        setActiveActionModal("episodes");
        setActionModalLecture(sortedLecture);
      }
      return;
    }
    setActiveActionModal(type);
    setActionModalLecture(sortedLecture);
  };

  // Change Language Tab
  const handleLanguageChange = (lang) => {
    if (!lang || lang === "hindi" || lang === "hin") return;
    if (lang === activeLanguage) return;
    setActiveLanguage(lang);
    setActiveCategoryIndex(0);
    setActiveLectureIndex(0);
    setActiveSeasonIndex(0);
    setFilterSurah("");
    setFilterAyat("");
    setSearchQuery("");
  };

  // Change Category
  const handleCategoryChange = (index) => {
    if (index === activeCategoryIndex) return;
    setActiveCategoryIndex(index);
    setActiveLectureIndex(0);
    setActiveSeasonIndex(0);
    setFilterSurah("");
    setFilterAyat("");
    setSearchQuery("");
  };

  // Change Lecture
  const handleLectureChange = (index) => {
    if (index === activeLectureIndex) return;
    setActiveLectureIndex(index);
    setActiveSeasonIndex(0);
    setFilterSurah("");
    setFilterAyat("");
  };

  // Filter Ayat options when Surah is selected
  const currentSurahObj = useMemo(() => {
    if (!filterSurah) return null;
    return SURAH_LIST.find((s) => s.value === String(filterSurah));
  }, [filterSurah]);

  const filterAyatOptions = useMemo(() => {
    if (!currentSurahObj) return [];
    const count = currentSurahObj.totalAyats || 286;
    return Array.from({ length: count }, (_, i) => ({
      value: String(i + 1),
      label: `Ayat ${i + 1}`,
    }));
  }, [currentSurahObj]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterSurah("");
    setFilterAyat("");
    setSortField("SURAH_THEN_AYAT");
  };

  const hasActiveFilters = searchQuery || filterSurah || filterAyat;

  const isValidQuranicVerse = (a) => {
    const s = Number(a.surah_number);
    const ay = Number(a.ayat_number);
    return !isNaN(s) && s >= 1 && s <= 114 && !isNaN(ay) && ay >= 1;
  };

  // Search & Filter Helper
  const processAndSortAyats = (rawList) => {
    let list = rawList.filter(isValidQuranicVerse);

    // Filter by Surah
    if (filterSurah) {
      const sNum = Number(filterSurah);
      list = list.filter((a) => Number(a.surah_number) === sNum);
    }

    // Filter by Ayat
    if (filterAyat) {
      const aNum = Number(filterAyat);
      list = list.filter((a) => Number(a.ayat_number) === aNum);
    }

    // Keyword or Surah:Ayat Search
    if (searchQuery.trim()) {
      const verseSearch = parseVerseSearch(searchQuery);

      if (verseSearch) {
        if (verseSearch.isRange) {
          const minA = Math.min(verseSearch.startAyat, verseSearch.endAyat);
          const maxA = Math.max(verseSearch.startAyat, verseSearch.endAyat);
          list = list.filter((a) => {
            const s = Number(a.surah_number);
            const ay = Number(a.ayat_number);
            return s === verseSearch.surah && ay >= minA && ay <= maxA;
          });
        } else {
          list = list.filter((a) => {
            const s = Number(a.surah_number);
            const ay = Number(a.ayat_number);
            return s === verseSearch.surah && ay === verseSearch.startAyat;
          });
        }
      } else {
        const q = searchQuery.toLowerCase().trim();
        const activeLecNames = activeLecture ? getLectureAllNames(activeLecture.lecture_name) : [];
        const matchesActiveLecTitle = activeLecNames.some((n) => n.toLowerCase().includes(q));

        if (!matchesActiveLecTitle) {
          list = list.filter((a) => {
            const refStr = `${a.surah_number}:${a.ayat_number}`;
            const sName = (a.surah_name || "").toLowerCase();
            const eng = (a.english_translation || "").toLowerCase();
            const urdu = (a.urdu_translation || "").toLowerCase();
            const arab = (a.arabic_text || "").toLowerCase();
            const notes = (a.points_notes_eng || a.points_notes_urdu || a.points_notes || "").toLowerCase();
            const qText = (a.question_text || "").toLowerCase();

            return (
              refStr.includes(q) ||
              sName.includes(q) ||
              eng.includes(q) ||
              urdu.includes(q) ||
              arab.includes(q) ||
              notes.includes(q) ||
              qText.includes(q)
            );
          });
        }
      }
    }

    // Sorting
    list.sort((a, b) => {
      const sA = Number(a.surah_number) || 0;
      const sB = Number(b.surah_number) || 0;
      const ayA = Number(a.ayat_number) || 0;
      const ayB = Number(b.ayat_number) || 0;

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
      // SURAH_THEN_AYAT
      if (sA !== sB) return sA - sB;
      return ayA - ayB;
    });

    return list;
  };

  // Precompute Global Verse Citations Map across all categories and lectures
  const verseCitationsMap = useMemo(() => {
    const rawMap = new Map();

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
              key: lecKey,
              category_id: String(cat._id || cat.category_id || ""),
              category_name: cat.category_name,
              language: catLang,
              lecture_id: String(lec._id || lec.lecture_id || ""),
              lecture_number: lec.lecture_id,
              lecture_name: getLectureName(lec.lecture_name),
              lecture_names: getLectureAllNames(lec.lecture_name),
              season: lec.season || "",
              episode: lec.episode || "",
              year_delivered: lec.year_delivered,
              video_urls: [...vList],
              points_notes:
                ayat.points_notes_eng ||
                ayat.points_notes_urdu ||
                ayat.points_notes ||
                "",
              question_text: ayat.question_text || "",
            });
          } else {
            const existing = verseLecturesMap.get(lecKey);
            vList.forEach((u) => {
              if (u && !existing.video_urls.includes(u)) {
                existing.video_urls.push(u);
              }
            });
            if (!existing.points_notes) {
              const n = ayat.points_notes_eng || ayat.points_notes_urdu || ayat.points_notes;
              if (n) existing.points_notes = n;
            }
          }
        });
      });
    });

    const resultMap = new Map();
    rawMap.forEach((lecturesMap, verseKey) => {
      resultMap.set(verseKey, Array.from(lecturesMap.values()));
    });

    return resultMap;
  }, [metaCategories]);

  // Current active Lecture Verses (processed & sorted)
  const currentLectureVerses = useMemo(() => {
    if (!activeLecture) return [];
    const raw = activeLecture.ayat_references || [];
    return processAndSortAyats(raw);
  }, [activeLecture, filterSurah, filterAyat, searchQuery, sortField]);

  // Global 114-Chapter Concordance Mode
  const chapterConcordance = useMemo(() => {
    const verseMap = new Map();

    metaCategories.forEach((cat) => {
      const catLang = (cat.language || "eng").toLowerCase();
      if (catLang !== activeLanguage.toLowerCase()) return;

      const lectures = cat.lectures || [];
      lectures.forEach((lec) => {
        const ayats = lec.ayat_references || [];
        ayats.forEach((ayat) => {
          if (!isValidQuranicVerse(ayat)) return;
          const key = `${ayat.surah_number}:${ayat.ayat_number}`;

          if (!verseMap.has(key)) {
            verseMap.set(key, {
              surah_number: ayat.surah_number,
              surah_name: ayat.surah_name,
              ayat_number: ayat.ayat_number,
              arabic_text: ayat.arabic_text,
              english_translation: ayat.english_translation,
              urdu_translation: ayat.urdu_translation,
              hindi_translation: ayat.hindi_translation,
              points_notes_eng: ayat.points_notes_eng,
              points_notes_urdu: ayat.points_notes_urdu,
              points_notes: ayat.points_notes,
              quest_answer: ayat.quest_answer,
              question_text: ayat.question_text,
              video_urls: ayat.video_urls || [],
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

  const handleOpenVideo = (title, url) => {
    setActiveVideoModal({ title, url });
  };

  const handleJumpToLecture = (cite) => {
    if (!cite || cite.language === "hindi" || cite.language === "hin") return;
    handleLanguageChange(cite.language);
    const targetCategories = metaCategories
      .filter((c) => (c.language || "eng").toLowerCase() === cite.language)
      .sort((a, b) => (Number(a.category_id) || 0) - (Number(b.category_id) || 0));
    const catIdx = targetCategories.findIndex(
      (c) =>
        String(c._id || c.category_id) === String(cite.category_id) ||
        c.category_name === cite.category_name
    );
    if (catIdx !== -1) {
      setTimeout(() => {
        setActiveCategoryIndex(catIdx);
        const rawLecList = targetCategories[catIdx]?.lectures || [];
        const sortedLecList = [...rawLecList].sort((a, b) => {
          const numA = Number(a.lecture_id) || 0;
          const numB = Number(b.lecture_id) || 0;
          if (numA !== numB) return numA - numB;
          return String(a.lecture_name || "").localeCompare(String(b.lecture_name || ""));
        });
        const lIdx = sortedLecList.findIndex(
          (l) =>
            String(l._id || l.lecture_id) === String(cite.lecture_id) ||
            Number(l.lecture_id) === Number(cite.lecture_number)
        );
        if (lIdx !== -1) setActiveLectureIndex(lIdx);
      }, 220);
    }
    setActiveCitationsModal(null);
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

        /* Container for top chips */
        .lecture-tabs-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          padding: 12px 16px;
          position: relative;
          z-index: 10;
        }

        /* 1. Fixed Slot (Preserves layout dimensions so nothing shifts below) */
        .lecture-chip-slot {
          position: relative;
          height: 38px; /* Fixed height matching default compact state */
          display: inline-block;
        }

        /* Ghost element in document flow to set the exact natural width of the slot */
        .lecture-chip-ghost {
          visibility: hidden;
          pointer-events: none;
          height: 38px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
        }

        /* 2. Compact Default State (Single line, space-saving) */
        .lecture-chip-card {
          position: absolute;
          top: 0;
          left: 0;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          width: 100%;
          min-width: 100%;
          padding: 6px 14px;
          background: ${isDark ? "#1e1f23" : "#ffffff"};
          border: 1px solid ${isDark ? "#374151" : "#e2e8f0"};
          border-radius: 20px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: top left;
          z-index: 1;
          outline: none;
        }

        /* Main Content Area */
        .chip-main-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Compact Title Typography */
        .chip-title {
          font-size: 0.875rem; /* 14px */
          font-weight: 600;
          color: ${isDark ? "#f1f5f9" : "#1e293b"};
          line-height: 1.2;
        }

        /* Compact AKA Badge */
        .chip-aka-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          background: ${isDark ? "rgba(99, 102, 241, 0.2)" : "#eef2ff"};
          color: ${isDark ? "#a5b4fc" : "#4f46e5"};
          padding: 2px 8px;
          border-radius: 10px;
          line-height: 1.2;
          display: inline-block;
        }

        /* Compact Ayats Badge */
        .chip-ayats-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.75rem;
          font-weight: 600;
          color: ${isDark ? "#cbd5e1" : "#475569"};
          background: ${isDark ? "#2d3139" : "#f1f5f9"};
          padding: 2px 8px;
          border-radius: 12px;
          line-height: 1.2;
        }

        .star-icon {
          color: #f59e0b;
          font-size: 0.75rem;
        }

        /* ------------------------------------------------------------- */
        /* 3. HOVER STATE: Pop-Out Expansion (Without Pushing Other UI)  */
        /* ------------------------------------------------------------- */
        .lecture-chip-card:hover {
          z-index: 100; /* Float above all other chips and lower sections */
          height: auto;
          min-height: 72px;
          padding: 12px 18px;
          border-radius: 16px;
          background: ${isDark ? "#25272e" : "#ffffff"};
          border-color: ${isDark ? "#6366f1" : "#cbd5e1"};
          box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.08);
          transform: translateY(-4px) scale(1.05); /* Smooth pop-out lift */
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          width: max-content;
        }

        /* Main content stacks on hover */
        .lecture-chip-card:hover .chip-main-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        /* Large High-Legibility Title on Hover */
        .lecture-chip-card:hover .chip-title {
          font-size: 1.15rem; /* ~18px for clear reading without glasses */
          font-weight: 800;
          color: ${isDark ? "#ffffff" : "#0f172a"};
          display: block;
        }

        /* Expanded AKA Sub-Badge on Hover */
        .lecture-chip-card:hover .chip-aka-badge {
          font-size: 0.8rem;
          font-weight: 800;
          padding: 4px 12px;
          background: ${isDark ? "rgba(99, 102, 241, 0.35)" : "#e0e7ff"};
          color: ${isDark ? "#c7d2fe" : "#3730a3"};
          border-radius: 8px;
        }

        /* Prominent Ayats Badge on Hover */
        .lecture-chip-card:hover .chip-ayats-badge {
          font-size: 0.95rem;
          font-weight: 700;
          color: ${isDark ? "#f8fafc" : "#1e293b"};
          background: ${isDark ? "#1e1f23" : "#f8fafc"};
          border: 1px solid ${isDark ? "#374151" : "#e2e8f0"};
          padding: 6px 12px;
          border-radius: 10px;
        }

        .lecture-chip-card:hover .star-icon {
          font-size: 1rem;
        }

        /* 4. Active Selected State */
        .lecture-chip-card.active {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
          border-color: #3730a3 !important;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
        }

        .lecture-chip-card.active .chip-title {
          color: #ffffff !important;
        }

        .lecture-chip-card.active .chip-aka-badge {
          background: rgba(255, 255, 255, 0.2) !important;
          color: #ffffff !important;
        }

        .lecture-chip-card.active .chip-ayats-badge {
          background: rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
        }

        .lecture-chip-card.active:hover {
          background: linear-gradient(135deg, #4338ca 0%, #3730a3 100%) !important;
          box-shadow: 0 14px 30px -4px rgba(79, 70, 229, 0.5) !important;
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

        /* 3D Real PDF Document SVG Icon Button */
        .pdf-doc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 2px;
          cursor: pointer;
          outline: none;
          border-radius: 8px;
          transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.16s ease;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.18));
          user-select: none;
        }
        .pdf-doc-btn:hover {
          transform: translateY(-2.5px) scale(1.06);
          filter: drop-shadow(0 8px 16px rgba(185, 59, 72, 0.4));
        }
        .pdf-doc-btn:active {
          transform: translateY(1.5px) scale(0.96);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
        }

        /* 3D Media Icon Badges (Category & Lecture) */
        .media-icon-badge-img,
        .media-icon-badge-fallback {
          transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.16s ease;
        }
        .media-icon-badge-img:hover,
        .media-icon-badge-fallback:hover {
          transform: translateY(-1.5px) scale(1.08);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
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

      {/* Top Header & Filters Bar */}
      <NotebookHeaderBar
        isDark={isDark}
        toggleColorScheme={toggleColorScheme}
        metaCategories={metaCategories}
        activeLanguage={activeLanguage}
        onLanguageChange={handleLanguageChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterSurah={filterSurah}
        setFilterSurah={setFilterSurah}
        filterAyat={filterAyat}
        setFilterAyat={setFilterAyat}
        filterAyatOptions={filterAyatOptions}
        sortField={sortField}
        setSortField={setSortField}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

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
              <NotebookLectureTabs
                activeLectures={activeLectures}
                activeLectureIndex={activeLectureIndex}
                onLectureChange={handleLectureChange}
                activeLecture={activeLecture}
                currentLectureVerses={currentLectureVerses}
                likedMap={likedMap}
                onLikeToggle={handleLikeToggle}
                openActionModal={openActionModal}
                isDark={isDark}
              />
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
                    {/* ViewMode: NOTEBOOK (Dashboard + Ayat Table) */}
                    {activeCategory && activeLecture && viewMode === "NOTEBOOK" && (
                      <>
                        <NotebookLectureDashboard
                          activeCategory={activeCategory}
                          activeLecture={activeLecture}
                          currentLectureVerses={currentLectureVerses}
                          seasonsList={seasonsList}
                          currentSeason={currentSeason}
                          activeSeasonIndex={activeSeasonIndex}
                          setActiveSeasonIndex={setActiveSeasonIndex}
                          episodesList={episodesList}
                          likedMap={likedMap}
                          openReactionLectureId={openReactionLectureId}
                          setOpenReactionLectureId={setOpenReactionLectureId}
                          onCircularLikeClick={handleCircularLikeClick}
                          onSelectReaction={handleSelectReaction}
                          openActionModal={openActionModal}
                          onOpenVideo={handleOpenVideo}
                          isDark={isDark}
                        />

                        <NotebookAyatTableView
                          currentLectureVerses={currentLectureVerses}
                          activeCategory={activeCategory}
                          activeLecture={activeLecture}
                          searchQuery={searchQuery}
                          sortField={sortField}
                          setSortField={setSortField}
                          verseCitationsMap={verseCitationsMap}
                          onOpenAyatModal={handleOpenAyatModal}
                          onOpenCitationsModal={(verse, citations) =>
                            setActiveCitationsModal({ verse, citations })
                          }
                          onOpenVideo={handleOpenVideo}
                          onOpenMultiVideo={setActiveMultiVideoModal}
                          isDark={isDark}
                        />
                      </>
                    )}

                    {/* ViewMode: CONCORDANCE (114-Chapter Sequence) */}
                    {viewMode === "CONCORDANCE" && (
                      <NotebookChapterConcordanceView
                        chapterConcordance={chapterConcordance}
                        onOpenAyatModal={handleOpenAyatModal}
                        onOpenCitationsModal={(verse, citations) =>
                          setActiveCitationsModal({ verse, citations })
                        }
                        onOpenVideo={handleOpenVideo}
                        onOpenMultiVideo={setActiveMultiVideoModal}
                        isDark={isDark}
                      />
                    )}
                  </>
                )}
              </Box>

              {/* Right Side Ribbons (Categories of Selected Language) */}
              <NotebookCategoryRibbons
                activeLanguage={activeLanguage}
                languageCategories={languageCategories}
                activeCategoryIndex={activeCategoryIndex}
                onCategoryChange={handleCategoryChange}
                isDark={isDark}
              />
            </Box>
          </Box>
        </Card>
      </div>

      {/* Pop Modals */}
      <NotebookAyatDetailModal
        activeAyatModal={activeAyatModal}
        onClose={() => setActiveAyatModal(null)}
        liveArabicText={liveArabicText}
        isFetchingLiveArabic={isFetchingLiveArabic}
        verseCitationsMap={verseCitationsMap}
        onOpenVideo={handleOpenVideo}
        isDark={isDark}
      />

      <NotebookCitationsModal
        activeCitationsModal={activeCitationsModal}
        onClose={() => setActiveCitationsModal(null)}
        metaCategories={metaCategories}
        onJumpToLecture={handleJumpToLecture}
        onOpenVideo={handleOpenVideo}
        isDark={isDark}
      />

      <NotebookMultiVideoModal
        activeMultiVideoModal={activeMultiVideoModal}
        onClose={() => setActiveMultiVideoModal(null)}
        onPlayVideo={handleOpenVideo}
      />

      <NotebookActionModal
        activeActionModal={activeActionModal}
        actionModalLecture={actionModalLecture}
        onClose={() => {
          setActiveActionModal(null);
          setActionModalLecture(null);
        }}
        onOpenVideo={handleOpenVideo}
      />

      <NotebookVideoPlayerModal
        activeVideoModal={activeVideoModal}
        onClose={() => setActiveVideoModal(null)}
        isDark={isDark}
      />
    </Container>
  );
}
