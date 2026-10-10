import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Container,
  Stack,
  Group,
  Text,
  Button,
  MultiSelect,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconBookmark,
  IconRefresh,
  IconFilter,
  IconChalkboard,
} from "@tabler/icons-react";

import QuranHeader from "./Quran-Header";
import VerseCard from "./VerseCard";
import QuizControls from "./QuizControls";

import { fetchRandomVerse } from "../api/quranApi";
import { fetchCategoryLecturesMeta } from "../api/categoryLecturesApi";
import { SURAH_LIST, LOCAL_PRESET_AYAT } from "../../../data/quranData";

export default function QuranVerseMemorizerPanel() {
  const [dataSource, setDataSource] = useState("live"); // 'live' | 'preset' | 'lectures'
  const [currentAyah, setCurrentAyah] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Statistics
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);

  // Quiz Choice State
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [selectedAyahNo, setSelectedAyahNo] = useState(null);
  const [surahStatus, setSurahStatus] = useState(null);
  const [ayahStatus, setAyahStatus] = useState(null);

  // UI State
  const [showHint, setShowHint] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef(null);

  // Lecture Categories & Lectures Multi-Select State
  const [metaCategories, setMetaCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedLectureIds, setSelectedLectureIds] = useState([]);

  // Chalkboard Filter Panel Open/Hide State
  const [isChalkboardOpen, setIsChalkboardOpen] = useState(false);

  // Fetch metadata on mount
  useEffect(() => {
    fetchCategoryLecturesMeta().then((data) => {
      setMetaCategories(Array.isArray(data) ? data : []);
    });
  }, []);

  // Compute unique and valid category filter options safely
  // const availableCategoryOptions = useMemo(() => {
  //   if (!Array.isArray(metaCategories)) return [];
  //   const map = new Map();
  //   metaCategories.forEach((cat) => {
  //     const val = cat.categoryId ?? cat.category_id ?? cat._id;
  //     const lbl = cat.categoryName ?? cat.category_name;
  //     if (val !== undefined && val !== null && lbl) {
  //       map.set(String(val), { value: String(val), label: String(lbl) });
  //     }
  //   });
  //   return Array.from(map.values());
  // }, [metaCategories]);

  // Compute unique and valid category filter options strictly for English ("eng") categories
  const availableCategoryOptions = useMemo(() => {
    if (!Array.isArray(metaCategories)) return [];
    const map = new Map();
    metaCategories.forEach((cat) => {
      // Check if language is explicitly English ("eng") or defaults to it
      const lang = (cat.language || "eng").toLowerCase();
      if (lang === "eng") {
        const val = cat.categoryId ?? cat.category_id ?? cat._id;
        const lbl = cat.categoryName ?? cat.category_name;
        if (val !== undefined && val !== null && lbl) {
          map.set(String(val), { value: String(val), label: String(lbl) });
        }
      }
    });
    return Array.from(map.values());
  }, [metaCategories]);

  // Compute available lecture options strictly filtered by selected category IDs
  const availableLectureOptions = useMemo(() => {
    let optionsMap = new Map();
    if (!Array.isArray(metaCategories)) return [];

    metaCategories.forEach((cat) => {
      const catVal = String(cat.categoryId ?? cat.category_id ?? cat._id ?? "");

      const isCategorySelected =
        selectedCategoryIds.length === 0 ||
        selectedCategoryIds.map(String).includes(catVal);

      if (isCategorySelected) {
        const booklets = cat.booklets || cat.lectures || [];
        booklets.forEach((b) => {
          const lVal = b.lectureId ?? b.lecture_id ?? b.id;
          const lLbl = b.lectureName ?? b.lecture_name ?? b.name;
          const count =
            b.ayatCount ??
            b.total_ayats ??
            (b.ayat_references ? b.ayat_references.length : 0);
          if (lVal !== undefined && lVal !== null && lLbl) {
            optionsMap.set(String(lVal), {
              value: String(lVal),
              label: `${lLbl} (${count} ayat)`,
            });
          }
        });
      }
    });
    return Array.from(optionsMap.values());
  }, [metaCategories, selectedCategoryIds]);

  // Compute final aggregated pool of ayat references matching multi-selections safely
  const customLectureAyatPool = useMemo(() => {
    let pool = [];
    if (!Array.isArray(metaCategories)) return pool;

    metaCategories.forEach((cat) => {
      const catVal = String(cat.categoryId ?? cat.category_id ?? cat._id ?? "");
      const matchCat =
        selectedCategoryIds.length === 0 ||
        selectedCategoryIds.map(String).includes(catVal);

      if (matchCat) {
        const booklets = cat.booklets || cat.lectures || [];
        booklets.forEach((b) => {
          const lVal = String(b.lectureId ?? b.lecture_id ?? b.id ?? "");
          const matchLec =
            selectedLectureIds.length === 0 ||
            selectedLectureIds.map(String).includes(lVal);

          if (matchLec) {
            const ayatList = b.ayatList || b.ayat_references || [];
            ayatList.forEach((ayat) => {
              const eng = ayat.english_translation || ayat.eng || "";
              const urdu = ayat.urdu_translation || ayat.urdu || "";
              const hindi = ayat.hindi_translation || ayat.hindi || "";

              pool.push({
                globalId: ayat.ayat_number,
                surahNo: ayat.surah_number,
                surahName: ayat.surah_name,
                surahNameArabic: ayat.surah_name,
                ayahNo: ayat.ayat_number,
                totalAyahsInSurah: 200,
                arabic: ayat.arabic_text || "",
                surahNumber: ayat.surah_number,
                ayatNumber: ayat.ayat_number,

                // Map BOTH MongoDB keys and VerseCard expected keys to prevent any mismatch:
                english_translation: eng,
                translation: eng,
                urdu_translation: urdu,
                translationUrdu: urdu,
                hindi_translation: hindi,
                translationHindi: hindi,

                notes:
                  ayat.points_notes ||
                  ayat.points_notes_eng ||
                  ayat.points_notes_urdu ||
                  "",
                audioUrl:
                  ayat.youtube_url_eng ||
                  ayat.youtube_url ||
                  ayat.video_url ||
                  "",
              });
            });
          }
        });
      }
    });
    return pool;
  }, [metaCategories, selectedCategoryIds, selectedLectureIds]);

  // Fetch missing translations & audio from Al-Quran Cloud API on demand
  const enrichTranslationsIfNeeded = async (ayahData) => {
    const sNo = ayahData.surahNo || ayahData.surahNumber;
    const aNo = ayahData.ayahNo || ayahData.ayatNumber;
    if (!sNo || !aNo) return ayahData;

    const needsArabic = !ayahData.arabic || ayahData.arabic.trim() === "";
    const needsEng =
      !ayahData.translation || ayahData.translation.trim() === "";
    const needsUrdu =
      !ayahData.translationUrdu || ayahData.translationUrdu.trim() === "";
    const needsHindi =
      !ayahData.translationHindi || ayahData.translationHindi.trim() === "";
    const needsAudio = !ayahData.audioUrl;

    if (!needsArabic && !needsEng && !needsUrdu && !needsHindi && !needsAudio) {
      return ayahData;
    }

    const updated = { ...ayahData };

    try {
      const editionsList = [];
      if (needsArabic) editionsList.push("quran-uthmani");
      if (needsEng) editionsList.push("en.sahih");
      if (needsUrdu) editionsList.push("ur.jalandhry");
      if (needsHindi) editionsList.push("hi.hindi");
      editionsList.push("ar.alafasy");

      const res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${sNo}:${aNo}/editions/${editionsList.join(",")}`,
      );
      const json = await res.json();

      if (json.code === 200 && Array.isArray(json.data)) {
        json.data.forEach((item) => {
          if (
            item.edition.identifier === "quran-uthmani" &&
            (!updated.arabic || updated.arabic.trim() === "")
          ) {
            updated.arabic = item.text;
          }
          if (
            item.edition.identifier === "en.sahih" &&
            (!updated.translation || updated.translation.trim() === "")
          ) {
            updated.english_translation = item.text;
            updated.translation = item.text;
          }
          if (
            item.edition.identifier === "ur.jalandhry" &&
            (!updated.translationUrdu || updated.translationUrdu.trim() === "")
          ) {
            updated.urdu_translation = item.text;
            updated.translationUrdu = item.text;
          }
          if (
            item.edition.identifier === "hi.hindi" &&
            (!updated.translationHindi ||
              updated.translationHindi.trim() === "")
          ) {
            updated.hindi_translation = item.text;
            updated.translationHindi = item.text;
          }
          if (item.edition.format === "audio" && !updated.audioUrl) {
            updated.audioUrl = item.audio;
          }
        });
      }

      if (!updated.audioUrl) {
        updated.audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${sNo}/${aNo}.mp3`;
      }
    } catch (err) {
      console.error("Error fetching missing verse editions from API:", err);
    }

    return updated;
  };

  const loadNextAyah = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setSelectedSurah(null);
    setSelectedAyahNo(null);
    setSurahStatus(null);
    setAyahStatus(null);
    setShowHint(false);
    setIsPlayingAudio(false);

    let rawAyah = null;

    if (dataSource === "live") {
      rawAyah = await fetchRandomVerse();
    } else if (dataSource === "preset") {
      rawAyah =
        LOCAL_PRESET_AYAT[Math.floor(Math.random() * LOCAL_PRESET_AYAT.length)];
    } else if (dataSource === "lectures") {
      const pool =
        customLectureAyatPool.length > 0
          ? customLectureAyatPool
          : LOCAL_PRESET_AYAT;

      rawAyah = pool[Math.floor(Math.random() * pool.length)];
    }

    if (rawAyah) {
      const fullyEnrichedAyah = await enrichTranslationsIfNeeded(rawAyah);
      setCurrentAyah(fullyEnrichedAyah);
    }

    setIsLoading(false);
  };

  // Safe effect: Only trigger when dataSource changes. User uses the Draw / Wipe buttons to change verses.
  useEffect(() => {
    loadNextAyah();
  }, [dataSource]);

  const surahOptions = useMemo(() => {
    if (!currentAyah) return [];
    const correctSurah = SURAH_LIST.find(
      (s) => s.no === currentAyah.surahNo,
    ) || {
      no: currentAyah.surahNo,
      name: currentAyah.surahName,
      arabic: currentAyah.surahNameArabic || "سورة",
      ayahs: currentAyah.totalAyahsInSurah,
    };

    const decoys = SURAH_LIST.filter((s) => s.no !== currentAyah.surahNo)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    return [correctSurah, ...decoys].sort(() => 0.5 - Math.random());
  }, [currentAyah]);

  const ayahNoOptions = useMemo(() => {
    if (!currentAyah) return [];
    const correctAyahNo = currentAyah.ayahNo;
    const totalInSurah = currentAyah.totalAyahsInSurah || 100;
    const decoys = new Set();

    let attempts = 0;
    while (decoys.size < 3 && attempts < 50) {
      attempts++;
      const offset = Math.floor(Math.random() * 11) - 5;
      const candidate = correctAyahNo + offset;
      if (
        candidate > 0 &&
        candidate <= totalInSurah &&
        candidate !== correctAyahNo
      ) {
        decoys.add(candidate);
      } else {
        const randomCand = Math.floor(Math.random() * totalInSurah) + 1;
        if (randomCand !== correctAyahNo) decoys.add(randomCand);
      }
    }

    return [correctAyahNo, ...Array.from(decoys)].sort((a, b) => a - b);
  }, [currentAyah]);

  const checkOverallCompletion = (isSurahDone, isAyahDone) => {
    if (isSurahDone && isAyahDone) {
      setCorrectAttempts((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    }
  };

  const handleSelectSurah = (surah) => {
    if (!currentAyah) return;
    setSelectedSurah(surah);
    setTotalAttempts((prev) => prev + 1);

    if (surah.no === currentAyah.surahNo) {
      setSurahStatus("correct");
      setScore((prev) => prev + 5);
      checkOverallCompletion(true, selectedAyahNo === currentAyah.ayahNo);
    } else {
      setSurahStatus("wrong");
      setStreak(0);
    }
  };

  const handleSelectAyahNo = (num) => {
    if (!currentAyah) return;
    setSelectedAyahNo(num);
    setTotalAttempts((prev) => prev + 1);

    if (num === currentAyah.ayahNo) {
      setAyahStatus("correct");
      setScore((prev) => prev + 5);
      checkOverallCompletion(selectedSurah?.no === currentAyah.surahNo, true);
    } else {
      setAyahStatus("wrong");
      setStreak(0);
    }
  };

  const toggleAudio = () => {
    if (!currentAyah?.audioUrl) return;
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = currentAyah.audioUrl;
        audioRef.current.play().catch((e) => console.error(e));
        setIsPlayingAudio(true);
      }
    }
  };

  const accuracyRate =
    totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 100;

  return (
    <div
      style={{
        backgroundColor: "#FAF7F0",
        minHeight: "100vh",
        paddingBottom: "2rem",
      }}
    >
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      <Container size="lg" py="md">
        <Stack gap="md">
          <QuranHeader
            dataSource={dataSource}
            setDataSource={setDataSource}
            score={score}
            streak={streak}
            accuracyRate={accuracyRate}
            onOpenFilterModal={() => {
              setDataSource("lectures");
              setIsChalkboardOpen((prev) => !prev);
            }}
          />

          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconBookmark size={16} color="teal" />
              <Text size="xs" c="dimmed">
                Source:{" "}
                <strong>
                  {dataSource === "live"
                    ? "Full Quran API"
                    : dataSource === "preset"
                      ? "Preset Deck"
                      : `MongoDB Lectures (${customLectureAyatPool.length} Ayat Loaded)`}
                </strong>
              </Text>
            </Group>

            <Group gap="xs">
              <Button
                variant={dataSource === "lectures" ? "filled" : "light"}
                color="teal"
                size="xs"
                leftSection={<IconFilter size={14} />}
                onClick={() => {
                  setDataSource("lectures");
                  setIsChalkboardOpen((prev) => !prev);
                }}
              >
                {isChalkboardOpen
                  ? "Hide Blackboard"
                  : "Open Lecture Blackboard"}
              </Button>

              <Button
                variant="default"
                size="xs"
                loading={isLoading}
                leftSection={<IconRefresh size={14} />}
                onClick={loadNextAyah}
              >
                Draw New Verse
              </Button>
            </Group>
          </Group>

          {/* REALISTIC SCHOOL CHALKBOARD PANEL */}
          {isChalkboardOpen && (
            <Box
              style={{
                /* Outer wooden frame */
                background: "linear-gradient(135deg, #6b3a2a 0%, #8b4e35 25%, #7a4030 50%, #5c2f1e 75%, #6b3a2a 100%)",
                borderRadius: "6px",
                padding: "14px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,200,150,0.3)",
                position: "relative",
              }}
            >
              {/* Wood grain lines */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "6px", pointerEvents: "none",
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(0,0,0,0.08) 18px, rgba(0,0,0,0.08) 19px)`,
              }} />

              {/* Inner chalkboard surface */}
              <div style={{
                background: "linear-gradient(160deg, #2d4a35 0%, #1e3828 30%, #243d2e 60%, #1a3322 100%)",
                borderRadius: "3px",
                padding: "24px 28px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "inset 0 0 80px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.4)",
              }}>

                {/* Chalk dust smudge overlay */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "3px",
                  backgroundImage: `
                    radial-gradient(ellipse 120px 40px at 15% 10%, rgba(255,255,255,0.025) 0%, transparent 70%),
                    radial-gradient(ellipse 80px 25px at 80% 85%, rgba(255,255,255,0.02) 0%, transparent 70%),
                    radial-gradient(ellipse 60px 20px at 60% 30%, rgba(255,255,255,0.015) 0%, transparent 70%),
                    radial-gradient(ellipse 200px 6px at 50% 50%, rgba(255,255,255,0.018) 0%, transparent 80%)
                  `,
                }} />

                {/* Faint chalk eraser streaks */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage: `
                    repeating-linear-gradient(
                      172deg,
                      transparent 0px, transparent 28px,
                      rgba(255,255,255,0.012) 28px, rgba(255,255,255,0.012) 29px,
                      transparent 29px, transparent 58px
                    )
                  `,
                }} />

                <Stack gap="lg">
                  {/* Header Row */}
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <IconChalkboard size={20} color="rgba(255,255,255,0.75)" />
                      <span style={{
                        fontFamily: "'Segoe UI', sans-serif",
                        fontSize: "15px",
                        fontWeight: 400,
                        letterSpacing: "3px",
                        color: "rgba(255, 255, 255, 0.82)",
                        textShadow: "0 0 8px rgba(255,255,255,0.35), 1px 1px 0 rgba(0,0,0,0.5)",
                        textTransform: "uppercase",
                        filter: "blur(0.3px)",
                      }}>
                        Category &amp; Lecture Selector
                      </span>
                    </Group>
                    <button
                      onClick={() => setIsChalkboardOpen(false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,160,140,0.85)",
                        fontFamily: "'Segoe UI', sans-serif",
                        fontSize: "12px",
                        letterSpacing: "1.5px",
                        textShadow: "0 0 6px rgba(255,120,100,0.5)",
                        opacity: 0.9,
                        filter: "blur(0.2px)",
                      }}
                    >
                      ✕ CLOSE
                    </button>
                  </Group>

                  {/* Chalk horizontal rule */}
                  <div style={{
                    height: "2px",
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 10%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 90%, transparent 100%)",
                    filter: "blur(0.5px)",
                    margin: "-8px 0 -4px",
                  }} />

                  <p style={{
                    fontFamily: "'Segoe UI', sans-serif",
                    fontSize: "13px",
                    color: "rgba(220, 240, 225, 0.72)",
                    margin: 0,
                    letterSpacing: "1.5px",
                    textShadow: "0 0 5px rgba(200,255,210,0.3)",
                    filter: "blur(0.25px)",
                  }}>
                    Choose a category and lecture to filter your verse pool.
                  </p>

                  {/* FILTER CATEGORIES */}
                  <div>
                    <div style={{
                      fontFamily: "'Segoe UI', sans-serif",
                      fontSize: "11px",
                      letterSpacing: "3px",
                      color: "rgba(180, 230, 195, 0.8)",
                      textShadow: "0 0 6px rgba(150,255,180,0.4)",
                      marginBottom: "10px",
                      textTransform: "uppercase",
                      filter: "blur(0.2px)",
                    }}>
                      📁 Filter Categories
                    </div>
                    <MultiSelect
                      placeholder="Select category..."
                      data={availableCategoryOptions}
                      value={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                      clearable
                      styles={{
                        input: {
                          backgroundColor: "rgba(10, 28, 18, 0.85)",
                          border: "1px solid rgba(130, 200, 150, 0.45)",
                          color: "rgba(220, 245, 225, 0.9)",
                          fontFamily: "'Segoe UI', sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
                        },
                        dropdown: {
                          backgroundColor: "#0f1f14",
                          border: "1px solid rgba(130, 200, 150, 0.35)",
                        },
                        option: {
                          backgroundColor: "#0f1f14",
                          color: "rgba(220, 245, 225, 0.85)",
                          fontFamily: "'Segoe UI', sans-serif",
                        },
                        pill: {
                          backgroundColor: "rgba(30, 80, 45, 0.9)",
                          color: "rgba(200, 240, 210, 0.95)",
                          border: "1px solid rgba(100, 180, 120, 0.5)",
                        },
                      }}
                    />
                  </div>

                  {/* FILTER LECTURES */}
                  <div>
                    <div style={{
                      fontFamily: "'Segoe UI', sans-serif",
                      fontSize: "11px",
                      letterSpacing: "3px",
                      color: "rgba(255, 220, 160, 0.8)",
                      textShadow: "0 0 6px rgba(255,200,100,0.35)",
                      marginBottom: "10px",
                      textTransform: "uppercase",
                      filter: "blur(0.2px)",
                    }}>
                      📚 Filter Lectures
                    </div>
                    <MultiSelect
                      placeholder="Select lectures..."
                      data={availableLectureOptions}
                      value={selectedLectureIds}
                      onChange={setSelectedLectureIds}
                      clearable
                      styles={{
                        input: {
                          backgroundColor: "rgba(10, 28, 18, 0.85)",
                          border: "1px solid rgba(200, 160, 80, 0.45)",
                          color: "rgba(220, 245, 225, 0.9)",
                          fontFamily: "'Segoe UI', sans-serif",
                          fontSize: "13px",
                          letterSpacing: "0.5px",
                          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.4)",
                        },
                        dropdown: {
                          backgroundColor: "#0f1f14",
                          border: "1px solid rgba(200, 160, 80, 0.35)",
                        },
                        option: {
                          backgroundColor: "#0f1f14",
                          color: "rgba(220, 245, 225, 0.85)",
                          fontFamily: "'Segoe UI', sans-serif",
                        },
                        pill: {
                          backgroundColor: "rgba(80, 45, 10, 0.9)",
                          color: "rgba(255, 225, 170, 0.95)",
                          border: "1px solid rgba(200, 155, 70, 0.5)",
                        },
                      }}
                    />
                  </div>

                  {/* Chalk divider */}
                  <div style={{
                    height: "1px",
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.15) 80%, transparent 100%)",
                    filter: "blur(0.4px)",
                  }} />

                  {/* Eraser / Wipe Button */}
                  <button
                    onClick={() => { setIsChalkboardOpen(false); loadNextAyah(); }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "linear-gradient(180deg, #7d5a3c 0%, #6b4a30 40%, #5c3c24 100%)",
                      border: "1px solid rgba(210, 180, 140, 0.5)",
                      borderRadius: "4px",
                      color: "rgba(255, 248, 220, 0.92)",
                      fontFamily: "'Segoe UI', sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                      letterSpacing: "2.5px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                      boxShadow: "0 4px 0 #3a2010, 0 6px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,220,180,0.25)",
                      transition: "all 0.12s ease",
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = "translateY(3px)"}
                    onMouseUp={e => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    🧽&nbsp;&nbsp;Wipe &amp; Practice &mdash; {customLectureAyatPool.length} Verses Ready
                  </button>

                </Stack>
              </div>

              {/* Chalk tray at bottom of wooden frame */}
              <div style={{
                height: "10px",
                marginTop: "6px",
                background: "linear-gradient(180deg, #5a3220 0%, #4a2818 100%)",
                borderRadius: "0 0 4px 4px",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                paddingLeft: "12px",
                gap: "8px",
              }}>
                {/* chalk stick decorations */}
                {["#f5f0e8","#f0e8d8","#e8f5e9","#fff9c4","#fce4ec"].map((c, i) => (
                  <div key={i} style={{
                    width: "18px", height: "5px", borderRadius: "2px",
                    backgroundColor: c, opacity: 0.7,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
                  }} />
                ))}
              </div>
            </Box>
          )}

          <VerseCard
            currentAyah={currentAyah}
            isLoading={isLoading}
            isPlayingAudio={isPlayingAudio}
            toggleAudio={toggleAudio}
            showHint={showHint}
            setShowHint={setShowHint}
            surahStatus={surahStatus}
            ayahStatus={ayahStatus}
          />

          {currentAyah && !isLoading && (
            <QuizControls
              currentAyah={currentAyah}
              surahOptions={surahOptions}
              ayahNoOptions={ayahNoOptions}
              selectedSurah={selectedSurah}
              selectedAyahNo={selectedAyahNo}
              surahStatus={surahStatus}
              ayahStatus={ayahStatus}
              handleSelectSurah={handleSelectSurah}
              handleSelectAyahNo={handleSelectAyahNo}
              loadNextAyah={loadNextAyah}
            />
          )}
        </Stack>
      </Container>
    </div>
  );
}
