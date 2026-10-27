import React from "react";
import {
  Modal,
  Group,
  Badge,
  Text,
  Stack,
  Paper,
  Loader,
  Tabs,
  Button,
} from "@mantine/core";
import { Layers, Play } from "lucide-react";
import {
  formatVerseRef,
  parseVideoTimestamps,
  SHOW_AYAT_IMAGES,
} from "./notebookUtils";

export function NotebookAyatDetailModal({
  activeAyatModal,
  onClose,
  liveArabicText,
  isFetchingLiveArabic,
  verseCitationsMap,
  onOpenVideo,
  isDark,
}) {
  return (
    <Modal
      opened={!!activeAyatModal}
      onClose={onClose}
      title={
        activeAyatModal && (
          <Group gap="xs">
            <Badge color="indigo" size="md" variant="filled" style={{ fontFamily: "monospace", fontWeight: 800 }}>
              {formatVerseRef(activeAyatModal.surah_number, activeAyatModal.ayat_number)}
            </Badge>
            <Text fw={700} size="sm">
              {activeAyatModal.surah_name || `Surah ${activeAyatModal.surah_number}`}
            </Text>
          </Group>
        )
      }
      size="lg"
      centered
      radius="md"
    >
      {activeAyatModal && (
        <Stack gap="sm">
          {/* Arabic Text Display */}
          <Paper p="md" radius="md" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", position: "relative" }}>
            <Group justify="space-between" mb={6}>
              <Badge size="xs" color="teal" variant="light">
                Authentic Uthmani Text (Quran API)
              </Badge>
              {isFetchingLiveArabic && <Loader size="xs" color="teal" />}
            </Group>

            <Text className="arabic-calligraphy" style={{ fontSize: 24, color: "#065f46" }}>
              {liveArabicText || activeAyatModal.arabic_text || "Loading authentic text from Quran API..."}
            </Text>
          </Paper>

          {/* Multilingual Translation Tabs */}
          <Tabs defaultValue="english" color="indigo" radius="sm">
            <Tabs.List mb="xs">
              <Tabs.Tab value="english">English Translation</Tabs.Tab>
              {activeAyatModal.urdu_translation && <Tabs.Tab value="urdu">Urdu Translation</Tabs.Tab>}
              {activeAyatModal.hindi_translation && <Tabs.Tab value="hindi">Hindi Translation</Tabs.Tab>}
            </Tabs.List>

            <Tabs.Panel value="english">
              <Text size="xs" c="dark.7" style={{ lineHeight: 1.6 }}>
                {activeAyatModal.english_translation || "No English translation provided."}
              </Text>
            </Tabs.Panel>

            {activeAyatModal.urdu_translation && (
              <Tabs.Panel value="urdu">
                <Text className="urdu-calligraphy" size="xs" c="dark.7" style={{ lineHeight: 1.7 }}>
                  {activeAyatModal.urdu_translation}
                </Text>
              </Tabs.Panel>
            )}

            {activeAyatModal.hindi_translation && (
              <Tabs.Panel value="hindi">
                <Text size="xs" c="dark.7" style={{ lineHeight: 1.6 }}>
                  {activeAyatModal.hindi_translation}
                </Text>
              </Tabs.Panel>
            )}
          </Tabs>

          {/* Lecture Points / Notes */}
          {(activeAyatModal.points_notes_eng || activeAyatModal.points_notes_urdu || activeAyatModal.points_notes) && (
            <Paper p="xs" radius="sm" style={{ background: "#fef3c7", borderLeft: "3px solid #f59e0b" }}>
              <Text size="xs" fw={700} c="dark.8" mb={2}>
                💡 Lecture Notes & Explanations:
              </Text>
              <Text size="xs" c="dark.7">
                {activeAyatModal.points_notes_eng || activeAyatModal.points_notes_urdu || activeAyatModal.points_notes}
              </Text>
            </Paper>
          )}

          {/* Question & Answer if any */}
          {activeAyatModal.quest_answer && activeAyatModal.question_text && (
            <Paper p="xs" radius="sm" style={{ background: "#eff6ff", borderLeft: "3px solid #3b82f6" }}>
              <Text size="xs" fw={700} c="blue.9" mb={2}>
                ❓ Question Addressed in Lecture:
              </Text>
              <Text size="xs" c="dark.7">
                {activeAyatModal.question_text}
              </Text>
            </Paper>
          )}

          {/* PROVISION: Ayat Images (English, Urdu, Hindi) - Kept hidden for now until server images updated */}
          {SHOW_AYAT_IMAGES && Boolean(activeAyatModal.ayat_image_eng_url || activeAyatModal.ayat_image_urdu_url || activeAyatModal.ayat_image_hindi_url) && (
            <Paper p="sm" radius="md" withBorder style={{ background: isDark ? "#141517" : "#f8fafc" }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={700} c="dimmed">
                  🖼️ Ayat Slide Image:
                </Text>
                <Badge size="xs" color="indigo" variant="light">Visual Reference</Badge>
              </Group>
              <Tabs defaultValue="eng_img" color="indigo" radius="sm">
                <Tabs.List mb="xs">
                  {activeAyatModal.ayat_image_eng_url && <Tabs.Tab value="eng_img">English Image</Tabs.Tab>}
                  {activeAyatModal.ayat_image_urdu_url && <Tabs.Tab value="urdu_img">Urdu Image</Tabs.Tab>}
                  {activeAyatModal.ayat_image_hindi_url && <Tabs.Tab value="hindi_img">Hindi Image</Tabs.Tab>}
                </Tabs.List>
                {activeAyatModal.ayat_image_eng_url && (
                  <Tabs.Panel value="eng_img">
                    <div style={{ textAlign: "center", borderRadius: 8, overflow: "hidden", background: "#000" }}>
                      <img
                        src={activeAyatModal.ayat_image_eng_url}
                        alt="Ayat English Slide"
                        style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                      />
                    </div>
                  </Tabs.Panel>
                )}
                {activeAyatModal.ayat_image_urdu_url && (
                  <Tabs.Panel value="urdu_img">
                    <div style={{ textAlign: "center", borderRadius: 8, overflow: "hidden", background: "#000" }}>
                      <img
                        src={activeAyatModal.ayat_image_urdu_url}
                        alt="Ayat Urdu Slide"
                        style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                      />
                    </div>
                  </Tabs.Panel>
                )}
                {activeAyatModal.ayat_image_hindi_url && (
                  <Tabs.Panel value="hindi_img">
                    <div style={{ textAlign: "center", borderRadius: 8, overflow: "hidden", background: "#000" }}>
                      <img
                        src={activeAyatModal.ayat_image_hindi_url}
                        alt="Ayat Hindi Slide"
                        style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                      />
                    </div>
                  </Tabs.Panel>
                )}
              </Tabs>
            </Paper>
          )}

          {/* Cited in Lectures & Categories (Both English & Urdu) */}
          {(() => {
            const cKey = `${activeAyatModal.surah_number}:${activeAyatModal.ayat_number}`;
            const citations = activeAyatModal.citations || verseCitationsMap.get(cKey) || [];
            if (citations.length === 0) return null;

            return (
              <Paper p="sm" radius="md" withBorder style={{ background: isDark ? "#141517" : "#f8fafc", borderColor: isDark ? "#2c2e33" : "#e2e8f0" }}>
                <Group justify="space-between" mb="xs">
                  <Group gap={6}>
                    <Layers size={14} color="#4f46e5" />
                    <Text size="xs" fw={800} c={isDark ? "white" : "dark.8"}>
                      Cited in {citations.length} Lecture{citations.length === 1 ? "" : "s"} across Categories (English & Urdu):
                    </Text>
                  </Group>
                  <Badge size="xs" color="indigo" variant="light">
                    Lectures & Clips
                  </Badge>
                </Group>

                <Stack gap="xs" style={{ maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                  {citations.map((cite, cIdx) => {
                    const isEnglish = cite.language === "eng";
                    const isUrdu = cite.language === "urdu";
                    const langLabel = isEnglish ? "English" : isUrdu ? "Urdu" : cite.language;
                    const langColor = isEnglish ? "blue" : isUrdu ? "green" : "orange";

                    return (
                      <Paper key={cIdx} p="xs" radius="sm" withBorder style={{ background: isDark ? "#1e1f23" : "#ffffff" }}>
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <Group gap={6} mb={2}>
                              <Badge size="xs" color={langColor} variant="filled" style={{ fontSize: 9 }}>
                                {isEnglish ? "📘" : isUrdu ? "📗" : "📙"} {langLabel}
                              </Badge>
                              <Text size="10px" fw={700} c="dimmed">
                                {cite.category_name}
                              </Text>
                            </Group>
                            <Text size="xs" fw={700} lineClamp={1}>
                              {cite.lecture_name}
                            </Text>
                          </div>

                          {/* Attached Video Clips for this Lecture */}
                          {cite.video_urls && cite.video_urls.length > 0 && (
                            <Group gap={6} wrap="wrap">
                              {cite.video_urls.map((vUrl, vI) => {
                                const ts = parseVideoTimestamps(vUrl);
                                return (
                                  <Button
                                    key={vI}
                                    size="compact-xs"
                                    color="red"
                                    variant={cite.video_urls.length > 1 ? "filled" : "light"}
                                    leftSection={<Play size={10} fill="currentColor" />}
                                    onClick={() =>
                                      onOpenVideo(
                                        `${cite.lecture_name} - Surah ${activeAyatModal.surah_number}:${activeAyatModal.ayat_number} ${cite.video_urls.length > 1 ? `(Clip ${vI + 1})` : ""}`,
                                        vUrl
                                      )
                                    }
                                    style={{ flexShrink: 0, fontWeight: 700 }}
                                  >
                                    {cite.video_urls.length === 1 ? "Play Clip" : `Clip ${vI + 1}`} {ts ? `(${ts})` : ""}
                                  </Button>
                                );
                              })}
                            </Group>
                          )}
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            );
          })()}
        </Stack>
      )}
    </Modal>
  );
}
