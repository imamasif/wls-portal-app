import React from "react";
import {
  Modal,
  Group,
  Badge,
  Text,
  Stack,
  Paper,
  Button,
  Box,
} from "@mantine/core";
import { Play, ChevronRight } from "lucide-react";
import {
  formatVerseRef,
  parseVideoTimestamps,
  getCategoryIconUrl,
  getLectureIconUrl,
} from "./notebookUtils";
import { MediaIconBadge } from "./MediaIconBadge";

export function NotebookCitationsModal({
  activeCitationsModal,
  onClose,
  metaCategories,
  onJumpToLecture,
  onOpenVideo,
  isDark,
}) {
  return (
    <Modal
      opened={!!activeCitationsModal}
      onClose={onClose}
      title={
        activeCitationsModal && (
          <Group gap="xs">
            <Badge color="indigo" size="md" variant="filled" style={{ fontFamily: "monospace", fontWeight: 800 }}>
              {formatVerseRef(activeCitationsModal.verse.surah_number, activeCitationsModal.verse.ayat_number)}
            </Badge>
            <Text fw={800} size="sm">
              {activeCitationsModal.verse.surah_name || `Surah ${activeCitationsModal.verse.surah_number}`} — Cited in {activeCitationsModal.citations.length} Lecture{activeCitationsModal.citations.length === 1 ? "" : "s"}
            </Text>
          </Group>
        )
      }
      size="lg"
      centered
      radius="lg"
    >
      {activeCitationsModal && (
        <Stack gap="md">
          {/* Translation Banner */}
          <Paper p="sm" radius="md" style={{ background: isDark ? "#1f2937" : "#f1f5f9" }}>
            <Text size="xs" fw={700} c="dimmed" mb={2}>
              TRANSLATION REFERENCE:
            </Text>
            <Text size="xs" c={isDark ? "gray.2" : "dark.8"} style={{ lineHeight: 1.5 }}>
              "{activeCitationsModal.verse.english_translation || activeCitationsModal.verse.urdu_translation || "Quranic verse"}"
            </Text>
          </Paper>

          <Text size="xs" fw={700} c="dimmed">
            ALL LECTURES & ATTACHED VIDEO CLIPS CITING THIS AYAT ({activeCitationsModal.citations.length}):
          </Text>

          <Stack gap="sm" style={{ maxHeight: 440, overflowY: "auto", paddingRight: 4 }}>
            {activeCitationsModal.citations.map((cite, cIdx) => {
              const isEnglish = cite.language === "eng";
              const isUrdu = cite.language === "urdu";
              const isHindi = cite.language === "hindi";
              const langLabel = isEnglish ? "English" : isUrdu ? "Urdu" : isHindi ? "Hindi" : cite.language;
              const langBadgeColor = isEnglish ? "blue" : isUrdu ? "green" : "orange";

              return (
                <Paper
                  key={cIdx}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{
                    background: isDark ? "#141517" : "#ffffff",
                    borderColor: isDark ? "#374151" : "#e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Header: Category & Language Badges */}
                  <Group justify="space-between" align="flex-start" mb="xs">
                    <div>
                      <Group gap={6} mb={3}>
                        <Badge size="xs" color={langBadgeColor} variant="filled">
                          {isEnglish ? "📘" : isUrdu ? "📗" : "📙"} {langLabel}
                        </Badge>
                        <Badge
                          size="xs"
                          color="gray"
                          variant="light"
                          leftSection={
                            <MediaIconBadge
                              src={getCategoryIconUrl({ category_name: cite.category_name, language: cite.language }, cite.language)}
                              alt={cite.category_name}
                              size={14}
                              type="category"
                            />
                          }
                        >
                          {cite.category_name}
                        </Badge>
                        {cite.season && (
                          <Badge size="xs" color="violet" variant="outline">
                            {cite.season}
                          </Badge>
                        )}
                        {cite.year_delivered && (
                          <Text size="10px" c="dimmed">
                            Yr {cite.year_delivered}
                          </Text>
                        )}
                      </Group>
                      <Group gap={6} align="center" wrap="nowrap">
                        <MediaIconBadge
                          src={getLectureIconUrl({ lecture_id: cite.lecture_number, lecture_name: cite.lecture_name, language: cite.language }, cite.language)}
                          alt={cite.lecture_name}
                          size={20}
                          type="lecture"
                        />
                        <Text size="sm" fw={800} c={isDark ? "white" : "dark.8"}>
                          {cite.lecture_name}
                        </Text>
                      </Group>
                      {cite.lecture_names?.length > 1 && (
                        <Text size="10px" c="dimmed">
                          AKA: {cite.lecture_names.slice(1).join(", ")}
                        </Text>
                      )}
                    </div>

                    {/* Jump button */}
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="indigo"
                      rightSection={<ChevronRight size={12} />}
                      onClick={() => onJumpToLecture(cite)}
                    >
                      Open in Notebook
                    </Button>
                  </Group>

                  {/* Attached Video Clips */}
                  {cite.video_urls && cite.video_urls.length > 0 && (
                    <Box mt="xs" p="xs" style={{ background: isDark ? "#1e1b4b22" : "#f8fafc", borderRadius: 8 }}>
                      <Text size="11px" fw={700} c="red.8" mb={4}>
                        Attached Video Clip(s):
                      </Text>
                      <Group gap="xs" wrap="wrap">
                        {cite.video_urls.map((vUrl, vI) => {
                          const ts = parseVideoTimestamps(vUrl);
                          return (
                            <Button
                              key={vI}
                              size="compact-xs"
                              color="red"
                              variant="filled"
                              leftSection={<Play size={10} fill="currentColor" />}
                              onClick={() =>
                                onOpenVideo(
                                  `${cite.lecture_name} - Surah ${activeCitationsModal.verse.surah_number}:${activeCitationsModal.verse.ayat_number} (Clip ${vI + 1})`,
                                  vUrl
                                )
                              }
                              style={{ fontWeight: 700 }}
                            >
                              Play Clip {cite.video_urls.length > 1 ? `${vI + 1}` : ""} {ts ? `(${ts})` : ""}
                            </Button>
                          );
                        })}
                      </Group>
                    </Box>
                  )}

                  {/* Notes or Questions if present */}
                  {cite.points_notes && (
                    <Text size="xs" c="dimmed" mt={6} style={{ fontStyle: "italic" }}>
                      Notes: {cite.points_notes}
                    </Text>
                  )}
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Modal>
  );
}
