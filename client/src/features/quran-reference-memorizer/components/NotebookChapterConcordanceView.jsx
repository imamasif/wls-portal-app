import React, { useState } from "react";
import {
  Paper,
  Group,
  Text,
  Badge,
  Table,
  Button,
  Stack,
  Box,
  SegmentedControl,
} from "@mantine/core";
import { Play, Layers } from "lucide-react";
import {
  getAyatVideoList,
  getLectureName,
  formatVerseRef,
  getCategoryIconUrl,
} from "./notebookUtils";
import { MediaIconBadge } from "./MediaIconBadge";

export function NotebookChapterConcordanceView({
  chapterConcordance,
  onOpenAyatModal,
  onOpenCitationsModal,
  onOpenVideo,
  onOpenMultiVideo,
  isDark,
}) {
  const [mobileMode, setMobileMode] = useState("cards");

  return (
    <Stack gap="lg">
      {chapterConcordance.length === 0 ? (
        <Paper p="xl" ta="center" radius="md" withBorder>
          <Text size="sm" c="dimmed">
            No Quranic verses found matching the active search or filter.
          </Text>
        </Paper>
      ) : (
        chapterConcordance.map((ch) => (
          <Paper
            key={ch.surah_number}
            p="md"
            radius="md"
            withBorder
            style={{
              background: isDark ? "#25262b" : "#f8fafc",
              borderLeft: "4px solid #4f46e5",
            }}
          >
            <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="xs">
              <Group gap="xs">
                <Badge size="lg" color="indigo" variant="filled">
                  Surah {ch.surah_number}
                </Badge>
                <Text fw={800} size="md" c={isDark ? "white" : "dark.8"}>
                  {ch.surah_name}
                </Text>
              </Group>

              <Group gap="xs" align="center">
                <Box hiddenFrom="sm">
                  <SegmentedControl
                    size="xs"
                    value={mobileMode}
                    onChange={setMobileMode}
                    data={[
                      { value: "cards", label: "Cards" },
                      { value: "table", label: "Table" },
                    ]}
                    color="indigo"
                    radius="xl"
                  />
                </Box>
                <Badge size="sm" variant="light" color="teal">
                  {ch.verses.length} Cited Ayats
                </Badge>
              </Group>
            </Group>

            {/* MOBILE VIEW: Clean, Readable Full-Width Cards */}
            <Box hiddenFrom="sm">
              {mobileMode === "cards" ? (
                <Stack gap="xs">
                  {ch.verses.map((v, vIdx) => {
                    const vList = getAyatVideoList(v);
                    const translationText = v.english_translation || v.urdu_translation;

                    return (
                      <Paper
                        key={vIdx}
                        p="sm"
                        radius="md"
                        withBorder
                        style={{
                          background: isDark ? "#1a1b1e" : "#ffffff",
                          borderColor: isDark ? "#2c2e33" : "#e2e8f0",
                          cursor: "pointer",
                        }}
                        onClick={() => onOpenAyatModal(v)}
                      >
                        <Group justify="space-between" align="center" mb={6} wrap="wrap" gap={6}>
                          <Badge
                            size="md"
                            color="indigo"
                            variant="filled"
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 800,
                              fontSize: 13,
                              letterSpacing: "0.5px",
                              padding: "4px 8px",
                            }}
                          >
                            {formatVerseRef(ch.surah_number, v.ayat_number)}
                          </Badge>

                          <Group gap={6} align="center" onClick={(e) => e.stopPropagation()}>
                            {vList.length === 1 ? (
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="light"
                                leftSection={<Play size={11} fill="currentColor" />}
                                onClick={() =>
                                  onOpenVideo(
                                    `Surah ${ch.surah_number}:${v.ayat_number}`,
                                    vList[0]
                                  )
                                }
                              >
                                Clip
                              </Button>
                            ) : vList.length > 1 ? (
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="filled"
                                leftSection={<Play size={11} fill="currentColor" />}
                                onClick={() =>
                                  onOpenMultiVideo({
                                    title: `Surah ${ch.surah_number}:${v.ayat_number}`,
                                    videos: vList,
                                    verse: v,
                                  })
                                }
                              >
                                {vList.length} Clips
                              </Button>
                            ) : null}

                            <Button
                              size="compact-xs"
                              variant="light"
                              color="indigo"
                              leftSection={<Layers size={11} />}
                              onClick={() => onOpenCitationsModal(v, v.occurrences || [])}
                            >
                              {v.occurrences?.length || 1} Citations
                            </Button>
                          </Group>
                        </Group>

                        {/* Translation: Full-Width, Generous Font Size and Line Height */}
                        <Text
                          size="sm"
                          c={isDark ? "gray.2" : "dark.8"}
                          style={{ lineHeight: 1.65, fontSize: "0.93rem", wordBreak: "break-word" }}
                        >
                          {translationText || (
                            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                              Click to view Arabic & full citations
                            </span>
                          )}
                        </Text>

                        {/* Occurrence Badges */}
                        {v.occurrences && v.occurrences.length > 0 && (
                          <Group gap={4} mt={6} wrap="wrap">
                            {v.occurrences.map((occ, oIdx) => (
                              <Badge
                                key={oIdx}
                                size="xs"
                                color={occ.language === "urdu" ? "green" : "blue"}
                                variant="light"
                                style={{ fontSize: 9 }}
                              >
                                {occ.category_name} - {getLectureName(occ.lecture_name)}
                              </Badge>
                            ))}
                          </Group>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                /* Mobile Table Mode */
                <div style={{ overflowX: "auto", borderRadius: 8, border: isDark ? "1px solid #374151" : "1px solid #cbd5e1", WebkitOverflowScrolling: "touch" }}>
                  <Table className="excel-table" highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ minWidth: 100 }}>Surah:Ayat</Table.Th>
                        <Table.Th style={{ minWidth: 220 }}>Translation</Table.Th>
                        <Table.Th style={{ width: 80, textAlign: "center" }}>Video</Table.Th>
                        <Table.Th style={{ width: 90, textAlign: "center" }}>Citations</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {ch.verses.map((v, vIdx) => {
                        const vList = getAyatVideoList(v);
                        return (
                          <Table.Tr key={vIdx} className="excel-row" onClick={() => onOpenAyatModal(v)}>
                            <Table.Td style={{ whiteSpace: "nowrap" }}>
                              <Badge size="sm" color="indigo" variant="filled">
                                {formatVerseRef(ch.surah_number, v.ayat_number)}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" c="dark.6" lineClamp={3}>
                                {v.english_translation || v.urdu_translation}
                              </Text>
                            </Table.Td>
                            <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                              {vList.length > 0 && (
                                <Button size="compact-xs" color="red" variant="light" onClick={() => onOpenVideo(`Surah ${ch.surah_number}:${v.ayat_number}`, vList[0])}>
                                  Clip
                                </Button>
                              )}
                            </Table.Td>
                            <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                              <Button size="compact-xs" color="indigo" variant="light" onClick={() => onOpenCitationsModal(v, v.occurrences || [])}>
                                {v.occurrences?.length || 1}
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

            {/* DESKTOP VIEW: High-Density Tabular View */}
            <Box visibleFrom="sm">
              <div style={{ overflowX: "auto", borderRadius: 8, border: isDark ? "1px solid #374151" : "1px solid #cbd5e1" }}>
                <Table className="excel-table" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ minWidth: 120, width: "1%", whiteSpace: "nowrap" }}>Surah# : Ayat#</Table.Th>
                      <Table.Th style={{ minWidth: 260 }}>Translation</Table.Th>
                      <Table.Th>Cited in Lectures & Categories</Table.Th>
                      <Table.Th style={{ width: 100, textAlign: "center" }}>Video(s)</Table.Th>
                      <Table.Th style={{ width: 110, textAlign: "center", whiteSpace: "nowrap" }}>Citations</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {ch.verses.map((v, vIdx) => {
                      const vList = getAyatVideoList(v);

                      return (
                        <Table.Tr key={vIdx} className="excel-row" onClick={() => onOpenAyatModal(v)}>
                          <Table.Td style={{ whiteSpace: "nowrap", width: "1%" }}>
                            <Badge
                              size="sm"
                              color="indigo"
                              variant="filled"
                              style={{
                                fontFamily: "monospace",
                                fontWeight: 800,
                                fontSize: 12,
                                letterSpacing: "0.5px",
                                padding: "4px 8px",
                              }}
                              title={`${ch.surah_name || `Surah ${ch.surah_number}`}, Ayat ${v.ayat_number}`}
                            >
                              {formatVerseRef(ch.surah_number, v.ayat_number)}
                            </Badge>
                          </Table.Td>

                          <Table.Td>
                            <Text size="xs" c="dark.6" lineClamp={2} style={{ lineHeight: 1.5 }}>
                              {v.english_translation || v.urdu_translation}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Group gap={6} wrap="wrap">
                              {v.occurrences.map((occ, oIdx) => (
                                <Badge
                                  key={oIdx}
                                  size="xs"
                                  color={occ.language === "urdu" ? "green" : "blue"}
                                  variant="light"
                                  leftSection={
                                    <MediaIconBadge
                                      src={getCategoryIconUrl({ category_name: occ.category_name }, occ.language)}
                                      alt={occ.category_name}
                                      size={12}
                                      type="category"
                                    />
                                  }
                                  style={{ textTransform: "none", fontWeight: 600 }}
                                  title={`${occ.category_name} - ${getLectureName(occ.lecture_name) || `Lecture ${occ.lecture_number}`}`}
                                >
                                  {occ.category_name} - {getLectureName(occ.lecture_name) || `Lec ${occ.lecture_number}`}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>

                          <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                            {vList.length === 0 ? (
                              <Text size="10px" c="dimmed">
                                -
                              </Text>
                            ) : vList.length === 1 ? (
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="light"
                                leftSection={<Play size={11} fill="currentColor" />}
                                onClick={() =>
                                  onOpenVideo(
                                    `Surah ${formatVerseRef(ch.surah_number, v.ayat_number)} - ${getLectureName(v.occurrences[0]?.lecture_name)}`,
                                    vList[0]
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
                                    {vList.length}
                                  </span>
                                }
                                onClick={() =>
                                  onOpenMultiVideo({
                                    title: `Surah ${formatVerseRef(ch.surah_number, v.ayat_number)}`,
                                    videos: vList,
                                    verse: v,
                                  })
                                }
                                style={{ boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)" }}
                              >
                                Clips
                              </Button>
                            )}
                          </Table.Td>

                          <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                            <Button
                              size="compact-xs"
                              variant="light"
                              color="indigo"
                              leftSection={<Layers size={11} />}
                              onClick={() => onOpenCitationsModal(v, v.occurrences || [])}
                            >
                              {v.occurrences.length} {v.occurrences.length === 1 ? "Citation" : "Citations"}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </div>
            </Box>
          </Paper>
        ))
      )}
    </Stack>
  );
}