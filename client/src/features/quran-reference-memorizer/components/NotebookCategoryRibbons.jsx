import React from "react";
import { Box, Group, Text, Badge } from "@mantine/core";
import { CATEGORY_PALETTES } from "./notebookUtils";

export function NotebookCategoryRibbons({
  activeLanguage,
  languageCategories,
  activeCategoryIndex,
  onCategoryChange,
  isDark,
}) {
  return (
    <Box
      style={{
        width: 235,
        borderLeft: isDark ? "1px solid #2c2e33" : "1px solid #eef2f6",
        padding: "16px 6px 16px 16px",
        background: isDark ? "#141517" : "#fafafa",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        maxHeight: 720,
        overflowX: "visible",
      }}
    >
      <Group justify="space-between" px="xs" mb={2}>
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
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: isSelected ? 135 : 120,
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
  );
}
