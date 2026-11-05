import React from "react";
import { Box, Group, Text, Badge } from "@mantine/core";
import { CATEGORY_PALETTES, getCategoryIconUrl } from "./notebookUtils";
import { MediaIconBadge } from "./MediaIconBadge";

export function NotebookCategoryRibbons({
  activeLanguage,
  languageCategories,
  activeCategoryIndex,
  onCategoryChange,
  isDark,
}) {
  return (
    <>
      <style>{`
        .notebook-category-ribbons {
          width: 235px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          max-height: 720px;
          overflow-x: visible;
          padding: 16px 6px 16px 16px;
          flex-shrink: 0;
        }
        @media (max-width: 991px) {
          .notebook-category-ribbons {
            width: 100% !important;
            max-height: none !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            border-left: none !important;
            border-bottom: 1px solid ${isDark ? "#2c2e33" : "#eef2f6"};
            padding: 8px 12px !important;
            gap: 8px !important;
            -webkit-overflow-scrolling: touch;
          }
          .notebook-category-header-group {
            display: none !important;
          }
          .notebook-category-item {
            transform: none !important;
            clip-path: none !important;
            border-radius: 20px !important;
            padding: 6px 14px !important;
            flex-shrink: 0 !important;
          }
          .notebook-category-item .notebook-category-name {
            max-width: none !important;
          }
        }
      `}</style>
      <Box
        className="notebook-category-ribbons"
        style={{
          borderLeft: isDark ? "1px solid #2c2e33" : "1px solid #eef2f6",
          background: isDark ? "#141517" : "#fafafa",
        }}
      >
        <Group justify="space-between" px="xs" mb={2} className="notebook-category-header-group">
          <Text size="10px" fw={800} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
            {activeLanguage.toUpperCase()} CATEGORIES
          </Text>
          <Badge size="xs" variant="light" color="indigo" style={{ fontSize: 9 }}>
            {languageCategories.length}
          </Badge>
        </Group>

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
                onClick={() => onCategoryChange(idx)}
                className="notebook-category-item"
                style={{
                  position: "relative",
                  background: isSelected
                    ? `linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.12) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.5) 100%), ${catColor}`
                    : `${catColor}b5`,
                  color: "white",
                  padding: isSelected ? "10px 14px 10px 14px" : "7px 10px 7px 10px",
                  fontSize: isSelected ? 12 : 10.5,
                  fontWeight: isSelected ? 900 : 600,
                  cursor: "pointer",
                  clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 6px 50%)",
                  boxShadow: isSelected
                    ? "inset 0 2.5px 2px rgba(255,255,255,0.9), inset 0 -3px 3px rgba(0,0,0,0.55), inset 3px 0 2px rgba(255,255,255,0.4)"
                    : "inset 0 1px 0 rgba(255,255,255,0.25)",
                  filter: isSelected
                    ? "drop-shadow(-8px 6px 14px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(255,255,255,0.4))"
                    : "drop-shadow(1px 2px 3px rgba(0,0,0,0.12))",
                  transform: isSelected ? "translateX(-14px) scale(1.08)" : "translateX(0) scale(0.97)",
                  opacity: isSelected ? 1 : 0.82,
                  zIndex: isSelected ? 30 : 1,
                  transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
                title={cat.category_name}
              >
                <Group gap={6} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                  {isSelected && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#facc15",
                        boxShadow: "0 0 8px #facc15",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <MediaIconBadge
                    src={getCategoryIconUrl(cat, activeLanguage)}
                    alt={cat.category_name}
                    size={isSelected ? 22 : 18}
                    type="category"
                  />
                  <span
                    className="notebook-category-name"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: isSelected ? 120 : 110,
                      textShadow: isSelected ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
                    }}
                  >
                    {cat.category_name}
                  </span>
                </Group>

                <Badge
                  size="xs"
                  variant={isSelected ? "filled" : "white"}
                  color={isSelected ? "yellow" : "dark"}
                  style={{
                    marginLeft: 6,
                    marginRight: 6,
                    fontSize: isSelected ? 10 : 9,
                    fontWeight: 900,
                    color: isSelected ? "#000000" : undefined,
                    boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  {lecCount}
                </Badge>
              </Box>
            );
          })
        )}
      </Box>
    </>
  );
}
