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

  // Fetch Meta Categories on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCategories(true);
    fetch("/api/category-lectures/meta")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setMetaCategories(data);
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

  // Filtered lectures for current category
  const currentLectures = useMemo(() => {
    if (!selectedCategory) return [];
    const lectures = selectedCategory.lectures || [];
    if (!filterQuery) return lectures;
    const q = filterQuery.toLowerCase();
    return lectures.filter((lec) => {
      const name = (lec.lecture_name || "").toLowerCase();
      const year = String(lec.year_delivered || "").toLowerCase();
      return name.includes(q) || year.includes(q);
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
                          {occ.lecture_name}
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

                        {(occ.video_url_eng || occ.video_url_urdu) && (
                          <Button
                            size="compact-xs"
                            variant="light"
                            color="red"
                            leftSection={<IconBrandYoutube size={14} />}
                            onClick={() =>
                              setActiveVideoModal({
                                title: `${occ.lecture_name} - Surah ${occ.surah_number}:${occ.ayat_number}`,
                                url: occ.video_url_eng || occ.video_url_urdu,
                              })
                            }
                          >
                            Watch Clip
                          </Button>
                        )}
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
                  {selectedLecture.lecture_name} (
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

                          <Text fw={700} size="md" style={{ lineHeight: 1.3, marginBottom: 8, color: palette.text }}>
                            {lec.lecture_name}
                          </Text>
                        </div>

                        <div style={{ borderTop: `1px dashed ${palette.border}`, paddingTop: 12, marginTop: 12 }}>
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
                      📜 Verses in: {selectedLecture.lecture_name} ({currentVerses.length} ayats)
                    </Text>
                    <Text size="xs" c="dimmed">
                      {selectedCategory.category_name} • Year: {selectedLecture.year_delivered || "N/A"}
                    </Text>
                  </div>
                </Group>
              </Group>

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
                    const videoUrl =
                      verse.video_url_eng ||
                      verse.youtube_url_eng ||
                      verse.video_url_urdu ||
                      verse.youtube_url_urdu ||
                      verse.video_url;

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
                          {videoUrl ? (
                            <Button
                              fullWidth
                              size="xs"
                              color="red"
                              variant="filled"
                              leftSection={<IconBrandYoutube size={15} />}
                              onClick={() =>
                                setActiveVideoModal({
                                  title: `${selectedLecture.lecture_name} - Surah ${verse.surah_number}:${verse.ayat_number}`,
                                  url: videoUrl,
                                })
                              }
                            >
                              Watch Video Clip
                            </Button>
                          ) : (
                            <Text size="xs" c="dimmed" ta="center">
                              No video clip attached
                            </Text>
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

      {/* Video Player Modal */}
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
                <Text size="sm">This clip can be viewed at:</Text>
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
