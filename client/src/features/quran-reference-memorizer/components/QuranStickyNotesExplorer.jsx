// client/src/features/quran-reference-memorizer/components/QuranStickyNotesExplorer.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Select,
  Group,
  Stack,
  Badge,
  Card,
  Modal,
  Loader,
  TextInput,
  ActionIcon,
  Tooltip,
  Paper,
  Tabs,
} from "@mantine/core";
import {
  IconSearch,
  IconBook,
  IconArrowLeft,
  IconVideo,
  IconBrandYoutube,
  IconExternalLink,
  IconSparkles,
  IconFolder,
  IconFileText,
  IconRefresh,
  IconListDetails,
  IconQuote,
  IconHelpCircle,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { SURAH_LIST } from "../../../components/common/QuranVersePicker";
import { fetchVerseReferences } from "../api/ayatsApi";

const STICKY_COLORS = [
  { bg: "#fff9c4", border: "#fbc02d", shadow: "rgba(251, 192, 45, 0.25)", text: "#5d4037" }, // Soft Yellow
  { bg: "#e1f5fe", border: "#29b6f6", shadow: "rgba(41, 182, 246, 0.25)", text: "#01579b" }, // Soft Blue
  { bg: "#e8f5e9", border: "#66bb6a", shadow: "rgba(102, 187, 106, 0.25)", text: "#1b5e20" }, // Soft Mint
  { bg: "#f3e5f5", border: "#ab47bc", shadow: "rgba(171, 71, 188, 0.25)", text: "#4a148c" }, // Soft Lavender
  { bg: "#ffe0b2", border: "#ffa726", shadow: "rgba(255, 167, 38, 0.25)", text: "#e65100" }, // Soft Peach
  { bg: "#fce4ec", border: "#ec407a", shadow: "rgba(236, 64, 122, 0.25)", text: "#880e4f" }, // Soft Rose
];

export function QuranStickyNotesExplorer({ user }) {
  // Navigation levels: "CATEGORIES" | "LECTURES" | "VERSES"
  const [level, setLevel] = useState("CATEGORIES");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);

  // Meta Categories state loaded from API
  const [metaCategories, setMetaCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Search in current view
  const [filterQuery, setFilterQuery] = useState("");

  // Top Reverse Verse Lookup State
  const [selectedSurah, setSelectedSurah] = useState("");
  const [selectedAyat, setSelectedAyat] = useState("");
  const [isSearchingReferences, setIsSearchingReferences] = useState(false);
  const [verseReferencesResult, setVerseReferencesResult] = useState(null);
  const [lookupError, setLookupError] = useState("");

  // Active video modal
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [activeMultiVideoModal, setActiveMultiVideoModal] = useState(null);

  // Active Season for selected lecture in Level 3
  const [activeSeasonIndex, setActiveSeasonIndex] = useState(0);

  // Modal for Seasons/Episodes triggered from Level 2 card
  const [seasonsModalLecture, setSeasonsModalLecture] = useState(null);
  const [modalSeasonIndex, setModalSeasonIndex] = useState(0);

  // Fetch Meta Categories on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCategories(true);
    fetch(`/api/category-lectures/meta?_t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const englishAndUrduOnly = data.filter((cat) => {
            const l = (cat.language || "eng").toLowerCase();
            return l !== "hindi" && l !== "hin";
          });
          setMetaCategories(englishAndUrduOnly);
        }
      })
      .catch((err) => {
        console.error("Error loading categories:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute available ayats for selected surah in top lookup
  const currentSurahObj = useMemo(() => {
    return SURAH_LIST.find((s) => s.value === selectedSurah);
  }, [selectedSurah]);

  const topAyatOptions = useMemo(() => {
    if (!currentSurahObj) return [];
    return Array.from({ length: currentSurahObj.total }, (_, i) => ({
      value: String(i + 1),
      label: `Ayat ${i + 1}`,
    }));
  }, [currentSurahObj]);

  // Execute reverse lookup
  const handleLookupVerse = async () => {
    if (!selectedSurah || !selectedAyat) return;
    setIsSearchingReferences(true);
    setLookupError("");
    setVerseReferencesResult(null);

    try {
      const data = await fetchVerseReferences(selectedSurah, selectedAyat);
      setVerseReferencesResult(data);
    } catch (err) {
      setLookupError(err.message || "Failed to search references for this verse.");
    } finally {
      setIsSearchingReferences(false);
    }
  };

  const handleResetLookup = () => {
    setSelectedSurah("");
    setSelectedAyat("");
    setVerseReferencesResult(null);
    setLookupError("");
  };

  // Extract all video URLs attached to a verse/occurrence
  const getAyatVideoList = (verse) => {
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
  };

  // Helper to extract video timestamps for badges (e.g. 1:40 - 5:20)
  const parseVideoTimestamps = (url) => {
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
  };

  // Helper to extract embeddable video URL natively supporting start & end timestamps
  const getEmbedUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    const trimmed = url.trim();

    if (trimmed.includes("youtube.com/embed/")) {
      return trimmed;
    }

    if (trimmed.includes("youtube.com/watch")) {
      try {
        const urlObj = new URL(trimmed);
        const vId = urlObj.searchParams.get("v");
        if (vId) {
          urlObj.searchParams.delete("v");
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
  };

  /**
   * Converts any YouTube URL (embed, watch, or youtu.be) into a direct YouTube watch URL
   * with clean timestamp parameter (?t=...s) so users can open and play it directly on YouTube
   * even if third-party website embedding has been restricted by the video owner.
   */
  const getYouTubeWatchUrl = (url) => {
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
  };

  // Helper for lecture name (supports string or array of strings)
  const getLectureName = (lectureName) => {
    if (Array.isArray(lectureName)) return lectureName[0] || "";
    return typeof lectureName === "string" ? lectureName : "";
  };

  const getLectureAliases = (lectureName) => {
    if (Array.isArray(lectureName)) return lectureName.slice(1);
    return [];
  };

  // Helper to extract primary PDF booklet or study notes URL
  const getLecturePdfUrl = (lecture) => {
    if (!lecture) return null;
    const firstPdf = (Array.isArray(lecture.pdf_url) && lecture.pdf_url.length > 0) ? lecture.pdf_url[0] : lecture.pdf_url;
    const urlFromArr = typeof firstPdf === "object" ? firstPdf?.url : firstPdf;
    const urlFromBooklets = (Array.isArray(lecture.pdf_booklet_urls) && lecture.pdf_booklet_urls.length > 0) ? lecture.pdf_booklet_urls[0] : "";
    return (
      urlFromArr ||
      lecture.pdf_link ||
      urlFromBooklets ||
      null
    );
  };

  // Helper to extract Seasons and Episodes list from lecture metadata
  const getLectureSeasons = (lecture) => {
    if (!lecture) return [];
    if (Array.isArray(lecture.seasons) && lecture.seasons.length > 0) {
      return lecture.seasons;
    }
    const fallbackUrls = [
      ...(lecture.full_lecture_video_url ? [lecture.full_lecture_video_url] : []),
      ...(Array.isArray(lecture.video_urls) ? lecture.video_urls : []),
      ...(Array.isArray(lecture.youtube_urls) ? lecture.youtube_urls : []),
      ...(lecture.video_url ? [lecture.video_url] : []),
    ];
    if (fallbackUrls.length > 0) {
      return [
        {
          season_name: lecture.season || "Season 1",
          year_delivered: lecture.year_delivered || "",
          episodes: fallbackUrls.map((u, i) => ({
            episode_number: `Part ${String(i + 1).padStart(2, "0")}`,
            episode_title: `Full Session Recording ${i + 1}`,
            episode_url: u,
          })),
        },
      ];
    }
    return [];
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!filterQuery) return metaCategories;
    const q = filterQuery.toLowerCase();
    return metaCategories.filter((cat) => {
      const name = (cat.category_name || "").toLowerCase();
      const lang = (cat.language || "").toLowerCase();
      return name.includes(q) || lang.includes(q);
    });
  }, [metaCategories, filterQuery]);

  // Filtered lectures for current category (strictly ordered 1, 2, 3...)
  const currentLectures = useMemo(() => {
    if (!selectedCategory) return [];
    const lectures = selectedCategory.lectures || [];
    const sorted = [...lectures].sort((a, b) => {
      const numA = Number(a.lecture_id) || 0;
      const numB = Number(b.lecture_id) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.lecture_name || "").localeCompare(String(b.lecture_name || ""));
    });
    if (!filterQuery) return sorted;
    const q = filterQuery.toLowerCase();
    return sorted.filter((lec) => {
      const names = Array.isArray(lec.lecture_name)
        ? lec.lecture_name
        : [lec.lecture_name || ""];
      const matchesName = names.some((n) => String(n).toLowerCase().includes(q));
      const year = String(lec.year_delivered || "").toLowerCase();
      return matchesName || year.includes(q);
    });
  }, [selectedCategory, filterQuery]);

  // Filtered verses for current lecture
  const currentVerses = useMemo(() => {
    if (!selectedLecture) return [];
    const verses = selectedLecture.ayat_references || [];
    if (!filterQuery) return verses;
    const q = filterQuery.toLowerCase();
    return verses.filter((v) => {
      const sName = (v.surah_name || "").toLowerCase();
      const eng = (v.english_translation || "").toLowerCase();
      const urdu = (v.urdu_translation || "").toLowerCase();
      const arab = (v.arabic_text || "").toLowerCase();
      const notes = (v.points_notes_eng || v.points_notes_urdu || "").toLowerCase();
      const sNum = String(v.surah_number);
      const aNum = String(v.ayat_number);
      return (
        sName.includes(q) ||
        eng.includes(q) ||
        urdu.includes(q) ||
        arab.includes(q) ||
        notes.includes(q) ||
        sNum === q ||
        aNum === q
      );
    });
  }, [selectedLecture, filterQuery]);

  // Seasons and Episodes for the currently selected lecture (Level 3)
  const selectedLectureSeasons = useMemo(() => {
    return getLectureSeasons(selectedLecture);
  }, [selectedLecture]);

  const currentSeasonObj = useMemo(() => {
    if (selectedLectureSeasons.length === 0) return null;
    const idx = Math.min(activeSeasonIndex, selectedLectureSeasons.length - 1);
    return selectedLectureSeasons[idx] || selectedLectureSeasons[0];
  }, [selectedLectureSeasons, activeSeasonIndex]);

  const selectedLectureEpisodes = useMemo(() => {
    if (!currentSeasonObj) return [];
    return Array.isArray(currentSeasonObj.episodes) ? currentSeasonObj.episodes : [];
  }, [currentSeasonObj]);

  const selectedLecturePdfUrl = useMemo(() => {
    return getLecturePdfUrl(selectedLecture);
  }, [selectedLecture]);

  // Seasons and Episodes for the standalone seasons modal (triggered from Level 2)
  const modalLectureSeasons = useMemo(() => {
    return getLectureSeasons(seasonsModalLecture);
  }, [seasonsModalLecture]);

  const modalCurrentSeason = useMemo(() => {
    if (modalLectureSeasons.length === 0) return null;
    const idx = Math.min(modalSeasonIndex, modalLectureSeasons.length - 1);
    return modalLectureSeasons[idx] || modalLectureSeasons[0];
  }, [modalLectureSeasons, modalSeasonIndex]);

  const modalEpisodesList = useMemo(() => {
    if (!modalCurrentSeason) return [];
    return Array.isArray(modalCurrentSeason.episodes) ? modalCurrentSeason.episodes : [];
  }, [modalCurrentSeason]);

  return (
    <Container size="xl" py="lg">
      <style>{`
        .sticky-card {
          position: relative;
          border-radius: 6px;
          padding: 20px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          min-height: 190px;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08);
        }
        .sticky-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 14px 28px rgba(0,0,0,0.12), 0 6px 10px rgba(0,0,0,0.08);
          z-index: 2;
        }
        .sticky-pin {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 18px;
          background: radial-gradient(circle at 30% 30%, #ef4444, #991b1b);
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.6);
        }
        .sticky-tape {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 70px;
          height: 22px;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(2px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border-radius: 2px;
        }
        .arabic-text-render {
          font-family: 'Amiri', 'Traditional Arabic', 'Scheherazade New', 'Lateef', serif;
          font-size: 22px;
          line-height: 1.8;
          text-align: right;
          direction: rtl;
        }
      `}</style>

      {/* Hero Header */}
      <Paper
        p="xl"
        radius="lg"
        mb="xl"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #064e3b 100%)",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Group gap="md">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              <IconBook size={28} color="white" />
            </div>
            <div>
              <Title order={2} style={{ color: "#ffffff", fontWeight: 700, letterSpacing: "-0.5px" }}>
                Quran Sticky Notes & Lecture Explorer
              </Title>
              <Text size="sm" c="dimmed" style={{ color: "#94a3b8" }}>
                Interactive visual sticky notes organizing categories, lectures, and cited verses with video clips.
              </Text>
            </div>
          </Group>
          <Badge size="lg" variant="gradient" gradient={{ from: "teal", to: "cyan" }}>
            {metaCategories.length} Categories • 77 Lectures • 3,918+ Verses
          </Badge>
        </Group>

        {/* Top Reverse Verse Lookup Box */}
        <Paper
          p="md"
          radius="md"
          mt="lg"
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <IconSparkles size={18} color="#34d399" />
              <Text fw={600} size="sm" style={{ color: "#f1f5f9" }}>
                Reverse Verse Lookup: Find Everywhere an Ayah is Cited
              </Text>
            </Group>
            {verseReferencesResult && (
              <Badge color="teal" variant="light" size="sm">
                Found {verseReferencesResult.total_occurrences} match(es)
              </Badge>
            )}
          </Group>

          <Group align="flex-end" gap="sm" wrap="wrap">
            <Select
              label="Select Surah"
              placeholder="Pick Surah (1-114)..."
              data={SURAH_LIST}
              searchable
              clearable
              value={selectedSurah}
              onChange={(val) => {
                setSelectedSurah(val || "");
                setSelectedAyat("");
              }}
              style={{ minWidth: 260, flex: 1 }}
              styles={{
                input: { background: "rgba(255,255,255,0.95)", color: "#0f172a", fontWeight: 500 },
                label: { color: "#e2e8f0", fontSize: 12, marginBottom: 4 },
              }}
            />

            <Select
              label="Select Ayat"
              placeholder={selectedSurah ? "Pick Ayat..." : "Select Surah first"}
              disabled={!selectedSurah}
              data={topAyatOptions}
              searchable
              clearable
              value={selectedAyat}
              onChange={(val) => setSelectedAyat(val || "")}
              style={{ minWidth: 150, width: 170 }}
              styles={{
                input: { background: "rgba(255,255,255,0.95)", color: "#0f172a", fontWeight: 500 },
                label: { color: "#e2e8f0", fontSize: 12, marginBottom: 4 },
              }}
            />

            <Button
              color="teal"
              leftSection={<IconSearch size={16} />}
              disabled={!selectedSurah || !selectedAyat || isSearchingReferences}
              loading={isSearchingReferences}
              onClick={handleLookupVerse}
            >
              Search Lectures
            </Button>

            {(selectedSurah || selectedAyat || verseReferencesResult) && (
              <Button variant="subtle" color="gray" leftSection={<IconRefresh size={16} />} onClick={handleResetLookup}>
                Clear
              </Button>
            )}
          </Group>

          {/* Reverse Lookup Results */}
          {lookupError && (
            <Text c="red.4" size="xs" mt="sm">
              {lookupError}
            </Text>
          )}

          {verseReferencesResult && (
            <div style={{ marginTop: 16 }}>
              {verseReferencesResult.total_occurrences === 0 ? (
                <Paper p="sm" radius="md" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <Text size="sm" c="gray.4" ta="center">
                    Surah {verseReferencesResult.surah_number}, Ayat {verseReferencesResult.ayat_number} was not cited in any loaded lectures.
                  </Text>
                </Paper>
              ) : (
                <Stack gap="xs">
                  <Text size="xs" c="teal.3" fw={600}>
                    Occurrences for Surah {verseReferencesResult.surah_number}, Ayat {verseReferencesResult.ayat_number}:
                  </Text>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {verseReferencesResult.occurrences.map((occ, idx) => (
                      <Paper
                        key={idx}
                        p="sm"
                        radius="md"
                        style={{
                          background: "rgba(255, 255, 255, 0.95)",
                          color: "#1e293b",
                          border: "1px solid #cbd5e1",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                        }}
                      >
                        <Group justify="space-between" mb={4}>
                          <Badge size="xs" color={occ.language === "urdu" ? "green" : "blue"} variant="light">
                            {occ.category_name} ({occ.language?.toUpperCase() || "ENG"})
                          </Badge>
                          {occ.year_delivered && (
                            <Badge size="xs" variant="outline" color="gray">
                              {occ.year_delivered}
                            </Badge>
                          )}
                        </Group>

                        <Text fw={700} size="sm" c="dark.8">
                          {getLectureName(occ.lecture_name)}
                        </Text>

                        {occ.arabic_text && (
                          <Text
                            className="arabic-text-render"
                            style={{ fontSize: 16, color: "#065f46", margin: "6px 0" }}
                          >
                            {occ.arabic_text}
                          </Text>
                        )}

                        <Text size="xs" c="dark.6" lineClamp={2} mb={6}>
                          {occ.english_translation || occ.urdu_translation}
                        </Text>

                        {(occ.points_notes_eng || occ.points_notes_urdu) && (
                          <Text size="xs" c="dimmed" fs="italic" lineClamp={2} mb={6}>
                            💡 {occ.points_notes_eng || occ.points_notes_urdu}
                          </Text>
                        )}

                        {(() => {
                          const occVideos = getAyatVideoList(occ);
                          if (occVideos.length === 0) return null;
                          if (occVideos.length === 1) {
                            return (
                              <Button
                                size="compact-xs"
                                variant="light"
                                color="red"
                                leftSection={<IconBrandYoutube size={14} />}
                                onClick={() =>
                                  setActiveVideoModal({
                                    title: `${getLectureName(occ.lecture_name)} - Surah ${occ.surah_number}:${occ.ayat_number}`,
                                    url: occVideos[0],
                                  })
                                }
                              >
                                Watch Clip
                              </Button>
                            );
                          }
                          return (
                            <Button
                              size="compact-xs"
                              variant="filled"
                              color="red"
                              leftSection={<IconBrandYoutube size={14} />}
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
                                  {occVideos.length}
                                </span>
                              }
                              onClick={() =>
                                setActiveMultiVideoModal({
                                  title: `${getLectureName(occ.lecture_name)} - Surah ${occ.surah_number}:${occ.ayat_number}`,
                                  videos: occVideos,
                                  verse: occ,
                                })
                              }
                            >
                              Clips
                            </Button>
                          );
                        })()}
                      </Paper>
                    ))}
                  </div>
                </Stack>
              )}
            </div>
          )}
        </Paper>
      </Paper>

      {/* Navigation Breadcrumb Bar */}
      <Paper p="sm" radius="md" withBorder mb="lg" style={{ background: "#f8fafc" }}>
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <Button
              variant={level === "CATEGORIES" ? "filled" : "light"}
              color="teal"
              size="xs"
              leftSection={<IconFolder size={15} />}
              onClick={() => {
                setLevel("CATEGORIES");
                setSelectedCategory(null);
                setSelectedLecture(null);
                setFilterQuery("");
              }}
            >
              All Categories ({metaCategories.length})
            </Button>

            {selectedCategory && (
              <>
                <Text size="sm" c="dimmed">
                  ➔
                </Text>
                <Button
                  variant={level === "LECTURES" ? "filled" : "light"}
                  color="indigo"
                  size="xs"
                  leftSection={<IconListDetails size={15} />}
                  onClick={() => {
                    setLevel("LECTURES");
                    setSelectedLecture(null);
                    setFilterQuery("");
                  }}
                >
                  {selectedCategory.category_name} (
                  {selectedCategory.lectures ? selectedCategory.lectures.length : 0} lectures)
                </Button>
              </>
            )}

            {selectedLecture && (
              <>
                <Text size="sm" c="dimmed">
                  ➔
                </Text>
                <Button variant="filled" color="grape" size="xs" leftSection={<IconBook size={15} />}>
                  {getLectureName(selectedLecture.lecture_name)} (
                  {selectedLecture.ayat_references ? selectedLecture.ayat_references.length : 0} ayats)
                </Button>
              </>
            )}
          </Group>

          <TextInput
            placeholder={`Search ${level.toLowerCase()}...`}
            size="xs"
            leftSection={<IconSearch size={14} />}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ width: 220 }}
          />
        </Group>
      </Paper>

      {/* Main Board Content */}
      {isLoadingCategories ? (
        <Group justify="center" py="xl">
          <Loader size="md" color="teal" />
          <Text size="sm" c="dimmed">
            Loading Sticky Notes Canvas...
          </Text>
        </Group>
      ) : (
        <>
          {/* LEVEL 1: CATEGORIES STICKY BOARD */}
          {level === "CATEGORIES" && (
            <div>
              <Group justify="space-between" mb="md">
                <Text fw={700} size="md" c="dark.7">
                  📌 Categories Canvas ({filteredCategories.length} categories)
                </Text>
                <Text size="xs" c="dimmed">
                  Click on any category note to unfold its lectures
                </Text>
              </Group>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px",
                }}
              >
                {filteredCategories.map((cat, idx) => {
                  const palette = STICKY_COLORS[idx % STICKY_COLORS.length];
                  const lecCount = cat.lectures ? cat.lectures.length : cat.total_lectures || 0;
                  const totalAyats = (cat.lectures || []).reduce(
                    (sum, l) => sum + (l.total_ayats || l.ayat_count || 0),
                    0
                  );
                  const isUrdu = (cat.language || "eng").toLowerCase() === "urdu";
                  const rotation = idx % 2 === 0 ? "-1deg" : "1.2deg";

                  return (
                    <div
                      key={cat._id || idx}
                      className="sticky-card"
                      style={{
                        background: palette.bg,
                        border: `1px solid ${palette.border}`,
                        color: palette.text,
                        transform: `rotate(${rotation})`,
                      }}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setLevel("LECTURES");
                        setFilterQuery("");
                      }}
                    >
                      <div className="sticky-tape" />

                      <div style={{ marginTop: 10 }}>
                        <Group justify="space-between" align="flex-start" mb="xs">
                          <Badge
                            size="sm"
                            variant="filled"
                            color={isUrdu ? "green" : "blue"}
                            style={{ textTransform: "uppercase" }}
                          >
                            {isUrdu ? "Urdu Category" : "English Category"}
                          </Badge>
                          <span style={{ fontSize: 20 }}>{isUrdu ? "📗" : "📁"}</span>
                        </Group>

                        <Text fw={700} size="lg" style={{ lineHeight: 1.3, marginBottom: 8, color: palette.text }}>
                          {cat.category_name}
                        </Text>
                      </div>

                      <div style={{ borderTop: `1px dashed ${palette.border}`, paddingTop: 12, marginTop: 12 }}>
                        <Group justify="space-between">
                          <Group gap="xs">
                            <Badge size="xs" color="gray" variant="light">
                              {lecCount} Lectures
                            </Badge>
                            {totalAyats > 0 && (
                              <Badge size="xs" color="teal" variant="light">
                                {totalAyats} Ayats
                              </Badge>
                            )}
                          </Group>
                          <Button size="compact-xs" variant="white" color="dark">
                            Explore ➔
                          </Button>
                        </Group>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEVEL 2: LECTURES STICKY BOARD */}
          {level === "LECTURES" && selectedCategory && (
            <div>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={() => {
                      setLevel("CATEGORIES");
                      setSelectedCategory(null);
                    }}
                  >
                    <IconArrowLeft size={16} />
                  </ActionIcon>
                  <div>
                    <Text fw={700} size="md" c="dark.7">
                      📖 {selectedCategory.category_name} - Lectures ({currentLectures.length})
                    </Text>
                    <Text size="xs" c="dimmed">
                      Click on any lecture note to view its cited ayats, translations, and video clips
                    </Text>
                  </div>
                </Group>
              </Group>

              {currentLectures.length === 0 ? (
                <Paper p="xl" ta="center" withBorder radius="md">
                  <Text size="sm" c="dimmed">
                    No lectures found matching "{filterQuery}".
                  </Text>
                </Paper>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {currentLectures.map((lec, idx) => {
                    const palette = STICKY_COLORS[(idx + 2) % STICKY_COLORS.length];
                    const count = lec.total_ayats || lec.ayat_count || (lec.ayat_references ? lec.ayat_references.length : 0);
                    const rotation = idx % 2 === 0 ? "1deg" : "-1deg";
                    const lecPdfUrl = getLecturePdfUrl(lec);
                    const lecSeasons = getLectureSeasons(lec);
                    const totalEpisodes = lecSeasons.reduce(
                      (sum, s) => sum + (Array.isArray(s.episodes) ? s.episodes.length : 0),
                      0
                    );

                    return (
                      <div
                        key={lec._id || idx}
                        className="sticky-card"
                        style={{
                          background: palette.bg,
                          border: `1px solid ${palette.border}`,
                          color: palette.text,
                          transform: `rotate(${rotation})`,
                        }}
                        onClick={() => {
                          setSelectedLecture(lec);
                          setActiveSeasonIndex(0);
                          setLevel("VERSES");
                          setFilterQuery("");
                        }}
                      >
                        <div className="sticky-pin" />

                        <div style={{ marginTop: 10 }}>
                          <Group justify="space-between" mb="xs">
                            <Badge size="xs" variant="outline" color="dark">
                              Lecture {lec.lecture_id}
                            </Badge>
                            {lec.year_delivered && (
                              <Badge size="xs" color="gray" variant="light">
                                Year: {lec.year_delivered}
                              </Badge>
                            )}
                          </Group>

                          <Text fw={700} size="md" style={{ lineHeight: 1.3, marginBottom: 4, color: palette.text }}>
                            {getLectureName(lec.lecture_name)}
                          </Text>
                          {getLectureAliases(lec.lecture_name).length > 0 && (
                            <Text size="xs" c="dimmed" fs="italic" mb={4}>
                              AKA: {getLectureAliases(lec.lecture_name).join(", ")}
                            </Text>
                          )}
                        </div>

                        {/* Quick Action Badges for PDF Booklet & Video Seasons */}
                        {(lecPdfUrl || totalEpisodes > 0) && (
                          <Group gap="xs" my={6} wrap="wrap">
                            {lecPdfUrl && (
                              <Button
                                size="compact-xs"
                                variant="light"
                                color="teal"
                                leftSection={<IconFileText size={12} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(lecPdfUrl, "_blank", "noopener,noreferrer");
                                }}
                                styles={{ root: { fontSize: 11, height: 22 } }}
                              >
                                PDF Booklet
                              </Button>
                            )}
                            {totalEpisodes > 0 && (
                              <Button
                                size="compact-xs"
                                variant="light"
                                color="indigo"
                                leftSection={<IconPlayerPlay size={12} fill="currentColor" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSeasonsModalLecture(lec);
                                  setModalSeasonIndex(0);
                                }}
                                styles={{ root: { fontSize: 11, height: 22 } }}
                              >
                                {lecSeasons.length > 1
                                  ? `${lecSeasons.length} Seasons`
                                  : `${totalEpisodes} Episodes`}
                              </Button>
                            )}
                          </Group>
                        )}

                        <div style={{ borderTop: `1px dashed ${palette.border}`, paddingTop: 12, marginTop: 8 }}>
                          <Group justify="space-between">
                            <Badge size="sm" color="teal" variant="filled">
                              {count} Cited Ayats
                            </Badge>
                            <Button size="compact-xs" variant="white" color="dark">
                              View Verses ➔
                            </Button>
                          </Group>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: VERSES STICKY BOARD */}
          {level === "VERSES" && selectedLecture && (
            <div>
              <Group justify="space-between" mb="md" wrap="wrap">
                <Group gap="sm">
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={() => {
                      setLevel("LECTURES");
                      setSelectedLecture(null);
                    }}
                  >
                    <IconArrowLeft size={16} />
                  </ActionIcon>
                  <div>
                    <Text fw={700} size="md" c="dark.7">
                      📜 Verses in: {getLectureName(selectedLecture.lecture_name)} ({currentVerses.length} ayats)
                    </Text>
                    <Text size="xs" c="dimmed">
                      {selectedCategory.category_name} • Year: {selectedLecture.year_delivered || "N/A"}
                    </Text>
                  </div>
                </Group>
              </Group>

              {/* Lecture Overview & Media Showcase (Seasons, Episodes & PDF Booklet) */}
              <Paper
                p="md"
                radius="md"
                withBorder
                mb="xl"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {/* Left Column: Lecture Info, PDF Booklet, and Full Stream */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderRight: "1px solid #f1f5f9",
                      paddingRight: "16px",
                    }}
                  >
                    <div>
                      <Group justify="space-between" align="flex-start" mb="xs">
                        <Badge size="md" color="indigo" variant="filled">
                          Lecture #{selectedLecture.lecture_id || 1}
                        </Badge>
                        {selectedLecture.year_delivered && (
                          <Badge size="sm" color="gray" variant="light">
                            Delivered: {selectedLecture.year_delivered}
                          </Badge>
                        )}
                      </Group>

                      <Title order={3} style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.3, marginBottom: 6 }}>
                        {getLectureName(selectedLecture.lecture_name)}
                      </Title>

                      {getLectureAliases(selectedLecture.lecture_name).length > 0 && (
                        <Group gap={6} mb="sm" wrap="wrap">
                          <Text size="xs" c="dimmed" fw={700}>
                            Also Known As:
                          </Text>
                          {getLectureAliases(selectedLecture.lecture_name).map((alias, aIdx) => (
                            <Badge key={aIdx} size="xs" variant="light" color="indigo">
                              {alias}
                            </Badge>
                          ))}
                        </Group>
                      )}

                      <Group gap="xs" mt="xs" mb="md" wrap="wrap">
                        <Badge color="teal" variant="light" size="sm" leftSection={<IconBook size={12} />}>
                          {currentVerses.length} Cited Ayats
                        </Badge>
                        <Badge color="violet" variant="light" size="sm" leftSection={<IconListDetails size={12} />}>
                          {selectedLectureSeasons.length} Season(s) •{" "}
                          {selectedLectureSeasons.reduce(
                            (sum, s) => sum + (Array.isArray(s.episodes) ? s.episodes.length : 0),
                            0
                          )}{" "}
                          Episodes
                        </Badge>
                        <Badge color="blue" variant="outline" size="sm">
                          {selectedCategory.category_name}
                        </Badge>
                      </Group>
                    </div>

                    <Stack gap="xs" mt="sm">
                      {/* PDF Booklet Button */}
                      {selectedLecturePdfUrl ? (
                        <Button
                          color="teal"
                          variant="filled"
                          leftSection={<IconFileText size={16} />}
                          onClick={() => window.open(selectedLecturePdfUrl, "_blank", "noopener,noreferrer")}
                          style={{
                            backgroundColor: "#059669",
                            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedLecture.pdf_url?.[0]?.title || selectedLecture.pdf_title || "View PDF Booklet & Notes"}
                        </Button>
                      ) : (
                        <Paper p="xs" radius="sm" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                          <Text size="xs" c="dimmed" ta="center">
                            📄 PDF Booklet being digitized for this lecture
                          </Text>
                        </Paper>
                      )}

                      {/* Stream Full Lecture Button if available */}
                      {(() => {
                        const fullVideoUrl =
                          selectedLecture.full_lecture_video_url ||
                          (Array.isArray(selectedLecture.video_urls) ? selectedLecture.video_urls[0] : "") ||
                          (Array.isArray(selectedLecture.youtube_urls) ? selectedLecture.youtube_urls[0] : "") ||
                          selectedLecture.video_url;

                        if (!fullVideoUrl) return null;

                        return (
                          <Button
                            color="red"
                            variant="light"
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={() =>
                              setActiveVideoModal({
                                title: `${getLectureName(selectedLecture.lecture_name)} - Full Recording`,
                                url: fullVideoUrl,
                              })
                            }
                          >
                            Stream Full Lecture Video
                          </Button>
                        );
                      })()}
                    </Stack>
                  </div>

                  {/* Right Column: Season & Episodes Viewer */}
                  <div>
                    <Group justify="space-between" align="center" mb="xs">
                      <Group gap={6}>
                        <IconVideo size={18} color="#4f46e5" />
                        <Text size="sm" fw={700} c="dark.8">
                          Seasons & Video Episodes
                        </Text>
                      </Group>

                      {/* Season Switcher if multiple seasons */}
                      {selectedLectureSeasons.length > 1 ? (
                        <Group gap={4}>
                          {selectedLectureSeasons.map((s, sIdx) => {
                            const isCurrent = activeSeasonIndex === sIdx;
                            return (
                              <Button
                                key={sIdx}
                                size="compact-xs"
                                radius="xl"
                                variant={isCurrent ? "filled" : "light"}
                                color="indigo"
                                onClick={() => setActiveSeasonIndex(sIdx)}
                                style={{ fontSize: 11, fontWeight: 700 }}
                              >
                                {s.season_name || `Season ${sIdx + 1}`}
                              </Button>
                            );
                          })}
                        </Group>
                      ) : selectedLectureSeasons.length === 1 ? (
                        <Badge size="xs" variant="light" color="indigo">
                          {selectedLectureSeasons[0].season_name || "Season 1"}
                        </Badge>
                      ) : null}
                    </Group>

                    <Text size="xs" c="dimmed" mb="xs">
                      {currentSeasonObj
                        ? `${currentSeasonObj.season_name || "Season 1"} • ${selectedLectureEpisodes.length} episodes available`
                        : "Episodes and recorded parts in this lecture series:"}
                    </Text>

                    {selectedLectureEpisodes.length === 0 ? (
                      <Paper p="md" radius="md" withBorder ta="center" style={{ background: "#f8fafc" }}>
                        <Text size="xs" c="dimmed">
                          No video episodes uploaded yet for this lecture.
                        </Text>
                      </Paper>
                    ) : (
                      <Stack gap={6} style={{ maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
                        {selectedLectureEpisodes.map((ep, idx) => (
                          <Paper
                            key={ep.id || idx}
                            p="xs"
                            radius="md"
                            withBorder
                            onClick={() => {
                              const epUrl = ep.episode_url || ep.videoUrl || ep.video_url;
                              if (epUrl) {
                                setActiveVideoModal({
                                  title: `${getLectureName(selectedLecture.lecture_name)} - ${ep.episode_title || ep.title || `Episode ${idx + 1}`}`,
                                  url: epUrl,
                                });
                              }
                            }}
                            style={{
                              cursor: "pointer",
                              background: idx === 0 ? "#eef2ff" : "#ffffff",
                              borderColor: idx === 0 ? "#818cf8" : "#e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  backgroundColor: "#4f46e5",
                                  color: "white",
                                  fontSize: 11,
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
                                <Text size="xs" fw={700} lineClamp={1}>
                                  {ep.episode_title || ep.title || ep.episode_number || `Episode ${idx + 1}`}
                                </Text>
                                <Text size="10px" c="dimmed">
                                  {ep.episode_number ? `${ep.episode_number} • ` : ""}
                                  {ep.duration || "Watch Episode"}
                                </Text>
                              </div>
                            </Group>
                            <ActionIcon size="sm" variant="light" color="indigo">
                              <IconPlayerPlay size={13} fill="currentColor" />
                            </ActionIcon>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </div>
                </div>
              </Paper>

              {currentVerses.length === 0 ? (
                <Paper p="xl" ta="center" withBorder radius="md">
                  <Text size="sm" c="dimmed">
                    No verses found matching "{filterQuery}".
                  </Text>
                </Paper>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {currentVerses.map((verse, idx) => {
                    const palette = STICKY_COLORS[idx % STICKY_COLORS.length];
                    const videoList = getAyatVideoList(verse);

                    return (
                      <Card
                        key={verse._id || idx}
                        p="lg"
                        radius="md"
                        style={{
                          background: palette.bg,
                          border: `1px solid ${palette.border}`,
                          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <Group justify="space-between" mb="xs">
                            <Badge color="dark" size="sm" variant="filled">
                              Surah {verse.surah_number} : {verse.ayat_number}
                            </Badge>
                            <Badge color="teal" size="sm" variant="light">
                              {verse.surah_name || `Surah ${verse.surah_number}`}
                            </Badge>
                          </Group>

                          {/* Arabic Text */}
                          {verse.arabic_text && (
                            <Paper
                              p="xs"
                              radius="sm"
                              mb="sm"
                              style={{
                                background: "rgba(255, 255, 255, 0.7)",
                                border: "1px solid rgba(0,0,0,0.05)",
                              }}
                            >
                              <Text className="arabic-text-render" style={{ color: "#064e3b" }}>
                                {verse.arabic_text}
                              </Text>
                            </Paper>
                          )}

                          {/* Translations */}
                          <Tabs defaultValue="english" color="teal" variant="pills" radius="sm">
                            <Tabs.List mb="xs">
                              <Tabs.Tab value="english" style={{ fontSize: 11, padding: "2px 8px" }}>
                                English
                              </Tabs.Tab>
                              {verse.urdu_translation && (
                                <Tabs.Tab value="urdu" style={{ fontSize: 11, padding: "2px 8px" }}>
                                  Urdu
                                </Tabs.Tab>
                              )}
                              {verse.hindi_translation && (
                                <Tabs.Tab value="hindi" style={{ fontSize: 11, padding: "2px 8px" }}>
                                  Hindi
                                </Tabs.Tab>
                              )}
                            </Tabs.List>

                            <Tabs.Panel value="english">
                              <Text size="xs" c="dark.7" style={{ lineHeight: 1.6 }}>
                                {verse.english_translation || "No English translation recorded."}
                              </Text>
                            </Tabs.Panel>
                            {verse.urdu_translation && (
                              <Tabs.Panel value="urdu">
                                <Text
                                  size="xs"
                                  c="dark.7"
                                  style={{
                                    lineHeight: 1.7,
                                    direction: "rtl",
                                    fontFamily: "'Nafees', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                                  }}
                                >
                                  {verse.urdu_translation}
                                </Text>
                              </Tabs.Panel>
                            )}
                            {verse.hindi_translation && (
                              <Tabs.Panel value="hindi">
                                <Text size="xs" c="dark.7" style={{ lineHeight: 1.6 }}>
                                  {verse.hindi_translation}
                                </Text>
                              </Tabs.Panel>
                            )}
                          </Tabs>

                          {/* Points & Notes */}
                          {(verse.points_notes_eng || verse.points_notes_urdu || verse.points_notes) && (
                            <Paper
                              p="xs"
                              radius="sm"
                              mt="sm"
                              style={{
                                background: "rgba(255,255,255,0.6)",
                                borderLeft: "3px solid #f59e0b",
                              }}
                            >
                              <Text size="xs" fw={600} c="dark.8" mb={2}>
                                💡 Notes / Key Points:
                              </Text>
                              <Text size="xs" c="dark.6">
                                {verse.points_notes_eng || verse.points_notes_urdu || verse.points_notes}
                              </Text>
                            </Paper>
                          )}

                          {/* Question / Answer */}
                          {verse.quest_answer && verse.question_text && (
                            <Paper
                              p="xs"
                              radius="sm"
                              mt="xs"
                              style={{
                                background: "rgba(255,255,255,0.6)",
                                borderLeft: "3px solid #3b82f6",
                              }}
                            >
                              <Text size="xs" fw={600} c="blue.9" mb={2}>
                                ❓ Q&A:
                              </Text>
                              <Text size="xs" c="dark.6">
                                {verse.question_text}
                              </Text>
                            </Paper>
                          )}
                        </div>

                        {/* Video Clip CTA */}
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px dashed ${palette.border}` }}>
                          {videoList.length === 0 ? (
                            <Text size="xs" c="dimmed" ta="center">
                              No video clip attached
                            </Text>
                          ) : videoList.length === 1 ? (
                            <Button
                              fullWidth
                              size="xs"
                              color="red"
                              variant="filled"
                              leftSection={<IconBrandYoutube size={15} />}
                              onClick={() =>
                                setActiveVideoModal({
                                  title: `${getLectureName(selectedLecture.lecture_name)} - Surah ${verse.surah_number}:${verse.ayat_number}`,
                                  url: videoList[0],
                                })
                              }
                            >
                              Watch Video Clip
                            </Button>
                          ) : (
                            <Button
                              fullWidth
                              size="xs"
                              color="red"
                              variant="filled"
                              leftSection={<IconBrandYoutube size={15} />}
                              rightSection={
                                <Badge size="xs" color="yellow" variant="filled" style={{ color: "#000", fontWeight: 800 }}>
                                  {videoList.length} Clips
                                </Badge>
                              }
                              onClick={() =>
                                setActiveMultiVideoModal({
                                  title: `${getLectureName(selectedLecture.lecture_name)} - Surah ${verse.surah_number}:${verse.ayat_number}`,
                                  videos: videoList,
                                  verse,
                                })
                              }
                            >
                              Watch Video Clips
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Video Player Modal with Native Embed & Timestamp Support */}
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
            {getEmbedUrl(activeVideoModal.url)?.includes("youtube.com") ? (
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
            ) : (
              <Paper p="xl" radius="md" withBorder ta="center" style={{ background: "#f8fafc" }}>
                <Stack gap="md" align="center">
                  <IconVideo size={40} color="#4f46e5" />
                  <div>
                    <Text fw={600} size="sm">
                      Streaming Video Episode
                    </Text>
                    <Text size="xs" c="dimmed" mt={4} style={{ maxWidth: 450 }}>
                      This video is hosted on an external media server:
                    </Text>
                    <Text size="xs" fw={500} c="indigo" mt={2} lineClamp={1}>
                      {activeVideoModal.url}
                    </Text>
                  </div>
                  <Button
                    component="a"
                    href={activeVideoModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="indigo"
                    size="sm"
                    leftSection={<IconExternalLink size={16} />}
                  >
                    Open Video in New Tab
                  </Button>
                </Stack>
              </Paper>
            )}

            {/* If YouTube, provide direct fallback note and button */}
            {getEmbedUrl(activeVideoModal.url)?.includes("youtube.com") && (
              <Paper
                p="xs"
                radius="md"
                mt="sm"
                style={{
                  background: "#fef2f2",
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

            {/* Modal Footer Controls */}
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

      {/* Multi-Video Picker Modal */}
      <Modal
        opened={!!activeMultiVideoModal}
        onClose={() => setActiveMultiVideoModal(null)}
        title={
          <Group gap="xs">
            <IconBrandYoutube size={20} color="red" />
            <div>
              <Text fw={700} size="sm">
                {activeMultiVideoModal?.title}
              </Text>
              <Text size="xs" c="dimmed">
                {activeMultiVideoModal?.videos?.length || 0} Video Clips available for this verse
              </Text>
            </div>
          </Group>
        }
        size="md"
        centered
        radius="md"
      >
        {activeMultiVideoModal && (
          <Stack gap="sm">
            <Text size="xs" c="dimmed">
              Select a clip to open the player. Timestamps indicate designated start and stop segments.
            </Text>

            {activeMultiVideoModal.videos.map((url, idx) => {
              const timeRange = parseVideoTimestamps(url);
              return (
                <Paper
                  key={idx}
                  p="sm"
                  withBorder
                  radius="md"
                  style={{
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" mb={2}>
                      <Badge size="sm" color="red" variant="light">
                        Clip {idx + 1}
                      </Badge>
                      {timeRange && (
                        <Badge size="xs" color="blue" variant="outline">
                          ⏱ {timeRange}
                        </Badge>
                      )}
                    </Group>
                    <Text size="11px" c="dimmed" lineClamp={1} style={{ wordBreak: "break-all" }}>
                      {url}
                    </Text>
                  </div>

                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    leftSection={<IconBrandYoutube size={14} />}
                    onClick={() => {
                      const vidUrl = url;
                      const mTitle = `${activeMultiVideoModal.title} (Clip ${idx + 1})`;
                      setActiveMultiVideoModal(null);
                      setActiveVideoModal({
                        title: mTitle,
                        url: vidUrl,
                      });
                    }}
                  >
                    Play
                  </Button>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Modal>

      {/* Dedicated Seasons & Episodes Modal (Triggered from Level 2 Cards) */}
      <Modal
        opened={!!seasonsModalLecture}
        onClose={() => setSeasonsModalLecture(null)}
        title={
          seasonsModalLecture && (
            <Group gap="xs">
              <IconVideo size={20} color="#4f46e5" />
              <div>
                <Text fw={700} size="sm">
                  {getLectureName(seasonsModalLecture.lecture_name)}
                </Text>
                <Text size="xs" c="dimmed">
                  Seasons & Episodes Breakdown
                </Text>
              </div>
            </Group>
          )
        }
        size="md"
        centered
        radius="md"
      >
        {seasonsModalLecture && (
          <Stack gap="sm">
            {modalLectureSeasons.length > 1 && (
              <Group gap="xs">
                {modalLectureSeasons.map((s, sIdx) => (
                  <Button
                    key={sIdx}
                    size="xs"
                    radius="xl"
                    variant={modalSeasonIndex === sIdx ? "filled" : "light"}
                    color="indigo"
                    onClick={() => setModalSeasonIndex(sIdx)}
                  >
                    {s.season_name || `Season ${sIdx + 1}`}
                  </Button>
                ))}
              </Group>
            )}

            <Text size="xs" c="dimmed">
              {modalCurrentSeason?.season_name || "Season 1"} • {modalEpisodesList.length} Episodes available:
            </Text>

            {modalEpisodesList.length === 0 ? (
              <Paper p="md" radius="md" withBorder ta="center" style={{ background: "#f8fafc" }}>
                <Text size="xs" c="dimmed">
                  No video episodes available for this season.
                </Text>
              </Paper>
            ) : (
              <Stack gap="xs" style={{ maxHeight: 380, overflowY: "auto" }}>
                {modalEpisodesList.map((ep, idx) => (
                  <Paper
                    key={ep.id || idx}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
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
                          {ep.episode_number || "Episode"}
                        </Text>
                      </div>
                    </Group>

                    <Button
                      size="compact-xs"
                      color="indigo"
                      variant="light"
                      leftSection={<IconPlayerPlay size={12} fill="currentColor" />}
                      onClick={() => {
                        const epUrl = ep.episode_url || ep.videoUrl || ep.video_url;
                        if (epUrl) {
                          setActiveVideoModal({
                            title: `${getLectureName(seasonsModalLecture.lecture_name)} - ${ep.episode_title || ep.title || `Episode ${idx + 1}`}`,
                            url: epUrl,
                          });
                          setSeasonsModalLecture(null);
                        }
                      }}
                    >
                      Play
                    </Button>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
