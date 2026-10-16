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

import { fetchRandomVerse, enrichAyahEditions } from "../api/quranApi";
import { fetchCategoryLecturesMeta } from "../api/categoryLecturesApi";
import { SURAH_LIST, LOCAL_PRESET_AYAT } from "../../../data/quranData";

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Patrick+Hand&family=Inter:wght@400;500;600;700&display=swap');

  /* Real Blackboard Wooden Outer Frame */
  .chalkboard-outer-frame {
    position: relative;
    border-radius: 18px;
    background: linear-gradient(135deg, #623e23 0%, #442714 50%, #5d391f 100%);
    padding: 14px 14px 22px 14px;
    box-shadow: 
      0 24px 50px -12px rgba(0, 0, 0, 0.55),
      0 10px 24px -6px rgba(0, 0, 0, 0.35),
      inset 0 2px 4px rgba(255, 235, 210, 0.28),
      inset 0 -4px 8px rgba(0, 0, 0, 0.7);
    border: 1px solid #321c0e;
    overflow: visible !important;
    width: 100%;
    box-sizing: border-box;
  }

  .chalkboard-outer-frame::before {
    content: '';
    position: absolute;
    top: 4px; left: 4px; right: 4px; bottom: 4px;
    border: 1px solid rgba(255, 220, 180, 0.16);
    border-radius: 14px;
    pointer-events: none;
  }

  /* Authentic Dark Slate Chalkboard Surface with Dust & Eraser Wipes */
  .chalkboard-slate {
    position: relative;
    border-radius: 10px;
    background-color: #1a2520;
    background-image: 
      radial-gradient(ellipse at 18% 28%, rgba(255, 255, 255, 0.055) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 68%, rgba(255, 255, 255, 0.045) 0%, transparent 55%),
      radial-gradient(circle at 50% 85%, rgba(255, 255, 255, 0.035) 0%, transparent 65%),
      radial-gradient(ellipse at 40% 15%, rgba(255, 255, 255, 0.04) 0%, transparent 40%),
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.007) 0px,
        rgba(255, 255, 255, 0.007) 1px,
        transparent 1px,
        transparent 5px
      );
    padding: 24px 28px 20px 28px;
    box-shadow: 
      inset 0 4px 16px rgba(0, 0, 0, 0.85),
      inset 0 0 40px rgba(0, 0, 0, 0.5),
      inset 0 0 2px rgba(255, 255, 255, 0.12);
    color: #f1f5f9;
    font-family: 'Patrick Hand', 'Caveat', 'Segoe Print', cursive, sans-serif;
    overflow: visible !important;
  }

  /* Subtle corner chalk scuffs */
  .chalkboard-slate::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    background: 
      radial-gradient(circle at 6% 12%, rgba(255, 255, 255, 0.08) 0%, transparent 22%),
      radial-gradient(circle at 94% 88%, rgba(255, 255, 255, 0.06) 0%, transparent 20%),
      radial-gradient(circle at 90% 16%, rgba(255, 255, 255, 0.05) 0%, transparent 18%);
    border-radius: 10px;
  }

  /* Wooden Chalk Tray Ledge at Bottom */
  .chalk-tray {
    position: relative;
    margin-top: 12px;
    height: 20px;
    background: linear-gradient(180deg, #74492a 0%, #4a2b15 100%);
    border-radius: 4px;
    box-shadow: 
      0 5px 10px rgba(0, 0, 0, 0.55),
      inset 0 2px 2px rgba(255, 255, 255, 0.28),
      inset 0 -2px 3px rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 20px;
    gap: 12px;
  }

  /* Chalk Sticks */
  .chalk-stick {
    width: 38px;
    height: 9px;
    border-radius: 3px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.75);
    position: relative;
  }
  .chalk-white {
    background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
  }
  .chalk-yellow {
    background: linear-gradient(180deg, #fef08a 0%, #ca8a04 100%);
  }
  .chalk-mint {
    background: linear-gradient(180deg, #bbf7d0 0%, #16a34a 100%);
  }
  .chalk-coral {
    background: linear-gradient(180deg, #fecaca 0%, #dc2626 100%);
  }
  .chalk-cyan {
    background: linear-gradient(180deg, #bae6fd 0%, #0284c7 100%);
  }

  /* Mini Felt Wooden Eraser in Tray */
  .chalk-tray-eraser {
    display: flex;
    flex-direction: column;
    width: 58px;
    height: 14px;
    border-radius: 2px;
    box-shadow: 0 3px 5px rgba(0,0,0,0.55);
  }
  .eraser-wood-top {
    height: 8px;
    background: linear-gradient(180deg, #a76b3f 0%, #7d4924 100%);
    border-radius: 2px 2px 0 0;
    border-bottom: 1px solid #3d2311;
  }
  .eraser-felt-bottom {
    height: 6px;
    background: repeating-linear-gradient(90deg, #262626 0px, #262626 3px, #383838 3px, #383838 6px);
    border-radius: 0 0 2px 2px;
  }

  /* Chalk Typography */
  .chalk-title {
    font-family: 'Caveat', 'Patrick Hand', cursive;
    font-size: 26px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
    text-shadow: 
      0 0 2px rgba(255, 255, 255, 0.85),
      0 0 8px rgba(255, 255, 255, 0.35),
      0 0 16px rgba(255, 255, 255, 0.15);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .chalk-subtitle {
    font-family: 'Patrick Hand', 'Caveat', cursive;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.7);
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.35);
  }

  .chalk-label {
    font-family: 'Patrick Hand', 'Caveat', cursive;
    font-size: 16px;
    letter-spacing: 0.8px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .chalk-label-mint {
    color: #86efac;
    text-shadow: 0 0 3px rgba(134, 239, 172, 0.65);
  }
  .chalk-label-yellow {
    color: #fef08a;
    text-shadow: 0 0 3px rgba(254, 240, 138, 0.65);
  }

  /* Chalk Interactive Control Box */
  .chalk-control-box {
    background: rgba(12, 19, 16, 0.7);
    border: 1.5px dashed rgba(255, 255, 255, 0.35);
    border-radius: 12px;
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
    min-height: 48px;
    display: flex;
    align-items: center;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.45);
  }

  .chalk-control-box:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.7);
    box-shadow: 
      0 0 12px rgba(255, 255, 255, 0.16),
      inset 0 2px 6px rgba(0, 0, 0, 0.45);
  }

  .chalk-control-box.open {
    border: 1.5px solid #fef08a;
    box-shadow: 
      0 0 16px rgba(254, 240, 138, 0.3),
      inset 0 2px 8px rgba(0, 0, 0, 0.55);
  }

  /* Chalk Multi-Select Tag Badge */
  .chalk-tag {
    border-radius: 8px;
    padding: 3px 10px;
    font-family: 'Patrick Hand', 'Caveat', cursive;
    font-size: 14px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  }

  .chalk-tag-mint {
    background: rgba(134, 239, 172, 0.16);
    border: 1px dashed #86efac;
    color: #a7f3d0;
    text-shadow: 0 0 2px rgba(167, 243, 208, 0.55);
  }

  .chalk-tag-yellow {
    background: rgba(254, 240, 138, 0.16);
    border: 1px dashed #fef08a;
    color: #fef08a;
    text-shadow: 0 0 2px rgba(254, 240, 138, 0.55);
  }

  .chalk-tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 15px;
    height: 15px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.15s ease;
  }

  .chalk-tag-remove:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.25);
  }

  /* Chalk Popover Dropdown Window */
  .chalk-dropdown-popover {
    background: #19231e;
    border: 2px solid #5d3d24;
    border-radius: 14px;
    box-shadow: 
      0 24px 50px rgba(0, 0, 0, 0.75),
      0 8px 20px rgba(0, 0, 0, 0.45),
      inset 0 2px 10px rgba(0, 0, 0, 0.6);
    padding: 12px;
    z-index: 9999 !important;
    color: #f1f5f9;
  }

  /* Search Input inside Chalk Dropdown */
  .chalk-search-input {
    width: 100%;
    padding: 9px 12px 9px 34px;
    border-radius: 8px;
    border: 1.5px dashed rgba(255, 255, 255, 0.35);
    background: rgba(10, 15, 12, 0.65);
    color: #ffffff;
    font-family: 'Patrick Hand', 'Caveat', cursive;
    font-size: 15px;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
  }

  .chalk-search-input:focus {
    border-color: #fef08a;
    box-shadow: 0 0 10px rgba(254, 240, 138, 0.25);
    background: rgba(10, 15, 12, 0.9);
  }

  /* Selectable Dropdown Item */
  .chalk-option-item {
    border-radius: 8px;
    padding: 8px 12px;
    transition: all 0.15s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: 'Patrick Hand', 'Caveat', cursive;
    font-size: 15px;
    color: #e2e8f0;
    margin-bottom: 3px;
    border: 1px solid transparent;
  }

  .chalk-option-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  .chalk-option-item.selected {
    background: rgba(134, 239, 172, 0.2);
    border: 1px dashed #86efac;
    color: #a7f3d0;
    text-shadow: 0 0 2px rgba(134, 239, 172, 0.55);
  }

  /* Chalk Eraser Action Button - Styled like a Vintage Wooden Classroom Eraser */
  .chalk-eraser-button {
    background: linear-gradient(180deg, #965a30 0%, #6e3e1c 50%, #522d13 100%);
    border-radius: 12px;
    border: 2px solid #3c1e0b;
    color: #fef3c7;
    font-family: 'Caveat', 'Patrick Hand', cursive;
    font-weight: 700;
    font-size: 21px;
    letter-spacing: 0.5px;
    padding: 12px 24px;
    box-shadow: 
      0 10px 22px rgba(0, 0, 0, 0.45),
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 0 2px 2px rgba(255, 255, 255, 0.45),
      inset 0 -4px 6px rgba(0, 0, 0, 0.55);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    position: relative;
    overflow: hidden;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8), 0 0 6px rgba(254, 243, 199, 0.45);
  }

  /* Bottom Felt Strip of the Eraser */
  .chalk-eraser-button::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: repeating-linear-gradient(90deg, #1f1f1f 0px, #1f1f1f 4px, #333 4px, #333 8px);
    border-top: 1px solid #141414;
  }

  .chalk-eraser-button:hover {
    background: linear-gradient(180deg, #a86638 0%, #7d4721 50%, #5e3417 100%);
    box-shadow: 
      0 14px 28px rgba(0, 0, 0, 0.55),
      0 4px 8px rgba(0, 0, 0, 0.3),
      inset 0 2px 3px rgba(255, 255, 255, 0.55);
    transform: translateY(-2px);
    color: #ffffff;
  }

  .chalk-eraser-button:active {
    transform: translateY(2px) scale(0.99);
    box-shadow: 
      0 4px 10px rgba(0, 0, 0, 0.4),
      inset 0 2px 6px rgba(0, 0, 0, 0.65);
  }

  /* Summary Box on Blackboard */
  .chalk-stat-pill {
    background: rgba(10, 16, 13, 0.7);
    border: 1.5px dashed rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Patrick Hand', 'Caveat', cursive;
    font-size: 16px;
  }

  /* Scrollbar styling for dark chalkboard */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.35);
  }
