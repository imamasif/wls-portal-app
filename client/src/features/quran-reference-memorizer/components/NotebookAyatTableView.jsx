import React, { useState } from "react";
import {
  Paper,
  Group,
  Text,
  Badge,
  Table,
  Button,
  Stack,
  SegmentedControl,
  Box,
} from "@mantine/core";
import {
  BookOpen,
  Play,
  Layers,
} from "lucide-react";
import {
  IconSortAscending,
  IconSortDescending,
  IconArrowsSort,
  IconLayoutList,
  IconTable,
} from "@tabler/icons-react";
import {
  getAyatVideoList,
  getLectureName,
  formatVerseRef,
  parseVerseSearch,
} from "./notebookUtils";

export function NotebookAyatTableView({
  currentLectureVerses,
  activeCategory,
  activeLecture,
  searchQuery,
  sortField,
  setSortField,
  verseCitationsMap,
  onOpenAyatModal,
  onOpenCitationsModal,
  onOpenVideo,
  onOpenMultiVideo,
  isDark,
}) {
  // Allow mobile users to optionally toggle to Table, defaulting to Cards on mobile
  const [mobileDisplayMode, setMobileDisplayMode] = useState("cards");

  return (
    <div>
      {/* Section Header: Key Quranic References */}
      <Paper
        p="xs"
        px="md"
        radius="md"
        mb="sm"
        style={{
          background: isDark ? "#2d3748" : "#f1f5f9",
          borderLeft: "4px solid #facc15",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs">
            <BookOpen size={16} color="#4f46e5" />
            <Text size="xs" fw={800} tt="uppercase" c={isDark ? "white" : "dark.8"} style={{ letterSpacing: 0.5 }}>
              Key Quranic References in this Lecture
            </Text>
          </Group>

          <Group gap="xs" align="center">
            {/* View Mode Toggle for Small Screens */}
            <Box hiddenFrom="sm">
              <SegmentedControl
                size="xs"
                value={mobileDisplayMode}
                onChange={setMobileDisplayMode}
                data={[
                  { value: "cards", label: "Cards" },
                  { value: "table", label: "Table" },
                ]}
                color="indigo"
                radius="xl"
              />
            </Box>

            <Badge color="teal" size="sm" variant="light">
              {currentLectureVerses.length} Ayats
            </Badge>
          </Group>
        </Group>
      </Paper>

      {currentLectureVerses.length === 0 ? (
        <Paper p="xl" ta="center" radius="md" withBorder>
          <Text size="sm" c="dimmed">
            No Quran verses cited in this lecture matching the active filters or search query.
          </Text>
          {parseVerseSearch(searchQuery) && (
            <Text size="xs" c="indigo" mt="xs" fw={600}>
              Tip: Try switching to the "ðŸ“œ 114-Surah Sequence" tab above to locate this verse across all lectures!
            </Text>
          )}
        </Paper>
      ) : (
        <>
          {/* ============================================================== */}
          {/* MOBILE VIEW: High-Legibility, Full-Width Spacious Verse Cards  */}
          {/* ============================================================== */}
          <Box hiddenFrom="sm">
            {mobileDisplayMode === "cards" ? (
              <Stack gap="xs">
                {currentLectureVerses.map((verse, idx) => {
                  const videoList = getAyatVideoList(verse);
                  const cKey = `${verse.surah_number}:${verse.ayat_number}`;
                  const citations = verseCitationsMap.get(cKey) || [];
                  const count = citations.length || 1;
                  const hasUrdu = citations.some((c) => c.language === "urdu");
                  const hasEng = citations.some((c) => c.language === "eng");
                  const translationText =
                    verse.english_translation ||
                    verse.urdu_translation ||
                    "";

                  return (
                    <Paper
                      key={verse._id || idx}
                      p="sm"
                      radius="md"
                      withBorder
                      style={{
                        background: isDark ? "#1a1b1e" : "#ffffff",
                        borderColor: isDark ? "#2c2e33" : "#e2e8f0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      }}
                      onClick={() => {
                        onOpenAyatModal({
                          ...verse,
                          citations,
                          category_name: activeCategory?.category_name,
                          lecture_name: getLectureName(activeLecture?.lecture_name),
                        });
                      }}
                    >
                      {/* Top Row: Index, Verse Badge, Surah Name, and Action Buttons */}
                      <Group justify="space-between" align="center" mb={8} wrap="wrap" gap={6}>
                        <Group gap={6} align="center" wrap="nowrap">
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
                            #{idx + 1}
                          </span>
                          <Badge
                            color="indigo"
                            size="md"
                            variant="filled"
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: 13,
                              letterSpacing: "0.5px",
                              padding: "4px 8px",
                            }}
                          >
                            {formatVerseRef(verse.surah_number, verse.ayat_number)}
                          </Badge>
                          {verse.surah_name && (
                            <Text size="xs" fw={700} c={isDark ? "gray.3" : "dark.8"}>
                              {verse.surah_name}
                            </Text>
                          )}
                        </Group>

                        {/* Interactive Action Buttons */}
                        <Group gap={6} align="center" onClick={(e) => e.stopPropagation()}>
                          {videoList.length === 1 ? (
                            <Button
                              size="compact-xs"
                              color="red"
                              variant="light"
                              leftSection={<Play size={11} fill="currentColor" />}
                              onClick={() =>
                                onOpenVideo(
                                  `${getLectureName(activeLecture.lecture_name)} - Surah ${verse.surah_number}:${verse.ayat_number}`,
                                  videoList[0]
                                )
                              }
                            >
                              Clip
                            </Button>
                          ) : videoList.length > 1 ? (
                            <Button
                              size="compact-xs"
                              color="red"
                              variant="filled"
                              leftSection={<Play size={11} fill="currentColor" />}
                              rightSection={
                                <span
                                  style={{
                                    background: "white",
                                    color: "#dc2626",
                                    borderRadius: 10,
                                    padding: "1px 5px",
                                    fontSize: 9,
                                    fontWeight: 800,
                                  }}
                                >
                                  {videoList.length}
                                </span>
                              }
                              onClick={() =>
                                onOpenMultiVideo({
                                  title: `${getLectureName(activeLecture.lecture_name)} - Surah ${formatVerseRef(verse.surah_number, verse.ayat_number)}`,
                                  videos: videoList,
                                  verse,
                               Context: "AyatCard",
                                })
                              }
                            >
                              Clips
                            </Button>
                          ) : null}

                          <Button
                            size="compact-xs"
                            variant={count > 1 ? "filled" : "light"}
                            color={count > 1 ? "indigo" : "blue"}
                            leftSection={<Layers size={11} />}
                            onClick={() => onOpenCitationsModal(verse, citations)}
                            style={{
                              fontWeight: 700,
                              fontSize: 10,
                              borderRadius: 10,
                            }}
                          >
                            {count} {count === 1 ? "Lec" : "Lecs"}
                            {hasEng && hasUrdu ? " (E&U)" : hasUrdu ? " (U)" : ""}
                          </Button>
                        </Group>
                      </Group>

                      {/* Full Translation: 100% Full Width, Crystal Clear Typography */}
                      <Text
                        size="sm"
                        c={isDark ? "gray.2" : "dark.8"}
                        style={{
                          lineHeight: 1.65,
                          fontSize: "0.93rem",
                          wordBreak: "break-word",
                        }}
                      >
                        {translationText || (
                          <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                            Click to view full Arabic text & details
                          </span>
                        )}
                      </Text>

                      {/* Gentle bottom hint */}
                      <Group justify="flex-end" mt={6}>
                        <Text size="10px" c="dimmed" style={{ letterSpacing: 0.3 }}>
                          Tap card for live Arabic text âž”
                        </Text>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              /* Mobile Table Mode (if user toggled to table on mobile) */
              <div style={{ overflowX: "auto", borderRadius: 8, border: isDark ? "1px solid #374151" : "1px solid #cbd5e1", WebkitOverflowScrolling: "touch" }}>
                <Table className="excel-table" highlightOnHover striped={false}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 45, textAlign: "center" }}>#</Table.Th>
                      <Table.Th style={{ minWidth: 120 }}>Surah# : Ayat#</Table.Th>
                      <Table.Th style={{ minWidth: 260 }}>Translation</Table.Th>
                      <Table.Th style={{ width: 90, textAlign: "center" }}>Video(s)</Table.Th>
                      <Table.Th style={{ width: 110, textAlign: "center" }}>Citations</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {currentLectureVerses.map((verse, idx) => {
                      const videoList = getAyatVideoList(verse);
                      const cKey = `${verse.surah_number}:${verse.ayat_number}`;
                      const citations = verseCitationsMap.get(cKey) || [];
                      const count = citations.length || 1;

                      return (
                        <Table.Tr
                          key={verse._id || idx}
                          className="excel-row"
                          onClick={() => {
                            onOpenAyatModal({
                              ...verse,
                              citations,
                              category_name: activeCategory?.category_name,
                              lecture_name: getLectureName(activeLecture?.lecture_name),
                            });
                          }}
                        >
                          <Table.Td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                            {idx + 1}
                          </Table.Td>
                          <Table.Td style={{ whiteSpace: "nowrap" }}>
                            <Badge color="indigo" size="sm" variant="filled" style={{ fontFamily: "monospace", fontWeight: 800 }}>
                              {formatVerseRef(verse.surah_number, verse.ayat_number)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dark.7" lineClamp={3}>
                              {verse.english_translation || verse.urdu_translation}
                            </Text>
                          </Table.Td>
                          <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                            {videoList.length > 0 && (
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="light"
                                leftSection={<Play size={10} fill="currentColor" />}
                                onClick={() => onOpenVideo(`${getLectureName(activeLecture.lecture_name)} - ${formatVerseRef(verse.surah_number, verse.ayat_number)}`, videoList[0])}
                              >
                                Play
                              </Button>
                            )}
                          </Table.Td>
                          <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                            <Button size="compact-xs" color="indigo" variant="light" onClick={() => onOpenCitationsModal(verse, citations)}>
                              {count} Lecs
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Box>

          {/* ============================================================== */}
          {/* DESKTOP VIEW: High-Density Excel-Like Tabular Spreadsheet Grid */}
          {/* ============================================================== */}
          <Box visibleFrom="sm">
            <div style={{ overflowX: "auto", borderRadius: 8, border: isDark ? "1px solid #374151" : "1px solid #cbd5e1" }}>
              <Table className="excel-table" highlightOnHover striped={false}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 45, textAlign: "center" }}>#</Table.Th>
                    <Table.Th
                      style={{ minWidth: 130, width: "1%", whiteSpace: "nowrap", cursor: "pointer" }}
                      onClick={() => {
                        if (sortField === "SURAH_ASC") setSortField("SURAH_DESC");
                        else if (sortField === "SURAH_DESC") setSortField("AYAT_ASC");
                        else if (sortField === "AYAT_ASC") setSortField("AYAT_DESC");
                        else setSortField("SURAH_ASC");
                      }}
                      title="Click to toggle sort: Surah / Ayat"
                    >
                      <Group gap={4} wrap="nowrap">
                        <span>Surah# : Ayat#</span>
                        {sortField === "SURAH_ASC" && <IconSortAscending size={14} color="#2563eb" />}
                        {sortField === "SURAH_DESC" && <IconSortDescending size={14} color="#2563eb" />}
                        {sortField === "AYAT_ASC" && <IconSortAscending size={14} color="#059669" />}
                        {sortField === "AYAT_DESC" && <IconSortDescending size={14} color="#059669" />}
                        {sortField === "SURAH_THEN_AYAT" && <IconArrowsSort size={14} color="#2563eb" />}
                        {!sortField && <IconArrowsSort size={12} color="#94a3b8" />}
                      </Group>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 280 }}>Translation Preview</Table.Th>
                    <Table.Th style={{ width: 110, whiteSpace: "nowrap", textAlign: "center" }}>Video Clip(s)</Table.Th>
                    <Table.Th style={{ width: 160, textAlign: "center", whiteSpace: "nowrap" }}>Lectures Cited & Clips</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {currentLectureVerses.map((verse, idx) => {
                    const videoList = getAyatVideoList(verse);

                    return (
                      <Table.Tr
                        key={verse._id || idx}
                        className="excel-row"
                        onClick={() => {
                          const cKey = `${verse.surah_number}:${verse.ayat_number}`;
                          const citations = verseCitationsMap.get(cKey) || [];
                          onOpenAyatModal({
                            ...verse,
                            citations,
                            category_name: activeCategory?.category_name,
                            lecture_name: getLectureName(activeLecture?.lecture_name),
                          });
                        }}
                      >
                        <Table.Td style={{ textAlign: "center", color: "#64748b", fontWeight: 600 }}>
                          {idx + 1}
                        </Table.Td>

                        <Table.Td style={{ whiteSpace: "nowrap", width: "1%" }}>
                          <Badge
                            color="indigo"
                            size="sm"
                            variant="filled"
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: 12,
                              letterSpacing: "0.5px",
                              padding: "4px 8px",
                            }}
                            title={`${verse.surah_name || `Surah ${verse.surah_number}`}, Ayat ${verse.ayat_number}`}
                          >
                            {formatVerseRef(verse.surah_number, verse.ayat_number)}
                          </Badge>
                        </Table.Td>

                        <Table.Td>
                          <Text size="xs" c="dark.7" lineClamp={2} style={{ lineHeight: 1.5 }}>
                            {verse.english_translation || verse.urdu_translation || "Click row to view full Arabic & translation"}
                          </Text>
                        </Table.Td>

                        {/* Video Clip(s) Column: 1 Video or Multi-Videos Dialogue */}
                        <Table.Td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: "nowrap", width: "1%", textAlign: "center" }}>
                          {videoList.length === 0 ? (
                            <Text size="10px" c="dimmed">
                              -
                            </Text>
                          ) : videoList.length === 1 ? (
                            <Button
                              size="compact-xs"
                              color="red"
                              variant="light"
                              leftSection={<Play size={11} fill="currentColor" />}
                              onClick={() =>
                                onOpenVideo(
                                  `${getLectureName(activeLecture.lecture_name)} - Surah ${verse.surah_number}:${verse.ayat_number}`,
                                  videoList[0]
                                )
                              }
                            >
                              Clip
                            </Button>
                          ) : (
                            <Button
                              size="compact-xs"
                              color="red"
                              variant="filled"
                              leftSection={<Play size={11} fill="currentColor" />}
                              rightSection={
                                <span
                                  style={{
                                    background: "white",
                                    color: "#dc2626",
                                    borderRadius: 10,
                                    padding: "1px 5px",
                                    fontSize: 9,
                                    fontWeight: 800,
                                  }}
                                >
                                  {videoList.length}
                                </span>
                              }
                              onClick={() =>
                                onOpenMultiVideo({
                                  title: `${getLectureName(activeLecture.lecture_name)} - Surah ${formatVerseRef(verse.surah_number, verse.ayat_number)}`,
                                  videos: videoList,
                                  verse,
                                })
                              }
                              title={`Click to pick from ${videoList.length} video links`}
                              style={{ boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)" }}
                            >
                              Clips
                            </Button>
                          )}
                        </Table.Td>

                        {/* Citations Column */}
                        <Table.Td
                          onClick={(e) => e.stopPropagation()}
                          style={{ textAlign: "center", whiteSpace: "nowrap", width: "1%" }}
                        >
                          {(() => {
                            const cKey = `${verse.surah_number}:${verse.ayat_number}`;
                            const citations = verseCitationsMap.get(cKey) || [];
                            const count = citations.length || 1;
                            const hasUrdu = citations.some((c) => c.language === "urdu");
                            const hasEng = citations.some((c) => c.language === "eng");

                            return (
                              <Button
                                size="compact-xs"
                                variant={count > 1 ? "filled" : "light"}
                                color={count > 1 ? "indigo" : "blue"}
                                leftSection={<Layers size={11} />}
                                onClick={() => onOpenCitationsModal(verse, citations)}
                                title={`Cited in ${count} lecture(s) across English & Urdu`}
                                style={{
                                  fontWeight: 700,
                                  fontSize: 11,
                                  borderRadius: 12,
                                  boxShadow: count > 1 ? "0 2px 6px rgba(79, 70, 229, 0.25)" : "none",
                                }}
                              >
                                {count} {count === 1 ? "Lecture" : "Lectures"}
                                {hasEng && hasUrdu ? " (Eng & Urdu)" : hasUrdu ? " (Urdu)" : ""}
                              </Button>
                            );
                          })()}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          </Box>
        </>
      )}
    </div>
  );
}