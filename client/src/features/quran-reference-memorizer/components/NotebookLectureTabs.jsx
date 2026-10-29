import React from "react";
import { getLectureName, getLectureAliases } from "./notebookUtils";

export function NotebookLectureTabs({
  activeLectures = [],
  activeLectureIndex = 0,
  onLectureChange,
  isDark = false,
}) {
  return (
    <div className={`lecture-tabs-container ${isDark ? "dark-mode" : ""}`}>
      {activeLectures.length === 0 ? (
        <span style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", padding: "8px 12px" }}>
          No lectures found in this category.
        </span>
      ) : (
        activeLectures.map((lecture, idx) => {
          const isActive = idx === activeLectureIndex;
          const title = getLectureName(lecture.lecture_name) || lecture.title || "";
          const aliases = getLectureAliases(lecture.lecture_name);
          const rawAka = lecture.aka || lecture.lecture_alias;
          const akaText = rawAka
            ? (String(rawAka).toUpperCase().startsWith("AKA:") ? rawAka : `AKA: ${rawAka}`)
            : (aliases.length > 0 ? `AKA: ${aliases[0]}` : null);

          const ayatsCount =
            lecture.ayat_references?.length ||
            lecture.ayats_count ||
            lecture.total_ayats ||
            lecture.ayat_count ||
            0;

          const lecNumber =
            lecture.lecture_id && !isNaN(lecture.lecture_id)
              ? `${lecture.lecture_id}. `
              : `${idx + 1}. `;
          const fullTitle = `${lecNumber}${title}`;

          return (
            /* Parent container preserves fixed grid/inline slot so layout never shifts */
            <div key={lecture._id || lecture.id || idx} className="lecture-chip-slot">
              {/* Invisible ghost element in document flow to set the exact natural width of the slot */}
              <div className="lecture-chip-ghost" aria-hidden="true">
                <div className="chip-main-content">
                  <span className="chip-title">{fullTitle}</span>
                  {akaText && <span className="chip-aka-badge">{akaText}</span>}
                </div>
                <div className="chip-ayats-badge">
                  <span className="star-icon">★</span>
                  <span>{ayatsCount} ayats</span>
                </div>
              </div>

              {/* Interactive card with absolute positioning & pop-out hover */}
              <button
                type="button"
                onClick={() => onLectureChange(idx)}
                className={`lecture-chip-card ${isActive ? "active" : ""}`}
                title={fullTitle}
              >
                {/* Main Content Area */}
                <div className="chip-main-content">
                  <span className="chip-title">{fullTitle}</span>

                  {/* Sub-label badge (Revealed fully on hover or active) */}
                  {akaText && (
                    <span className="chip-aka-badge">{akaText}</span>
                  )}
                </div>

                {/* Ayats Count Badge */}
                <div className="chip-ayats-badge">
                  <span className="star-icon">★</span>
                  <span>{ayatsCount} ayats</span>
                </div>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