`;

const CustomMultiSelect = ({
  title,
  icon: Icon,
  options,
  selectedIds,
  onChange,
  placeholder,
  accentColor = "mint",
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

  const isYellow = accentColor === "yellow";
  const chalkColor = isYellow ? "#fef08a" : "#86efac";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        zIndex: isOpen ? 100 : 1,
      }}
      ref={containerRef}
    >
      {/* Header Label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span className={`chalk-label ${isYellow ? "chalk-label-yellow" : "chalk-label-mint"}`}>
          {title}
        </span>
        {selectedIds.length > 0 && (
          <span
            style={{
              fontSize: 13,
              fontFamily: "'Patrick Hand', 'Caveat', cursive",
              fontWeight: 600,
              color: chalkColor,
              textShadow: `0 0 2px ${chalkColor}`,
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
        className={`chalk-control-box ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        style={isOpen ? { borderColor: chalkColor } : {}}
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
            {Icon && <Icon size={18} color={chalkColor} style={{ flexShrink: 0 }} />}

            {selectedObjects.length === 0 ? (
              <span
                style={{
                  fontSize: 14,
                  fontFamily: "'Patrick Hand', 'Caveat', cursive",
                  color: "rgba(255, 255, 255, 0.45)",
                }}
              >
                {placeholder}
              </span>
            ) : (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selectedObjects.map((item) => (
                  <span
                    key={item.id}
                    className={`chalk-tag ${isYellow ? "chalk-tag-yellow" : "chalk-tag-mint"}`}
                  >
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
                      className="chalk-tag-remove"
                      onClick={(e) => removeTag(item.id, e)}
                    >
                      <X size={12} color="currentColor" />
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <ChevronDown
            size={18}
            color="rgba(255, 255, 255, 0.65)"
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
          className="chalk-dropdown-popover custom-scrollbar"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 380,
            overflowY: "auto",
            zIndex: 9999,
          }}
        >
          {/* Search Box inside Dropdown */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <Search
              size={15}
              color="rgba(255, 255, 255, 0.5)"
              style={{ position: "absolute", left: 10, top: 11 }}
            />
            <input
              type="text"
              className="chalk-search-input"
              placeholder="Search in chalk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: "14px 8px",
                fontSize: 14,
                fontFamily: "'Patrick Hand', 'Caveat', cursive",
                color: "rgba(255, 255, 255, 0.45)",
                textAlign: "center",
              }}
            >
              No chalk matches found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <div
                  key={option.id}
                  className={`chalk-option-item ${isSelected ? "selected" : ""}`}
                  onClick={(e) => toggleOption(option.id, e)}
                  style={
                    isSelected && isYellow
                      ? {
                          background: "rgba(254, 240, 138, 0.2)",
                          borderColor: "#fef08a",
                          color: "#fef08a",
                          textShadow: "0 0 2px rgba(254,240,138,0.55)",
                        }
                      : {}
                  }
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
                            fontSize: 12,
                            opacity: isSelected ? 0.9 : 0.65,
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
                    <Check size={16} color="currentColor" style={{ flexShrink: 0, marginLeft: 8 }} />
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

  // Fetch missing translations & audio via backend proxy (eliminates CORS and handles failovers)
  const enrichTranslationsIfNeeded = async (ayahData) => {
    return await enrichAyahEditions(ayahData);
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

      <Container size="xl" py="md" maw={1400} w="100%">
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
                  ? "Hide Chalkboard Studio"
                  : "Open Chalkboard Studio"}
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

          {/* AUTHENTIC CLASSROOM CHALKBOARD CURRICULUM STUDIO */}
          {isStudioOpen && (
            <div style={{ width: "100%", maxWidth: "100%", marginBottom: "1.25rem" }}>
              {/* Real Blackboard Wooden Outer Frame */}
              <div className="chalkboard-outer-frame">
                {/* Dark Slate Surface with chalk dust smudges & eraser wipe patterns */}
                <div className="chalkboard-slate">
                  {/* Chalkboard Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                      borderBottom: "1.5px dashed rgba(255, 255, 255, 0.2)",
                      paddingBottom: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1.5px dashed rgba(255, 255, 255, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fef08a",
                          boxShadow: "0 0 10px rgba(254, 240, 138, 0.2)",
                        }}
                      >
                        <SlidersHorizontal size={22} />
                      </div>
                      <div>
                        <h3 className="chalk-title">
                          Curriculum Blackboard Studio
                        </h3>
                        <span className="chalk-subtitle">
                          Select categories &amp; specific lecture booklets to drill
                        </span>
                      </div>
                    </div>

                    {(selectedCategoryIds.length > 0 ||
                      selectedLectureIds.length > 0) && (
                      <button
                        onClick={handleResetAll}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px dashed rgba(255, 255, 255, 0.35)",
                          borderRadius: 8,
                          padding: "6px 12px",
                          color: "#fca5a5",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "'Patrick Hand', 'Caveat', cursive",
                          fontSize: 14,
                          fontWeight: 600,
                          transition: "all 0.2s ease",
                        }}
                        title="Erase all selections"
                      >
                        <RotateCcw size={14} /> Clear Blackboard
                      </button>
                    )}
                  </div>

                  {/* 2-Column Responsive Layout for Pickers */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                      gap: 22,
                      marginBottom: 22,
                    }}
                  >
                    {/* Categories Multi-Select (Mint Chalk) */}
                    <CustomMultiSelect
                      title="Filter Categories"
                      icon={Folder}
                      options={availableCategoryOptions}
                      selectedIds={selectedCategoryIds}
                      onChange={setSelectedCategoryIds}
                      placeholder="Choose categories in chalk..."
                      accentColor="mint"
                    />

                    {/* Lectures Multi-Select (Yellow Chalk) */}
                    <CustomMultiSelect
                      title="Select Specific Lectures"
                      icon={BookOpen}
                      options={filteredAvailableLectures}
                      selectedIds={selectedLectureIds}
                      onChange={setSelectedLectureIds}
                      placeholder={
                        filteredAvailableLectures.length === 0
                          ? "No lectures found..."
                          : "Choose lectures in chalk..."
                      }
                      accentColor="yellow"
                    />
                  </div>

                  {/* Bottom Action Row: Chalk Summary Box & Wooden Felt Eraser Button */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      paddingTop: 16,
                      borderTop: "1.5px dashed rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    <div className="chalk-stat-pill">
                      <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        Blackboard Pool:
                      </span>
                      <span
                        style={{
                          color: "#86efac",
                          fontWeight: 700,
                          textShadow: "0 0 3px rgba(134, 239, 172, 0.6)",
                        }}
                      >
                        {customLectureAyatPool.length} Verses Ready
                      </span>
                      <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>•</span>
                      <span
                        style={{
                          color: "#fef08a",
                          fontWeight: 700,
                          textShadow: "0 0 3px rgba(254, 240, 138, 0.6)",
                        }}
                      >
                        {displayLectures.length} Lectures
                      </span>
                    </div>

                    <div style={{ flex: "1 1 320px", maxWidth: "480px" }}>
                      <button
                        className="chalk-eraser-button"
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
                          <span>Wiping Board &amp; Preparing Session...</span>
                        ) : launchSuccess ? (
                          <>
                            <CheckCircle2 size={20} color="#86efac" />
                            <span style={{ color: "#86efac" }}>Blackboard Session Ready!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} color="#fef08a" />
                            <span>Wipe Board &amp; Practice ({customLectureAyatPool.length} Verses)</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wooden Chalk Tray with Colored Chalk Sticks & Vintage Eraser */}
                <div className="chalk-tray">
                  <div className="chalk-stick chalk-white" title="White Chalk" />
                  <div className="chalk-stick chalk-yellow" title="Yellow Chalk" />
                  <div className="chalk-stick chalk-mint" title="Mint Chalk" />
                  <div className="chalk-stick chalk-coral" title="Coral Chalk" />
                  <div className="chalk-stick chalk-cyan" title="Sky Blue Chalk" />
                  <div className="chalk-tray-eraser" title="Classroom Felt Eraser">
                    <div className="eraser-wood-top" />
                    <div className="eraser-felt-bottom" />
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
