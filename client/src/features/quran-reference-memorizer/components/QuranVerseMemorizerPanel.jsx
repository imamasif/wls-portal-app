import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Container,
  Stack,
  Group,
  Text,
  Button,
  Modal,
  MultiSelect,
  Divider,
} from "@mantine/core";
import { IconBookmark, IconRefresh, IconFilter } from "@tabler/icons-react";

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Fetch metadata on mount
  useEffect(() => {
    fetchCategoryLecturesMeta().then((data) => {
      setMetaCategories(Array.isArray(data) ? data : []);
    });
  }, []);

  // Compute unique and valid category filter options safely
  const availableCategoryOptions = useMemo(() => {
    if (!Array.isArray(metaCategories)) return [];
    const map = new Map();
    metaCategories.forEach((cat) => {
      const val = cat.categoryId ?? cat.category_id ?? cat._id;
      const lbl = cat.categoryName ?? cat.category_name;
      if (val !== undefined && val !== null && lbl) {
        map.set(String(val), { value: String(val), label: String(lbl) });
      }
    });
    return Array.from(map.values());
  }, [metaCategories]);

  // Compute available lecture options based on chosen category multi-select safely
  const availableLectureOptions = useMemo(() => {
    let optionsMap = new Map();
    if (!Array.isArray(metaCategories)) return [];

    metaCategories.forEach((cat) => {
      const catVal = cat.categoryId ?? cat.category_id ?? cat._id;
      if (
        catVal !== undefined &&
        (selectedCategoryIds.length === 0 ||
          selectedCategoryIds.includes(String(catVal)))
      ) {
        // Support both 'booklets' and 'lectures' property names
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
              label: `${cat.categoryName || cat.category_name || "Category"} ➔ ${lLbl} (${count} ayat)`,
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
      const catVal = cat.categoryId ?? cat.category_id ?? cat._id;
      const matchCat =
        selectedCategoryIds.length === 0 ||
        (catVal !== undefined && selectedCategoryIds.includes(String(catVal)));

      if (matchCat) {
        const booklets = cat.booklets || cat.lectures || [];
        booklets.forEach((b) => {
          const lVal = b.lectureId ?? b.lecture_id ?? b.id;
          const matchLec =
            selectedLectureIds.length === 0 ||
            (lVal !== undefined && selectedLectureIds.includes(String(lVal)));

          if (matchLec) {
            const ayatList = b.ayatList || b.ayat_references || [];
            ayatList.forEach((ayat) => {
              pool.push({
                globalId: ayat.ayat_number,
                surahNo: ayat.surah_number,
                surahName: ayat.surah_name,
                surahNameArabic: ayat.surah_name,
                ayahNo: ayat.ayat_number,
                totalAyahsInSurah: 200,
                arabic: ayat.arabic_text,
                translation: ayat.english_translation,
                translationUrdu: ayat.urdu_translation,
                translationHindi: ayat.hindi_translation,
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

  const loadNextAyah = async () => {
    setIsLoading(true);
    setSelectedSurah(null);
    setSelectedAyahNo(null);
    setSurahStatus(null);
    setAyahStatus(null);
    setShowHint(false);
    setIsPlayingAudio(false);

    if (dataSource === "live") {
      const ayah = await fetchRandomVerse();
      setCurrentAyah(ayah);
    } else if (dataSource === "preset") {
      const randomPreset =
        LOCAL_PRESET_AYAT[Math.floor(Math.random() * LOCAL_PRESET_AYAT.length)];
      setCurrentAyah(randomPreset);
    } else if (dataSource === "lectures") {
      const pool =
        customLectureAyatPool.length > 0
          ? customLectureAyatPool
          : LOCAL_PRESET_AYAT;

      const selectedDbAyat = pool[Math.floor(Math.random() * pool.length)];

      let liveArabicText = selectedDbAyat.arabic; // fallback
      let liveAudioUrl = selectedDbAyat.audioUrl;

      // Fetch pristine Arabic text and audio from Live Quran API using surah_number & ayat_number
      if (selectedDbAyat.surahNo && selectedDbAyat.ayahNo) {
        try {
          const res = await fetch(
            `https://api.alquran.cloud/v1/ayah/${selectedDbAyat.surahNo}:${selectedDbAyat.ayahNo}/editions/quran-uthmani,en.sahih,ar.alafasy`,
          );
          const json = await res.json();
          if (json.code === 200 && json.data && json.data.length >= 2) {
            liveArabicText = json.data[0].text;
            liveAudioUrl =
              json.data[2]?.audio || json.data[0].audio || liveAudioUrl;
          }
        } catch (err) {
          console.error(
            "Error fetching live verse data from API, using DB text:",
            err,
          );
        }
      }

      // Merge MongoDB translation & notes with Live Quran API Arabic text
      setCurrentAyah({
        ...selectedDbAyat,
        arabic: liveArabicText,
        audioUrl: liveAudioUrl,
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadNextAyah();
  }, [dataSource, selectedCategoryIds, selectedLectureIds]);

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
            onOpenFilterModal={() => setIsFilterModalOpen(true)}
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
              {dataSource === "lectures" && (
                <Button
                  variant="light"
                  color="teal"
                  size="xs"
                  leftSection={<IconFilter size={14} />}
                  onClick={() => setIsFilterModalOpen(true)}
                >
                  Filter Categories & Lectures
                </Button>
              )}
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

      {/* Category & Lecture Filter Selection Modal */}
      <Modal
        opened={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Select Categories & Lectures for Practice"
        radius="lg"
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Choose one or more categories and specific lectures from your
            MongoDB collection to target your vocabulary and reference
            memorization.
          </Text>

          <MultiSelect
            label="Filter Categories"
            placeholder="Select category or categories"
            data={availableCategoryOptions}
            value={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
            clearable
          />

          <MultiSelect
            label="Filter Lectures"
            placeholder="Select lecture(s)"
            data={availableLectureOptions}
            value={selectedLectureIds}
            onChange={setSelectedLectureIds}
            clearable
          />

          <Divider my="sm" />

          <Button
            fullWidth
            color="teal"
            onClick={() => {
              setIsFilterModalOpen(false);
              loadNextAyah();
            }}
          >
            Apply & Practice ({customLectureAyatPool.length} Verses Available)
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
