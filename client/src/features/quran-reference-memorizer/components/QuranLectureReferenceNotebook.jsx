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
  Pagination,
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
  IconLayersLinked,
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

  // View Mode: "NOTEBOOK" (Category & Lecture Notebook) or "CONCORDANCE" (114-Chapter Sequence)
  const [viewMode, setViewMode] = useState("NOTEBOOK");

  // Top Filter Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSurah, setFilterSurah] = useState("");
  const [filterAyat, setFilterAyat] = useState("");

  // Excel-like Grid Sorting: "SURAH_ASC" | "SURAH_DESC" | "AYAT_ASC" | "AYAT_DESC" | "SURAH_THEN_AYAT"
  const [sortField, setSortField] = useState("SURAH_THEN_AYAT");

  // Page Flip Animation state
  const [isFlipping, setIsFlipping] = useState(false);

  // Modal inspection state
  const [activeAyatModal, setActiveAyatModal] = useState(null);
  const [isFetchingLiveArabic, setIsFetchingLiveArabic] = useState(false);
  const [liveArabicText, setLiveArabicText] = useState("");
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

  // STRICT VALIDATION: Filter out Surah 0 and Ayat 0 (and dummy rows)
  const isValidQuranicVerse = (a) => {
    const s = Number(a.surah_number);
    const ay = Number(a.ayat_number);
    return !isNaN(s) && s >= 1 && s <= 114 && !isNaN(ay) && ay >= 1;
  };

  // Filter & Sort helper
  const processAndSortAyats = (rawList) => {
    // 1. Strict Quranic verse validation (removes Surah 0 & Ayat 0)
    let list = rawList.filter(isValidQuranicVerse);

    // 2. Filter by Surah
    if (filterSurah) {
      list = list.filter((a) => Number(a.surah_number) === Number(filterSurah));
    }

    // 3. Filter by Ayat
    if (filterAyat) {
      list = list.filter((a) => Number(a.ayat_number) === Number(filterAyat));
    }

    // 4. Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
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
      // Default: SURAH_THEN_AYAT (ascending)
      if (sA !== sB) return sA - sB;
      return ayA - ayB;
    });

    return list;
  };

  // Verses inside current active lecture
  const currentLectureVerses = useMemo(() => {
    if (!activeLecture) return [];
    const raw = activeLecture.ayat_references || [];
    return processAndSortAyats(raw);
  }, [activeLecture, filterSurah, filterAyat, searchQuery, sortField]);

  // 114-Chapter Sequence Concordance (strictly 1 to 114, NO Surah 0)
  const chapterConcordance = useMemo(() => {
    const verseMap = new Map();

    metaCategories.forEach((cat) => {
      const catLang = (cat.language || "eng").toLowerCase();
      if (activeLanguage !== "all" && catLang !== activeLanguage.toLowerCase()) return;

      const lectures = cat.lectures || [];
      lectures.forEach((lec) => {
        const ayats = lec.ayat_references || [];
        ayats.forEach((ayat) => {
          // Strictly exclude Surah 0 and Ayat 0
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
    setActiveAyatModal(verse);
    setLiveArabicText(verse.arabic_text || "");

    // Fetch live Arabic Uthmani text from Quran API proxy for authentic rendering
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

        /* Interactive Lecture Tab Ready-to-be-Clicked State */
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
          background: #4f46e5 !important;
          color: #ffffff !important;
          border-color: #4338ca !important;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }

        /* Excel-like Grid Rows with Light Color Changing Hover Appeal */
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

        /* Typography */
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
                Excel Tabular Reference
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Choose Language Tag ➔ Pick Category ➔ Select Lecture ➔ Browse Tabular Verses with Live Quran API.
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
          {/* Prominent Language Tags (Bold Black & Yellow Highlight for active language as requested) */}
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
            style={{ minWidth: 230, flex: 1.5 }}
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
            style={{ width: 180 }}
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
            style={{ width: 110 }}
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
            style={{ width: 185 }}
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
                      No lectures found in this category.
                    </Text>
                  ) : (
                    activeLectures.map((lec, idx) => {
                      const count =
                        lec.total_ayats ||
                        lec.ayat_count ||
                        (lec.ayat_references ? lec.ayat_references.filter(isValidQuranicVerse).length : 0);
                      const isSelected = activeLectureIndex === idx;

                      return (
                        <button
                          key={lec._id || idx}
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
                            Lec {lec.lecture_id}: {lec.lecture_name}
                          </span>
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
                        </button>
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
                  maxHeight: 580,
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
                    {/* Location Breadcrumb Bar on Paper */}
                    {activeCategory && activeLecture && viewMode === "NOTEBOOK" && (
                      <Paper
                        p="xs"
                        px="md"
                        radius="md"
                        mb="md"
                        style={{
                          background: isDark ? "#2d3748" : "#f1f5f9",
                          borderLeft: "4px solid #facc15",
                        }}
                      >
                        <Group justify="space-between" align="center">
                          <Group gap="xs">
                            <Badge color="yellow" variant="filled" style={{ color: "#000", fontWeight: 800 }}>
                              {activeLanguage.toUpperCase()}
                            </Badge>
                            <Text size="sm" fw={700} c={isDark ? "white" : "dark.8"}>
                              Category: {activeCategory.category_name}
                            </Text>
                            <Text size="sm" c="dimmed">
                              ➔
                            </Text>
                            <Text size="sm" fw={700} c="indigo.6">
                              Lecture {activeLecture.lecture_id}: {activeLecture.lecture_name}
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
                              No Quran verses cited in this lecture matching the active filters.
                            </Text>
                          </Paper>
                        ) : (
                          <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                            <Table className="excel-table" highlightOnHover striped={false}>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th style={{ width: 45, textAlign: "center" }}>#</Table.Th>
                                  <Table.Th
                                    style={{ width: 100, cursor: "pointer" }}
                                    onClick={() =>
                                      setSortField(sortField === "SURAH_ASC" ? "SURAH_DESC" : "SURAH_ASC")
                                    }
                                    title="Click to toggle Surah sort"
                                  >
                                    <Group gap={4} wrap="nowrap">
                                      <span>Surah #</span>
                                      {sortField === "SURAH_ASC" && <IconSortAscending size={14} color="#2563eb" />}
                                      {sortField === "SURAH_DESC" && <IconSortDescending size={14} color="#2563eb" />}
                                      {!sortField.startsWith("SURAH_") && <IconArrowsSort size={12} color="#94a3b8" />}
                                    </Group>
                                  </Table.Th>
                                  <Table.Th style={{ width: 140 }}>Surah Name</Table.Th>
                                  <Table.Th
                                    style={{ width: 90, cursor: "pointer" }}
                                    onClick={() =>
                                      setSortField(sortField === "AYAT_ASC" ? "AYAT_DESC" : "AYAT_ASC")
                                    }
                                    title="Click to toggle Ayat sort"
                                  >
                                    <Group gap={4} wrap="nowrap">
                                      <span>Ayat #</span>
                                      {sortField === "AYAT_ASC" && <IconSortAscending size={14} color="#2563eb" />}
                                      {sortField === "AYAT_DESC" && <IconSortDescending size={14} color="#2563eb" />}
                                      {!sortField.startsWith("AYAT_") && <IconArrowsSort size={12} color="#94a3b8" />}
                                    </Group>
                                  </Table.Th>
                                  <Table.Th style={{ minWidth: 160 }}>Arabic Preview</Table.Th>
                                  <Table.Th style={{ minWidth: 220 }}>Translation Preview</Table.Th>
                                  <Table.Th style={{ width: 100 }}>Clip</Table.Th>
                                  <Table.Th style={{ width: 110, textAlign: "center" }}>Details</Table.Th>
                                </Table.Tr>
                              </Table.Thead>
                              <Table.Tbody>
                                {currentLectureVerses.map((verse, idx) => {
                                  const videoUrl =
                                    verse.video_url_eng ||
                                    verse.youtube_url_eng ||
                                    verse.video_url_urdu ||
                                    verse.youtube_url_urdu ||
                                    verse.video_url;

                                  return (
                                    <Table.Tr
                                      key={verse._id || idx}
                                      className="excel-row"
                                      onClick={() =>
                                        handleOpenAyatModal({
                                          ...verse,
                                          category_name: activeCategory?.category_name,
                                          lecture_name: activeLecture?.lecture_name,
                                        })
                                      }
                                    >
                                      <Table.Td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                                        {idx + 1}
                                      </Table.Td>

                                      <Table.Td>
                                        <Badge color="indigo" size="sm" variant="filled">
                                          {verse.surah_number}
                                        </Badge>
                                      </Table.Td>

                                      <Table.Td>
                                        <Text size="xs" fw={700} c={isDark ? "white" : "dark.8"}>
                                          {verse.surah_name || `Surah ${verse.surah_number}`}
                                        </Text>
                                      </Table.Td>

                                      <Table.Td>
                                        <Badge color="teal" size="sm" variant="light">
                                          Ayat {verse.ayat_number}
                                        </Badge>
                                      </Table.Td>

                                      <Table.Td>
                                        <Text
                                          className="arabic-calligraphy"
                                          lineClamp={1}
                                          style={{ fontSize: 14, color: "#059669" }}
                                        >
                                          {verse.arabic_text || "Click to fetch Arabic..."}
                                        </Text>
                                      </Table.Td>

                                      <Table.Td>
                                        <Text size="xs" c="dark.7" lineClamp={1}>
                                          {verse.english_translation || verse.urdu_translation || "Click to view full translation"}
                                        </Text>
                                      </Table.Td>

                                      <Table.Td onClick={(e) => e.stopPropagation()}>
                                        {videoUrl ? (
                                          <Button
                                            size="compact-xs"
                                            color="red"
                                            variant="light"
                                            leftSection={<IconBrandYoutube size={13} />}
                                            onClick={() =>
                                              setActiveVideoModal({
                                                title: `${activeLecture.lecture_name} - Surah ${verse.surah_number}:${verse.ayat_number}`,
                                                url: videoUrl,
                                              })
                                            }
                                          >
                                            Clip
                                          </Button>
                                        ) : (
                                          <Text size="10px" c="dimmed">
                                            -
                                          </Text>
                                        )}
                                      </Table.Td>

                                      <Table.Td style={{ textAlign: "center" }}>
                                        <Button
                                          size="compact-xs"
                                          variant="subtle"
                                          color="blue"
                                          rightSection={<IconEye size={12} />}
                                        >
                                          View
                                        </Button>
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

                    {/* MODE 2: 114-CHAPTER SEQUENCE CONCORDANCE (Strictly Surah 1 to 114, NO Surah 0) */}
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
                                      <Table.Th style={{ width: 80 }}>Ayat #</Table.Th>
                                      <Table.Th style={{ minWidth: 160 }}>Arabic Preview</Table.Th>
                                      <Table.Th style={{ minWidth: 200 }}>Translation</Table.Th>
                                      <Table.Th>Cited in Lectures & Categories</Table.Th>
                                      <Table.Th style={{ width: 90, textAlign: "center" }}>Details</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {ch.verses.map((v, vIdx) => (
                                      <Table.Tr key={vIdx} className="excel-row" onClick={() => handleOpenAyatModal(v)}>
                                        <Table.Td>
                                          <Badge size="sm" color="dark">
                                            Ayat {v.ayat_number}
                                          </Badge>
                                        </Table.Td>

                                        <Table.Td>
                                          <Text className="arabic-calligraphy" style={{ fontSize: 13, color: "#065f46" }} lineClamp={1}>
                                            {v.arabic_text || "Click to fetch Arabic..."}
                                          </Text>
                                        </Table.Td>

                                        <Table.Td>
                                          <Text size="xs" c="dark.6" lineClamp={1}>
                                            {v.english_translation || v.urdu_translation}
                                          </Text>
                                        </Table.Td>

                                        <Table.Td>
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
                                        </Table.Td>

                                        <Table.Td style={{ textAlign: "center" }}>
                                          <Button size="compact-xs" variant="subtle" color="blue" rightSection={<IconEye size={12} />}>
                                            View
                                          </Button>
                                        </Table.Td>
                                      </Table.Tr>
                                    ))}
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

              {/* Right Side Ribbons (Notice Tags for Categories of Selected Language) */}
              <Box
                style={{
                  width: 215,
                  borderLeft: isDark ? "1px solid #2c2e33" : "1px solid #eef2f6",
                  padding: "16px 0px 16px 10px",
                  background: isDark ? "#141517" : "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                  maxHeight: 580,
                }}
              >
                <Text size="10px" fw={800} c="dimmed" tt="uppercase" px="xs" style={{ letterSpacing: 1 }}>
                  {activeLanguage.toUpperCase()} CATEGORIES
                </Text>

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
                          backgroundColor: isSelected ? catColor : `${catColor}cc`,
                          color: "white",
                          padding: "8px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 6px 50%)",
                          filter: isSelected ? "drop-shadow(2px 4px 6px rgba(0,0,0,0.3))" : "none",
                          transform: isSelected ? "translateX(-6px)" : "none",
                          transition: "all 0.18s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                        title={cat.category_name}
                      >
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
                        <Badge size="xs" variant="white" color="dark" style={{ marginRight: 6, fontSize: 9 }}>
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
            {/* Arabic Text Display (Automatically verified & loaded from Quran API) */}
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
