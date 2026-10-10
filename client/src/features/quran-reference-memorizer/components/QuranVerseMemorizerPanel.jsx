import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Container,
  Stack,
  Group,
  Text,
  Button,
} from "@mantine/core";
import {
  IconBookmark,
  IconRefresh,
  IconFilter,
} from "@tabler/icons-react";
import {
  ChevronDown,
  Check,
  X,
  BookOpen,
  Folder,
  Play,
  Clock,
  User,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  Compass,
  Search,
  Sparkles,
  RotateCcw,
} from "lucide-react";

import QuranHeader from "./Quran-Header";
import VerseCard from "./VerseCard";
import QuizControls from "./QuizControls";

import { fetchRandomVerse } from "../api/quranApi";
import { fetchCategoryLecturesMeta } from "../api/categoryLecturesApi";
import { SURAH_LIST, LOCAL_PRESET_AYAT } from "../../../data/quranData";

const customStyles = `
  /* Main Container */
  .apple-container {
    max-width: 100%;
    margin: 0 auto;
  }

  /* Glossy Embossed Base Card */
  .apple-embossed-card {
    background: linear-gradient(145deg, #ffffff 0%, #f4f6fa 100%);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 
      0 16px 40px -12px rgba(0, 0, 0, 0.08),
      0 2px 6px rgba(0, 0, 0, 0.03),
      inset 0 1.5px 1px rgba(255, 255, 255, 1),
      inset 0 -2px 4px rgba(0, 0, 0, 0.03);
    position: relative;
    overflow: hidden;
    padding: 22px;
  }

  .apple-embossed-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%);
    pointer-events: none;
  }

  /* Interactive Control Shell */
  .apple-control-box {
    background: linear-gradient(180deg, #ffffff 0%, #f2f4f8 100%);
    border: 1px solid rgba(200, 205, 215, 0.75);
    border-radius: 14px;
    padding: 8px 12px;
    box-shadow: 
      0 2px 6px rgba(0, 0, 0, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 -1.5px 2px rgba(0, 0, 0, 0.03);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
    min-height: 46px;
    display: flex;
    align-items: center;
  }

  .apple-control-box:hover {
    background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
    border-color: rgba(0, 122, 255, 0.5);
    box-shadow: 
      0 6px 16px rgba(0, 122, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 1);
    transform: translateY(-1px);
  }

  .apple-control-box.open {
    border-color: #007AFF;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  }

  /* Multi Select Tag Badge */
  .apple-tag {
    background: linear-gradient(180deg, #ffffff 0%, #eceff4 100%);
    border: 1px solid rgba(190, 195, 205, 0.7);
    border-radius: 16px;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #1d1d1f;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }

  .apple-tag:hover {
    border-color: rgba(0, 122, 255, 0.6);
    color: #007AFF;
  }

  .apple-tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s ease;
  }

  .apple-tag-remove:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.08);
  }

  /* Popover Dropdown Window */
  .apple-dropdown-popover {
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(220, 225, 235, 0.9);
    border-radius: 18px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.12),
      0 4px 12px rgba(0, 0, 0, 0.05),
      inset 0 1px 1px rgba(255, 255, 255, 0.9);
    padding: 10px;
    z-index: 1000;
  }

  /* Search Input inside Dropdown */
  .apple-search-input {
    width: 100%;
    padding: 8px 12px 8px 32px;
    border-radius: 10px;
    border: 1px solid rgba(200, 205, 215, 0.6);
    background: rgba(240, 242, 246, 0.7);
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
  }

  .apple-search-input:focus {
    background: #ffffff;
    border-color: #007AFF;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.15);
  }

  /* Selectable Dropdown Item */
  .apple-option-item {
    border-radius: 10px;
    padding: 8px 10px;
    transition: all 0.15s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 500;
    color: #1d1d1f;
    margin-bottom: 2px;
  }

  .apple-option-item:hover {
    background: rgba(0, 122, 255, 0.08);
    color: #007AFF;
  }

  .apple-option-item.selected {
    background: linear-gradient(135deg, #007AFF 0%, #0056b3 100%);
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(0, 122, 255, 0.28);
  }

  /* Tactile Embossed Primary Button */
  .apple-button-embossed {
    background: linear-gradient(180deg, #0077FF 0%, #0055D6 100%);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #ffffff;
    font-weight: 600;
    font-size: 15px;
    letter-spacing: -0.2px;
    padding: 13px 22px;
    box-shadow: 
      0 10px 24px rgba(0, 118, 255, 0.35),
      0 2px 4px rgba(0, 0, 0, 0.1),
      inset 0 1px 1.5px rgba(255, 255, 255, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.2);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .apple-button-embossed::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 45%;
    background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
    border-radius: 15px 15px 0 0;
  }

  .apple-button-embossed:hover {
    background: linear-gradient(180deg, #1A85FF 0%, #0062E6 100%);
    box-shadow: 
      0 12px 28px rgba(0, 118, 255, 0.45),
      0 4px 8px rgba(0, 0, 0, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.6);
    transform: translateY(-2px);
  }

  .apple-button-embossed:active {
    transform: translateY(1px) scale(0.985);
    background: linear-gradient(180deg, #0050C7 0%, #0040A8 100%);
    box-shadow: 
      0 4px 10px rgba(0, 118, 255, 0.25),
      inset 0 2px 5px rgba(0, 0, 0, 0.35);
  }

  /* Live Preview Cards */
  .apple-lecture-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(220, 226, 236, 0.85);
    border-radius: 16px;
    padding: 12px 16px;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
  }

  .apple-lecture-card:hover {
    background: #ffffff;
    box-shadow: 0 8px 22px rgba(0, 122, 255, 0.08);
    transform: translateY(-2px);
    border-color: rgba(0, 122, 255, 0.35);
  }

  /* Badge Pill */
  .apple-pill {
    padding: 3px 9px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  /* Scrollbar styling */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.25);
  }
`;

