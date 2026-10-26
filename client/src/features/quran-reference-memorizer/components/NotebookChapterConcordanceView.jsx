import React from "react";
import {
  Paper,
  Group,
  Text,
  Badge,
  Table,
  Button,
  Stack,
} from "@mantine/core";
import { Play, Layers } from "lucide-react";
import {
  getAyatVideoList,
  getLectureName,
  formatVerseRef,
} from "./notebookUtils";

export function NotebookChapterConcordanceView({
  chapterConcordance,
  onOpenAyatModal,
  onOpenCitationsModal,
  onOpenVideo,
  onOpenMultiVideo,
  isDark,
}) {
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
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <Badge size="lg" color="indigo" variant="filled">
                  Surah {ch.surah_number}
                </Badge>
                <Text fw={800} size="md" c={isDark ? "white" : "dark.8"}>
                  {ch.surah_name}
                </Text>
              </Group>
              <Badge size="sm" variant="light" color="teal">
                {ch.verses.length} Cited Ayats
              </Badge>
            </Group>

            <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #cbd5e1" }}>
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
                                style={{ textTransform: "none", fontWeight: 600 }}
                                title={`${occ.category_name} - ${getLectureName(occ.lecture_name) || `Lecture ${occ.lecture_number}`}`}
                              >
                                {occ.category_name} - {getLectureName(occ.lecture_name) || `Lecture ${occ.lecture_number}`}
                              </Badge>
                            ))}
                          </Group>
                        </Table.Td>

                        {/* Concordance Video Column */}
                        <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                          {vList.length === 0 ? (
                            <Text size="10px" c="dimmed">-</Text>
                          ) : vList.length === 1 ? (
                            <Button
                              size="compact-xs"
                              color="red"
                              variant="light"
                              leftSection={<Play size={10} fill="currentColor" />}
                              onClick={() =>
                                onOpenVideo(
                                  `Surah ${v.surah_number}:${v.ayat_number} Clip`,
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
                              leftSection={<Play size={10} fill="currentColor" />}
                              rightSection={
                                <span
                                  style={{
                                    background: "white",
                                    color: "#dc2626",
                                    borderRadius: 8,
                                    padding: "1px 4px",
                                    fontSize: 8,
                                    fontWeight: 800,
                                  }}
                                >
                                  {vList.length}
                                </span>
                              }
                              onClick={() =>
                                onOpenMultiVideo({
                                  title: `Surah ${formatVerseRef(v.surah_number, v.ayat_number)} Video Clips`,
                                  videos: vList,
                                  verse: v,
                                })
                              }
                            >
                              Clips
                            </Button>
                          )}
                        </Table.Td>

                        <Table.Td style={{ textAlign: "center", whiteSpace: "nowrap", width: "1%" }} onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="compact-xs"
                            variant="light"
                            color="indigo"
                            leftSection={<Layers size={11} />}
                            onClick={() => onOpenCitationsModal(v, v.occurrences)}
                            title="View cited lectures & video clips"
                            style={{ fontWeight: 700, fontSize: 11 }}
                          >
                            {v.occurrences.length} {v.occurrences.length === 1 ? "Lecture" : "Lectures"}
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          </Paper>
        ))
      )}
    </Stack>
  );
}
