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
  SimpleGrid,
  SegmentedControl,
  useMantineColorScheme,
} from "@mantine/core";
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
  IconFolder,
  IconListDetails,
  IconPlayerPlay,
  IconBookmark,
  IconLayersLinked,
  IconArrowRight,
  IconSortAscending,
  IconEye,
  IconArrowsSort,
} from "@tabler/icons-react";
import { SURAH_LIST } from "../../../components/common/QuranVersePicker";
import { NotebookSpine } from "../../sticky-notes/components/NotebookSpine";

// Categorized Ribbon Colors (English, Urdu, Hindi distinct palettes)
const LANGUAGE_STYLES = {
  eng: {
    bg: "#2563eb",
    activeBg: "#1d4ed8",
    badgeBg: "#dbeafe",
    badgeColor: "#1e40af",
    label: "English",
    icon: "📘",
  },
  urdu: {
    bg: "#059669",
    activeBg: "#047857",
    badgeBg: "#d1fae5",
    badgeColor: "#065f46",
    label: "Urdu",
    icon: "📗",
  },
  hindi: {
    bg: "#d97706",
    activeBg: "#b45309",
    badgeBg: "#fef3c7",
    badgeColor: "#92400e",
    label: "Hindi",
    icon: "📙",
  },
};

const CATEGORY_COLORS = [
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

export function QuranLectureReferenceNotebook({ user }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  // Raw categories from API
  const [metaCategories, setMetaCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Category & Lecture
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeLectureIndex, setActiveLectureIndex] = useState(0);

  // View Mode: "NOTEBOOK" (Category & Lecture Notebook) or "CONCORDANCE" (114-Chapter Sequence)
  const [viewMode, setViewMode] = useState("NOTEBOOK");

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSurah, setFilterSurah] = useState("");
  const [filterAyat, setFilterAyat] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("ALL");
  const [sortBy, setSortBy] = useState("SURAH_AYAT_ASC");

  // Page Flip Animation state
  const [isFlipping, setIsFlipping] = useState(false);

  // Modal inspection state
  const [activeAyatModal, setActiveAyatModal] = useState(null);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

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

  // Filtered Categories based on Language selector
  const availableCategories = useMemo(() => {
    if (filterLanguage === "ALL") return metaCategories;
    return metaCategories.filter((c) => {
      const l = (c.language || "eng").toLowerCase();
      return l === filterLanguage.toLowerCase();
    });
  }, [metaCategories, filterLanguage]);

  // Safe Active Category
  const activeCategory = useMemo(() => {
    if (availableCategories.length === 0) return null;
    const clamped = Math.min(activeCategoryIndex, availableCategories.length - 1);
    return availableCategories[clamped] || null;
  }, [availableCategories, activeCategoryIndex]);

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
    setFilterLanguage("ALL");
    setSortBy("SURAH_AYAT_ASC");
  };

  const hasActiveFilters =
    searchQuery || filterSurah || filterAyat || filterLanguage !== "ALL";

  // Filter & Sort function for any list of ayats
  const processAyatList = (list) => {
    let result = [...list];

    // Filter by Surah
    if (filterSurah) {
      result = result.filter((a) => Number(a.surah_number) === Number(filterSurah));
    }

    // Filter by Ayat
    if (filterAyat) {
      result = result.filter((a) => Number(a.ayat_number) === Number(filterAyat));
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const sName = (a.surah_name || "").toLowerCase();
        const eng = (a.english_translation || "").toLowerCase();
        const urdu = (a.urdu_translation || "").toLowerCase();
        const arab = (a.arabic_text || "").toLowerCase();
        const notes = (a.points_notes_eng || a.points_notes_urdu || a.points_notes || "").toLowerCase();
        const qText = (a.question_text || "").toLowerCase();
        const sNum = String(a.surah_number);
        const aNum = String(a.ayat_number);

        return (
          sName.includes(q) ||
          eng.includes(q) ||
          urdu.includes(q) ||
          arab.includes(q) ||
          notes.includes(q) ||
          qText.includes(q) ||
          sNum === q ||
          aNum === q
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "SURAH_AYAT_ASC") {
        if (a.surah_number !== b.surah_number) {
          return a.surah_number - b.surah_number;
        }
        return a.ayat_number - b.ayat_number;
      }
      if (sortBy === "SURAH_AYAT_DESC") {
        if (a.surah_number !== b.surah_number) {
          return b.surah_number - a.surah_number;
        }
        return b.ayat_number - a.ayat_number;
      }
      return 0; // Default order
    });

    return result;
  };

  // Verses inside current active lecture
  const currentLectureVerses = useMemo(() => {
    if (!activeLecture) return [];
    const raw = activeLecture.ayat_references || [];
    return processAyatList(raw);
  }, [activeLecture, filterSurah, filterAyat, searchQuery, sortBy]);

  // Comprehensive 114-Chapter Sequence Concordance across all categories and lectures
  const chapterConcordance = useMemo(() => {
    // Collect all ayats from all categories and lectures
    const verseMap = new Map();

    metaCategories.forEach((cat) => {
      const catLang = (cat.language || "eng").toLowerCase();
      if (filterLanguage !== "ALL" && catLang !== filterLanguage.toLowerCase()) return;

      const lectures = cat.lectures || [];
      lectures.forEach((lec) => {
        const ayats = lec.ayat_references || [];
        ayats.forEach((ayat) => {
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
              video_url_eng: ayat.video_url_eng || ayat.youtube_url_eng || "",
              video_url_urdu: ayat.video_url_urdu || ayat.youtube_url_urdu || "",
              occurrences: [],
            });
          }

          const existing = verseMap.get(key);
          existing.occurrences.push({
            category_id: String(cat._id || cat.category_id),
            category_name: cat.category_name,
            language: catLang,
            lecture_id: String(lec._id || lec.lecture_id),
            lecture_number: lec.lecture_id,
            lecture_name: lec.lecture_name,
            year_delivered: lec.year_delivered,
            video_url:
              ayat.video_url_eng ||
              ayat.youtube_url_eng ||
              ayat.video_url_urdu ||
              ayat.youtube_url_urdu ||
              "",
            points_notes:
              ayat.points_notes_eng || ayat.points_notes_urdu || ayat.points_notes || "",
          });
        });
      });
    });

    let allVerses = Array.from(verseMap.values());

    // Apply Filter & Sort
    allVerses = processAyatList(allVerses);

    // Group by Surah Number
    const groupedBySurah = new Map();
    allVerses.forEach((verse) => {
      const sNum = verse.surah_number;
      if (!groupedBySurah.has(sNum)) {
        const sObj = SURAH_LIST.find((s) => Number(s.value) === sNum);
        groupedBySurah.set(sNum, {
          surah_number: sNum,
          surah_name: verse.surah_name || (sObj ? sObj.label : `Surah ${sNum}`),
          total_verses: sObj ? sObj.total : 0,
          verses: [],
        });
      }
      groupedBySurah.get(sNum).verses.push(verse);
    });

    return Array.from(groupedBySurah.values());
  }, [metaCategories, filterSurah, filterAyat, searchQuery, sortBy, filterLanguage]);

  // Helper to extract embeddable video URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  return (
    <Container size="xl" py="lg">
      <style>{`
        /* 3D Notebook & Page Flip Styles */
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
        .notebook-book-3d:hover {
          box-shadow: 
            0 32px 75px -15px rgba(0, 0, 0, 0.45),
            0 16px 30px -10px rgba(0, 0, 0, 0.25),
            0 0 0 1px ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"};
        }
        .page-flip-container {
          transform-origin: left center;
          transition: transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease;
        }
        .page-flip-container.flipping {
          transform: rotateY(-8deg) translateX(-4px) scale(0.985);
          opacity: 0.65;
        }

        /* Top Lecture Tab Hover Glow */
        .lecture-binder-tab {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid transparent;
        }
        .lecture-binder-tab:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(79, 70, 229, 0.18);
          border-color: rgba(99, 102, 241, 0.4);
        }

        /* Ayat Index Badge Card */
        .ayat-index-chip {
          background: ${isDark ? "rgba(255,255,255,0.04)" : "#ffffff"};
          border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"};
          border-radius: 12px;
          padding: 12px 14px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }
        .ayat-index-chip:hover {
          transform: translateY(-3px) scale(1.015);
          border-color: #3b82f6;
          box-shadow: 0 10px 22px rgba(59, 130, 246, 0.16);
          background: ${isDark ? "rgba(59, 130, 246, 0.1)" : "#f8faff"};
        }

        /* Arabic Typography */
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
                3D Interactive Flipbook
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Category Notice Tags ➔ Top Lecture Binder Tabs ➔ Surah & Ayat Index with direct details & video clips.
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { value: "NOTEBOOK", label: "📖 Notebook Binder" },
              { value: "CONCORDANCE", label: "📜 114-Surah Sequence" },
            ]}
            color="indigo"
            radius="xl"
            size="xs"
          />

          <ActionIcon
            variant="default"
            radius="xl"
            size={36}
            onClick={() => toggleColorScheme()}
            title="Toggle theme"
          >
            {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
          </ActionIcon>

          <ActionIcon
            variant="default"
            radius="xl"
            size={36}
            onClick={() => window.print()}
            title="Print Notebook"
          >
            <IconPrinter size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Search, Filter & Sort Toolbar */}
      <Paper p="sm" radius="lg" withBorder mb="lg" shadow="xs" style={{ background: isDark ? "#25262b" : "#ffffff" }}>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          <TextInput
            placeholder="Search keyword, surah, translation, notes..."
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
            style={{ minWidth: 240, flex: 1.5 }}
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
            style={{ width: 190 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Ayat Filter"
            placeholder={filterSurah ? "Ayat..." : "Pick Surah first"}
            disabled={!filterSurah}
            data={filterAyatOptions}
            clearable
            searchable
            value={filterAyat}
            onChange={(val) => setFilterAyat(val || "")}
            style={{ width: 120 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Language"
            data={[
              { value: "ALL", label: "🌐 All Languages" },
              { value: "ENG", label: "📘 English" },
              { value: "URDU", label: "📗 Urdu" },
              { value: "HINDI", label: "📙 Hindi" },
            ]}
            value={filterLanguage}
            onChange={(val) => setFilterLanguage(val || "ALL")}
            style={{ width: 145 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Sort By"
            data={[
              { value: "SURAH_AYAT_ASC", label: "Surah & Ayat (1 ➔ 114)" },
              { value: "SURAH_AYAT_DESC", label: "Surah & Ayat (114 ➔ 1)" },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val || "SURAH_AYAT_ASC")}
            style={{ width: 180 }}
            radius="md"
            size="xs"
          />

          {hasActiveFilters && (
            <Button
              variant="light"
              color="gray"
              size="xs"
              radius="md"
              leftSection={<IconX size={14} />}
              onClick={handleClearFilters}
            >
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
            {/* Top Binder Tabs (Lectures) */}
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
                <Group gap="xs" style={{ flexWrap: "wrap", flex: 1 }}>
                  {activeLectures.length === 0 ? (
                    <Text size="xs" c="dimmed">
                      No lectures recorded in this category.
                    </Text>
                  ) : (
                    activeLectures.map((lec, idx) => {
                      const count =
                        lec.total_ayats ||
                        lec.ayat_count ||
                        (lec.ayat_references ? lec.ayat_references.length : 0);
                      const isSelected = activeLectureIndex === idx;

                      return (
                        <Button
                          key={lec._id || idx}
                          className="lecture-binder-tab"
                          variant={isSelected ? "filled" : "subtle"}
                          color={isSelected ? "indigo" : "gray"}
                          size="xs"
                          radius="xl"
                          onClick={() => handleLectureChange(idx)}
                          style={{
                            fontWeight: isSelected ? 700 : 500,
                            padding: "4px 12px",
                            height: 32,
                          }}
                        >
                          <Group gap={6}>
                            <span>
                              {lec.lecture_id}. {lec.lecture_name}
                            </span>
                            <Badge
                              size="xs"
                              variant={isSelected ? "white" : "light"}
                              color={isSelected ? "indigo" : "gray"}
                            >
                              {count}
                            </Badge>
                          </Group>
                        </Button>
                      );
                    })
                  )}
                </Group>

                {activeLecture && (
                  <Text size="xs" c="dimmed" fs="italic" style={{ whiteSpace: "nowrap" }}>
                    Lec{" "}
                    <Text span fw={800} c="indigo.6">
                      {String(activeLectureIndex + 1).padStart(2, "0")} /{" "}
                      {String(activeLectures.length).padStart(2, "0")}
                    </Text>{" "}
                    • {currentLectureVerses.length} Ayats
                  </Text>
                )}
              </Group>
            )}

            {/* View Mode Header Bar for Concordance */}
            {viewMode === "CONCORDANCE" && (
              <Group
                justify="space-between"
                px="lg"
                py="xs"
                style={{
                  borderBottom: isDark ? "1px solid #2c2e33" : "1px solid #eef2f6",
                  background: isDark ? "#141517" : "#f8fafc",
                }}
              >
                <Group gap="xs">
                  <IconLayersLinked size={18} color="#4f46e5" />
                  <Text fw={700} size="sm" c={isDark ? "white" : "dark.8"}>
                    Complete 114-Chapter Sequence Concordance
                  </Text>
                  <Badge color="indigo" variant="light" size="sm">
                    {chapterConcordance.reduce((sum, ch) => sum + ch.verses.length, 0)} Total Ayats across all Lectures
                  </Badge>
                </Group>

                <Text size="xs" c="dimmed">
                  Surahs {chapterConcordance.length > 0 ? chapterConcordance.length : 0} represented
                </Text>
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
                className={`page-flip-container ${isFlipping ? "flipping" : ""}`}
                style={{
                  flex: 1,
                  padding: "24px 28px",
                  maxHeight: 580,
                  overflowY: "auto",
                }}
              >
                {isLoading ? (
                  <Stack align="center" justify="center" py="xl" style={{ minHeight: 300 }}>
                    <Loader size="md" color="indigo" />
                    <Text size="sm" c="dimmed">
                      Turning notebook pages...
                    </Text>
                  </Stack>
                ) : (
                  <>
                    {/* MODE 1: NOTEBOOK VIEW */}
                    {viewMode === "NOTEBOOK" && (
                      <div>
                        {/* Lecture Title & Category Breadcrumb on Paper */}
                        {activeLecture ? (
                          <div style={{ marginBottom: 20 }}>
                            <Group justify="space-between" align="flex-start" mb={4}>
                              <div>
                                <Group gap="xs" mb={4}>
                                  <Badge
                                    size="sm"
                                    color={
                                      LANGUAGE_STYLES[
                                        (activeCategory?.language || "eng").toLowerCase()
                                      ]?.badgeColor || "blue"
                                    }
                                    variant="light"
                                  >
                                    {LANGUAGE_STYLES[
                                      (activeCategory?.language || "eng").toLowerCase()
                                    ]?.icon}{" "}
                                    {activeCategory?.category_name} (
                                    {activeCategory?.language?.toUpperCase() || "ENG"})
                                  </Badge>

                                  {activeLecture.year_delivered && (
                                    <Badge size="sm" variant="outline" color="gray">
                                      Year: {activeLecture.year_delivered}
                                    </Badge>
                                  )}
                                </Group>

                                <Title order={3} c={isDark ? "white" : "dark.9"} style={{ fontWeight: 800 }}>
                                  Lecture {activeLecture.lecture_id}: {activeLecture.lecture_name}
                                </Title>
                              </div>

                              <Badge color="teal" size="md" variant="filled">
                                {currentLectureVerses.length} Verses Cited
                              </Badge>
                            </Group>

                            <Text size="xs" c="dimmed">
                              Click any ayah index badge below to open its translation, detailed notes, and lecture video clip.
                            </Text>
                            <Divider my="sm" />
                          </div>
                        ) : (
                          <Paper p="xl" ta="center">
                            <Text size="sm" c="dimmed">
                              Please select a category from the right side ribbons.
                            </Text>
                          </Paper>
                        )}

                        {/* Verses Index Grid */}
                        {currentLectureVerses.length === 0 ? (
                          <Paper p="xl" ta="center" radius="md" withBorder>
                            <Text size="sm" c="dimmed">
                              No cited verses match the active filters in this lecture.
                            </Text>
                          </Paper>
                        ) : (
                          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                            {currentLectureVerses.map((verse, idx) => {
                              const hasVideo =
                                verse.video_url_eng ||
                                verse.youtube_url_eng ||
                                verse.video_url_urdu ||
                                verse.youtube_url_urdu ||
                                verse.video_url;

                              return (
                                <div
                                  key={verse._id || idx}
                                  className="ayat-index-chip"
                                  onClick={() =>
                                    setActiveAyatModal({
                                      ...verse,
                                      category_name: activeCategory?.category_name,
                                      lecture_name: activeLecture?.lecture_name,
                                    })
                                  }
                                >
                                  <div>
                                    <Group justify="space-between" mb={4}>
                                      <Badge color="indigo" size="xs" variant="filled">
                                        Surah {verse.surah_number} : {verse.ayat_number}
                                      </Badge>
                                      {hasVideo && <IconBrandYoutube size={14} color="#ef4444" />}
                                    </Group>

                                    <Text fw={700} size="xs" c={isDark ? "white" : "dark.8"} lineClamp={1}>
                                      {verse.surah_name || `Surah ${verse.surah_number}`}
                                    </Text>

                                    {verse.arabic_text && (
                                      <Text
                                        className="arabic-calligraphy"
                                        style={{ fontSize: 13, color: "#059669", margin: "4px 0" }}
                                        lineClamp={1}
                                      >
                                        {verse.arabic_text}
                                      </Text>
                                    )}

                                    <Text size="xs" c="dimmed" lineClamp={2} style={{ fontSize: 11 }}>
                                      {verse.english_translation || verse.urdu_translation || "Click to view..."}
                                    </Text>
                                  </div>

                                  <Group justify="space-between" mt="xs" pt={6} style={{ borderTop: "1px dashed #e2e8f0" }}>
                                    <Text size="10px" fw={600} c="indigo.6">
                                      View Ayah Details ➔
                                    </Text>
                                    <IconEye size={12} color="var(--mantine-color-indigo-6)" />
                                  </Group>
                                </div>
                              );
                            })}
                          </SimpleGrid>
                        )}
                      </div>
                    )}

                    {/* MODE 2: 114-CHAPTER SEQUENCE CONCORDANCE VIEW */}
                    {viewMode === "CONCORDANCE" && (
                      <Stack gap="lg">
                        {chapterConcordance.length === 0 ? (
                          <Paper p="xl" ta="center" radius="md" withBorder>
                            <Text size="sm" c="dimmed">
                              No verses found matching the active search or filter.
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

                              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                {ch.verses.map((v, vIdx) => (
                                  <Card
                                    key={vIdx}
                                    p="sm"
                                    radius="sm"
                                    withBorder
                                    style={{
                                      background: isDark ? "#1e1f23" : "#ffffff",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => setActiveAyatModal(v)}
                                  >
                                    <Group justify="space-between" mb={4}>
                                      <Badge size="xs" color="dark">
                                        Ayat {v.ayat_number}
                                      </Badge>
                                      <Badge size="xs" color="teal" variant="light">
                                        Cited in {v.occurrences.length} Lecture(s)
                                      </Badge>
                                    </Group>

                                    {v.arabic_text && (
                                      <Text
                                        className="arabic-calligraphy"
                                        style={{ fontSize: 13, color: "#065f46" }}
                                        lineClamp={1}
                                      >
                                        {v.arabic_text}
                                      </Text>
                                    )}

                                    <Text size="xs" c="dark.6" lineClamp={2} mb={6}>
                                      {v.english_translation || v.urdu_translation}
                                    </Text>

                                    {/* Occurrences tags */}
                                    <Group gap={4} wrap="wrap">
                                      {v.occurrences.map((occ, oIdx) => (
                                        <Badge
                                          key={oIdx}
                                          size="xs"
                                          color={occ.language === "urdu" ? "green" : "blue"}
                                          variant="light"
                                        >
                                          {occ.category_name} • Lec {occ.lecture_number}
                                        </Badge>
                                      ))}
                                    </Group>
                                  </Card>
                                ))}
                              </SimpleGrid>
                            </Paper>
                          ))
                        )}
                      </Stack>
                    )}
                  </>
                )}
              </Box>

              {/* Right Side Ribbons (Notice Tags for Categories) */}
              <Box
                style={{
                  width: 220,
                  borderLeft: isDark ? "1px solid #2c2e33" : "1px solid #eef2f6",
                  padding: "18px 0px 18px 10px",
                  background: isDark ? "#141517" : "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                  maxHeight: 580,
                }}
              >
                <Text
                  size="10px"
                  fw={800}
                  c="dimmed"
                  tt="uppercase"
                  px="xs"
                  style={{ letterSpacing: 1 }}
                >
                  Category Notice Tags
                </Text>

                {availableCategories.map((cat, idx) => {
                  const isSelected = activeCategoryIndex === idx;
                  const lang = (cat.language || "eng").toLowerCase();
                  const langStyle = LANGUAGE_STYLES[lang] || LANGUAGE_STYLES.eng;
                  const catColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  const lecCount = cat.lectures ? cat.lectures.length : cat.total_lectures || 0;

                  return (
                    <Box
                      key={cat._id || idx}
                      onClick={() => handleCategoryChange(idx)}
                      style={{
                        position: "relative",
                        backgroundColor: isSelected ? catColor : `${catColor}dd`,
                        color: "white",
                        padding: "8px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        clipPath:
                          "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 6px 50%)",
                        filter: isSelected
                          ? "drop-shadow(2px 4px 6px rgba(0,0,0,0.25))"
                          : "none",
                        transform: isSelected ? "translateX(-6px)" : "none",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                      title={`${cat.category_name} (${langStyle.label})`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                        <span>{langStyle.icon}</span>
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 130,
                          }}
                        >
                          {cat.category_name}
                        </span>
                      </div>
                      <Badge size="xs" variant="white" color="dark" style={{ marginRight: 6, fontSize: 9 }}>
                        {lecCount}
                      </Badge>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Card>
      </div>

      {/* FULL AYAT DETAILS MODAL */}
      <Modal
        opened={!!activeAyatModal}
        onClose={() => setActiveAyatModal(null)}
        title={
          activeAyatModal && (
            <Group gap="xs">
              <Badge color="indigo" size="md" variant="filled">
                Surah {activeAyatModal.surah_number} : {activeAyatModal.ayat_number}
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
            {activeAyatModal.arabic_text && (
              <Paper p="md" radius="md" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <Text className="arabic-calligraphy" style={{ fontSize: 20, color: "#065f46" }}>
                  {activeAyatModal.arabic_text}
                </Text>
              </Paper>
            )}

            {/* Multilingual Translation Tabs */}
            <Tabs defaultValue="english" color="indigo" radius="sm">
              <Tabs.List mb="xs">
                <Tabs.Tab value="english">English Translation</Tabs.Tab>
                {activeAyatModal.urdu_translation && (
                  <Tabs.Tab value="urdu">Urdu Translation</Tabs.Tab>
                )}
                {activeAyatModal.hindi_translation && (
                  <Tabs.Tab value="hindi">Hindi Translation</Tabs.Tab>
                )}
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
            {(activeAyatModal.points_notes_eng ||
              activeAyatModal.points_notes_urdu ||
              activeAyatModal.points_notes) && (
              <Paper p="xs" radius="sm" style={{ background: "#fef3c7", borderLeft: "3px solid #f59e0b" }}>
                <Text size="xs" fw={700} c="dark.8" mb={2}>
                  💡 Key Notes & Context:
                </Text>
                <Text size="xs" c="dark.7">
                  {activeAyatModal.points_notes_eng ||
                    activeAyatModal.points_notes_urdu ||
                    activeAyatModal.points_notes}
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

            {/* If viewed in Concordance mode, show all occurrences */}
            {activeAyatModal.occurrences && activeAyatModal.occurrences.length > 0 && (
              <div>
                <Text size="xs" fw={700} c="dimmed" mb={4}>
                  Occurrences in Lectures ({activeAyatModal.occurrences.length}):
                </Text>
                <SimpleGrid cols={1} spacing={4}>
                  {activeAyatModal.occurrences.map((occ, oIdx) => (
                    <Paper key={oIdx} p="xs" withBorder radius="xs" style={{ background: "#f8fafc" }}>
                      <Group justify="space-between">
                        <div>
                          <Text size="xs" fw={600} c="dark.8">
                            {occ.lecture_name} ({occ.category_name})
                          </Text>
                          {occ.year_delivered && (
                            <Text size="10px" c="dimmed">
                              Year: {occ.year_delivered}
                            </Text>
                          )}
                        </div>

                        {occ.video_url && (
                          <Button
                            size="compact-xs"
                            color="red"
                            variant="light"
                            leftSection={<IconBrandYoutube size={12} />}
                            onClick={() =>
                              setActiveVideoModal({
                                title: `${occ.lecture_name} - Surah ${activeAyatModal.surah_number}:${activeAyatModal.ayat_number}`,
                                url: occ.video_url,
                              })
                            }
                          >
                            Watch Clip
                          </Button>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </SimpleGrid>
              </div>
            )}

            {/* Single Lecture Video Clip CTA */}
            {!activeAyatModal.occurrences &&
              (activeAyatModal.video_url_eng ||
                activeAyatModal.youtube_url_eng ||
                activeAyatModal.video_url_urdu ||
                activeAyatModal.youtube_url_urdu ||
                activeAyatModal.video_url) && (
                <Button
                  fullWidth
                  color="red"
                  variant="filled"
                  leftSection={<IconBrandYoutube size={16} />}
                  onClick={() =>
                    setActiveVideoModal({
                      title: `${activeAyatModal.lecture_name || "Lecture"} - Surah ${activeAyatModal.surah_number}:${activeAyatModal.ayat_number}`,
                      url:
                        activeAyatModal.video_url_eng ||
                        activeAyatModal.youtube_url_eng ||
                        activeAyatModal.video_url_urdu ||
                        activeAyatModal.youtube_url_urdu ||
                        activeAyatModal.video_url,
                    })
                  }
                >
                  Watch Lecture Video Clip
                </Button>
              )}
          </Stack>
        )}
      </Modal>

      {/* VIDEO PLAYER MODAL */}
      <Modal
        opened={!!activeVideoModal}
        onClose={() => setActiveVideoModal(null)}
        title={
          <Group gap="xs">
            <IconBrandYoutube size={20} color="red" />
            <Text fw={600} size="sm">
              {activeVideoModal?.title}
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        {activeVideoModal && (
          <div>
            {getEmbedUrl(activeVideoModal.url)?.includes("youtube.com") ? (
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                <iframe
                  src={getEmbedUrl(activeVideoModal.url)}
                  title={activeVideoModal.title}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 8,
                    border: "none",
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <Stack gap="md" align="center" py="lg">
                <Text size="sm">External video resource:</Text>
                <Button
                  component="a"
                  href={activeVideoModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="red"
                  leftSection={<IconExternalLink size={16} />}
                >
                  Open External Video
                </Button>
              </Stack>
            )}
          </div>
        )}
      </Modal>
    </Container>
  );
}
