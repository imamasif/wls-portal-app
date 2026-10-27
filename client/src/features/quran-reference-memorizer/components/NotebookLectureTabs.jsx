import React from "react";
import { Group, Text } from "@mantine/core";
import { Play, FileText, BookOpen, Layers, Heart } from "lucide-react";
import { getLectureName, getLectureAliases, getLectureIconUrl } from "./notebookUtils";
import { PdfFileIcon } from "./PdfFileIcon";
import { MediaIconBadge } from "./MediaIconBadge";

export function NotebookLectureTabs({
  activeLectures,
  activeLectureIndex,
  onLectureChange,
  activeLecture,
  currentLectureVerses,
  likedMap,
  onLikeToggle,
  openActionModal,
  isDark,
}) {
  return (
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
              (lec.ayat_references ? lec.ayat_references.length : 0);
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
                      const primaryPdf = (Array.isArray(lec.pdf_url) && lec.pdf_url.length > 0) ? lec.pdf_url[0] : lec.pdf_url;
                      const pUrl =
                        (typeof primaryPdf === "object" ? primaryPdf?.url : primaryPdf) ||
                        lec.pdf_link ||
                        (Array.isArray(lec.pdf_booklet_urls) && lec.pdf_booklet_urls.length > 0 ? lec.pdf_booklet_urls[0] : "");
                      if (pUrl) {
                        window.open(pUrl, "_blank", "noopener,noreferrer");
                      } else {
                        openActionModal("pdf", lec, e);
                      }
                    }}
                    title="View PDF Booklet & Notes"
                    className="orbital-btn"
                    style={{ backgroundColor: "#b91c1c" }}
                  >
                    <PdfFileIcon size={14} />
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
                    onClick={(e) => onLikeToggle(lec._id || lec.lecture_id, e)}
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
                  onClick={() => onLectureChange(idx)}
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
                  <MediaIconBadge
                    src={getLectureIconUrl(lec, lec.language)}
                    alt={getLectureName(lec.lecture_name)}
                    size={20}
                    type="lecture"
                  />
                  <span style={{ fontWeight: isSelected ? 800 : 600 }}>
                    {getLectureName(lec.lecture_name)}
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
            {getLectureName(activeLecture.lecture_name)}
          </Text>{" "}
          • {currentLectureVerses.length} Quran Verses
        </Text>
      )}
    </Group>
  );
}
