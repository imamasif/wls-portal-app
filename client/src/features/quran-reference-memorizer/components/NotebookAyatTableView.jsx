import React from "react";
import {
  Paper,
  Group,
  Text,
  Badge,
  Table,
  Button,
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
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <BookOpen size={16} color="#4f46e5" />
            <Text size="xs" fw={800} tt="uppercase" c={isDark ? "white" : "dark.8"} style={{ letterSpacing: 0.5 }}>
              Key Quranic References in this Lecture
            </Text>
          </Group>

          <Badge color="teal" size="sm" variant="light">
            {currentLectureVerses.length} Ayats
          </Badge>
        </Group>
      </Paper>

      {/* Mode 1: Excel-like Tabular Index */}
      {currentLectureVerses.length === 0 ? (
        <Paper p="xl" ta="center" radius="md" withBorder>
          <Text size="sm" c="dimmed">
            No Quran verses cited in this lecture matching the active filters or search query.
          </Text>
          {parseVerseSearch(searchQuery) && (
            <Text size="xs" c="indigo" mt="xs" fw={600}>
              Tip: Try switching to the "📜 114-Surah Sequence" tab above to locate this verse across all lectures!
            </Text>
          )}
        </Paper>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #cbd5e1" }}>
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
                        /* MULTI-VIDEO LINK ICON & DIALOGUE TRIGGER */
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

                    {/* Replaces "View" with "Lectures Cited & Clips" */}
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
                            title={`Cited in ${count} lecture(s) across English & Urdu (Click to view lectures and clips)`}
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
      )}
    </div>
  );
}