const CustomMultiSelect = ({
  title,
  icon: Icon,
  options,
  selectedIds,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => {
      const text = `${opt.label || ""} ${opt.title || ""} ${opt.instructor || ""} ${opt.categoryName || ""}`.toLowerCase();
      return text.includes(searchQuery.toLowerCase());
    });
  }, [options, searchQuery]);

  const toggleOption = (id, e) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeTag = (id, e) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== id));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedObjects = useMemo(() => {
    return options.filter((opt) => selectedIds.includes(opt.id));
  }, [options, selectedIds]);

  return (
    <div style={{ position: "relative", width: "100%" }} ref={containerRef}>
      {/* Header Label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#8e8e93",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        {selectedIds.length > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#007AFF",
              cursor: "pointer",
            }}
            onClick={clearAll}
          >
            Reset ({selectedIds.length})
          </span>
        )}
      </div>

      {/* Control Box Container */}
      <div
        className={`apple-control-box ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              flexWrap: "wrap",
              overflow: "hidden",
            }}
          >
            {Icon && <Icon size={18} color="#007AFF" style={{ flexShrink: 0 }} />}

            {selectedObjects.length === 0 ? (
              <span
                style={{
                  fontSize: 13,
                  color: "#a0aec0",
                  fontStyle: "italic",
                }}
              >
                {placeholder}
              </span>
            ) : (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {selectedObjects.map((item) => (
                  <span key={item.id} className="apple-tag">
                    {item.icon && <span>{item.icon}</span>}
                    <span
                      style={{
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label || item.title}
                    </span>
                    <span
                      className="apple-tag-remove"
                      onClick={(e) => removeTag(item.id, e)}
                    >
                      <X size={11} color="#1d1d1f" />
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <ChevronDown
            size={18}
            color="#8e8e93"
            style={{
              transition: "transform 0.3s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className="apple-dropdown-popover custom-scrollbar"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 280,
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {/* Search Box inside Dropdown */}
          <div style={{ position: "relative", marginBottom: 6 }}>
            <Search
              size={14}
              color="#a0aec0"
              style={{ position: "absolute", left: 10, top: 10 }}
            />
            <input
              type="text"
              className="apple-search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: "12px 8px",
                fontSize: 13,
                color: "#8e8e93",
                textAlign: "center",
              }}
            >
              No matches found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <div
                  key={option.id}
                  className={`apple-option-item ${isSelected ? "selected" : ""}`}
                  onClick={(e) => toggleOption(option.id, e)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    {option.icon && <span>{option.icon}</span>}
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: isSelected ? 600 : 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {option.label || option.title}
                      </div>
                      {(option.instructor || option.categoryName || option.duration) && (
                        <div
                          style={{
                            fontSize: 11,
                            opacity: isSelected ? 0.9 : 0.6,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {option.categoryName || option.instructor}
                          {option.duration ? ` • ${option.duration}` : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={16} style={{ flexShrink: 0, marginLeft: 8 }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

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

  // Curriculum Filter Studio Open/Hide State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);

  // Fetch metadata on mount
  useEffect(() => {
    fetchCategoryLecturesMeta().then((data) => {
      setMetaCategories(Array.isArray(data) ? data : []);
    });
  }, []);

  // Compute unique and valid English categories
  const availableCategoryOptions = useMemo(() => {
    if (!Array.isArray(metaCategories)) return [];
    const list = [];
    metaCategories.forEach((cat) => {
      const lang = (cat.language || "eng").toLowerCase();
      if (lang === "eng") {
        const catId = String(cat.category_id ?? cat.categoryId ?? cat._id);
        const catName =
          cat.category_name ?? cat.categoryName ?? `Category ${catId}`;
        const totalLectures =
          cat.total_lectures ?? (cat.lectures ? cat.lectures.length : 0);
        list.push({
          id: catId,
          _id: String(cat._id || catId),
          label: catName,
          title: catName,
          icon: "📁",
          instructor: `${totalLectures} lectures`,
          duration: `${totalLectures} lectures`,
          totalLectures,
        });
      }
    });
    return list;
  }, [metaCategories]);

  // Compute available lectures strictly filtered by selected categories
  // Using compound unique ID `cat_${catId}_lec_${lNum}` to avoid any collisions across categories!
  const filteredAvailableLectures = useMemo(() => {
    if (!Array.isArray(metaCategories)) return [];
    const lectures = [];

    metaCategories.forEach((cat) => {
      const lang = (cat.language || "eng").toLowerCase();
      if (lang !== "eng") return;

      const catId = String(cat.category_id ?? cat.categoryId ?? cat._id);
      const isCategorySelected =
        selectedCategoryIds.length === 0 ||
        selectedCategoryIds.includes(catId);

      if (isCategorySelected) {
        const booklets = cat.booklets || cat.lectures || [];
        booklets.forEach((b) => {
          const lNum = b.lecture_id ?? b.lectureId ?? b.id;
          const uniqueId = String(b._id || b.id || `cat_${catId}_lec_${lNum}`);
          const lName =
            b.lecture_name ?? b.lectureName ?? b.name ?? `Lecture ${lNum}`;
          const count =
            b.ayat_count ??
            b.total_ayats ??
            (b.ayat_references ? b.ayat_references.length : 0);

          lectures.push({
            id: uniqueId,
            uniqueId,
            categoryId: catId,
            categoryName: cat.category_name || `Category ${catId}`,
            title: lName,
            label: `${lName} (${count} ayat)`,
            lectureNumber: lNum,
            totalAyats: count,
            duration: `${count} ayat`,
            instructor: cat.category_name || "IIPC Canada",
            year: b.year_delivered || "",
            level: `${count} ayat`,
            icon: "📖",
            rawLecture: b,
          });
        });
      }
    });

    return lectures;
  }, [metaCategories, selectedCategoryIds]);

  // When selected categories change, prune any selected lectures that don't belong to active categories
  useEffect(() => {
    if (selectedCategoryIds.length > 0) {
      const validIds = new Set(filteredAvailableLectures.map((l) => l.id));
      setSelectedLectureIds((prev) => {
        const pruned = prev.filter((id) => validIds.has(id));
        return pruned.length === prev.length ? prev : pruned;
      });
    }
  }, [selectedCategoryIds, filteredAvailableLectures]);

  // Derived list of display lectures for the preview panel and active curriculum
  // If specific lectures are selected, keep showing ONLY those selected lectures!
  // If none selected, show all lectures belonging to the chosen categories.
  const displayLectures = useMemo(() => {
    if (selectedLectureIds.length > 0) {
      return filteredAvailableLectures.filter((lec) =>
        selectedLectureIds.includes(lec.id),
      );
    }
    return filteredAvailableLectures;
  }, [selectedLectureIds, filteredAvailableLectures]);

  // Compute final aggregated pool of ayat references matching displayLectures
  const customLectureAyatPool = useMemo(() => {
    const pool = [];
    displayLectures.forEach((lec) => {
      const b = lec.rawLecture;
      if (!b) return;
      const ayatList = b.ayat_references || b.ayatList || [];
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
          lectureTitle: lec.title,
          categoryName: lec.categoryName,
        });
      });
    });
    return pool;
  }, [displayLectures]);

  const handleResetAll = () => {
    setSelectedCategoryIds([]);
    setSelectedLectureIds([]);
  };

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
              setIsStudioOpen((prev) => !prev);
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
                  setIsStudioOpen((prev) => !prev);
                }}
              >
                {isStudioOpen
                  ? "Hide Curriculum Studio"
                  : "Open Curriculum Studio"}
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

          <style>{customStyles}</style>

          {/* APPLE EMBOSSED INTERACTIVE CURRICULUM STUDIO */}
          {isStudioOpen && (
            <div className="apple-container">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 24,
                  alignItems: "start",
                }}
              >
                {/* LEFT PANEL: Tactile Control Card */}
                <div className="apple-embossed-card">
                  {/* Card Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background:
                            "linear-gradient(135deg, #007AFF 0%, #0056b3 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          boxShadow: "0 4px 12px rgba(0, 122, 255, 0.35)",
                        }}
                      >
                        <SlidersHorizontal size={20} />
                      </div>
                      <div>
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#1d1d1f",
                            margin: 0,
                          }}
                        >
                          Curriculum Studio
                        </h3>
                        <span style={{ fontSize: 12, color: "#8e8e93" }}>
                          Configure categories &amp; lectures
                        </span>
                      </div>
                    </div>

                    {(selectedCategoryIds.length > 0 ||
                      selectedLectureIds.length > 0) && (
                      <button
                        onClick={handleResetAll}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#8e8e93",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                        title="Reset all filters"
                      >
                        <RotateCcw size={14} /> Reset All
                      </button>
                    )}
                  </div>

                  {/* Dropdown Control Stack */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {/* Categories Multi-Select */}
                    <CustomMultiSelect
                      title="Filter Categories"
                      icon={Folder}
                      options={availableCategoryOptions}
                      selectedIds={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                      placeholder="Choose categories..."
                    />

                    {/* Lectures Multi-Select */}
                    <CustomMultiSelect
                      title="Select Specific Lectures"
                      icon={BookOpen}
                      options={filteredAvailableLectures}
                      selectedIds={selectedLectureIds}
                      onChange={setSelectedLectureIds}
                      placeholder={
                        filteredAvailableLectures.length === 0
                          ? "No lectures found..."
                          : "Choose lectures..."
                      }
                    />

                    {/* Summary Stats Pill */}
                    <div
                      style={{
                        background: "rgba(240, 243, 248, 0.8)",
                        border: "1px solid rgba(215, 220, 230, 0.7)",
                        borderRadius: 14,
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "#8e8e93",
                          fontWeight: 500,
                        }}
                      >
                        Selected Verses Pool:
                      </span>
                      <span
                        className="apple-pill"
                        style={{ background: "#007AFF", color: "#fff" }}
                      >
                        {customLectureAyatPool.length} Verses Ready ({displayLectures.length} Lectures)
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      className="apple-button-embossed"
                      onClick={() => {
                        setDataSource("lectures");
                        setIsLaunching(true);
                        setTimeout(() => {
                          setIsLaunching(false);
                          setLaunchSuccess(true);
                          loadNextAyah();
                          setTimeout(() => setLaunchSuccess(false), 2500);
                        }, 400);
                      }}
                      disabled={isLaunching || customLectureAyatPool.length === 0}
                    >
                      {isLaunching ? (
                        <span>Preparing Practice Session...</span>
                      ) : launchSuccess ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Curriculum Loaded!</span>
                        </>
                      ) : (
                        <>
                          <span>Start Learning Session ({customLectureAyatPool.length} Verses)</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* RIGHT PANEL: Dynamic Curriculum Preview */}
                <div
                  className="apple-embossed-card custom-scrollbar"
                  style={{
                    maxHeight: 520,
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      position: "sticky",
                      top: 0,
                      background: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(10px)",
                      paddingBottom: 8,
                      zIndex: 2,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Compass size={20} color="#007AFF" />
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#1d1d1f",
                          margin: 0,
                        }}
                      >
                        Active Curriculum
                      </h3>
                    </div>
                    <span style={{ fontSize: 12, color: "#8e8e93" }}>
                      {displayLectures.length} lecture{displayLectures.length !== 1 ? "s" : ""} shown
                    </span>
                  </div>

                  {/* List of Filtered Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {displayLectures.length === 0 ? (
                      <div
                        style={{
                          padding: "40px 20px",
                          textAlign: "center",
                          background: "rgba(245, 247, 250, 0.6)",
                          borderRadius: 16,
                          border: "1px dashed #cbd5e1",
                        }}
                      >
                        <BookOpen
                          size={36}
                          color="#a0aec0"
                          style={{ marginBottom: 10 }}
                        />
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#4a5568",
                          }}
                        >
                          No lectures matched
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#8e8e93",
                            marginTop: 4,
                          }}
                        >
                          Try selecting different categories or clearing filters.
                        </div>
                      </div>
                    ) : (
                      displayLectures.map((lec) => (
                        <div key={lec.id} className="apple-lecture-card">
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 12,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  marginBottom: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  className="apple-pill"
                                  style={{
                                    background: "rgba(0, 122, 255, 0.1)",
                                    color: "#007AFF",
                                  }}
                                >
                                  📁 {lec.categoryName}
                                </span>
                                <span
                                  className="apple-pill"
                                  style={{
                                    background: "#f0f2f5",
                                    color: "#616161",
                                    border: "1px solid #e0e0e0",
                                  }}
                                >
                                  {lec.totalAyats} ayat
                                </span>
                              </div>

                              <h4
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#1d1d1f",
                                  lineHeight: 1.4,
                                  margin: 0,
                                }}
                              >
                                {lec.title}
                              </h4>

                              <div
                                style={{
                                  display: "flex",
                                  gap: 14,
                                  marginTop: 8,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 11,
                                    color: "#8e8e93",
                                  }}
                                >
                                  <User size={12} />
                                  <span>{lec.instructor || "IIPC Canada"}</span>
                                </div>
                                {lec.year && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: 11,
                                      color: "#8e8e93",
                                    }}
                                  >
                                    <Clock size={12} />
                                    <span>{lec.year}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Play / Practice Action */}
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: "rgba(0, 122, 255, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#007AFF",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                              title="Practice this lecture specifically"
                              onClick={() => {
                                setSelectedLectureIds([lec.id]);
                                setDataSource("lectures");
                                loadNextAyah();
                              }}
                            >
                              <Play size={14} style={{ marginLeft: 2 }} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
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
