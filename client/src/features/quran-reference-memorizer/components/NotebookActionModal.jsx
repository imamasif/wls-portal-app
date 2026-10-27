import React from "react";
import {
  Modal,
  Group,
  Text,
  Stack,
  Title,
  Button,
  Badge,
  Paper,
} from "@mantine/core";
import { FileText, BookOpen, Layers, Download, Play } from "lucide-react";
import { getLectureName, formatVerseRef, getLectureIconUrl } from "./notebookUtils";
import { PdfFileIcon } from "./PdfFileIcon";
import { MediaIconBadge } from "./MediaIconBadge";

export function NotebookActionModal({
  activeActionModal,
  actionModalLecture,
  onClose,
  onOpenVideo,
}) {
  return (
    <Modal
      opened={!!activeActionModal && !!actionModalLecture}
      onClose={onClose}
      title={
        actionModalLecture && (
          <Group gap="xs" align="center">
            <MediaIconBadge
              src={getLectureIconUrl(actionModalLecture, actionModalLecture.language)}
              alt={getLectureName(actionModalLecture.lecture_name)}
              size={22}
              type="lecture"
            />
            {activeActionModal === "pdf" && <PdfFileIcon size={20} />}
            {activeActionModal === "verses" && <BookOpen size={18} color="#d97706" />}
            {activeActionModal === "episodes" && <Layers size={18} color="#4f46e5" />}
            <Text fw={700} size="sm">
              {actionModalLecture.lecture_id && !isNaN(actionModalLecture.lecture_id) ? `${actionModalLecture.lecture_id}. ` : ""}
              {getLectureName(actionModalLecture.lecture_name)}
            </Text>
          </Group>
        )
      }
      size="lg"
      centered
      radius="lg"
    >
      {actionModalLecture && (
        <div>
          {/* 1. PDF Material Modal */}
          {activeActionModal === "pdf" && (
            <Stack gap="md" ta="center" py="md">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#fee2e2",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                }}
              >
                <PdfFileIcon size={44} />
              </div>
              <div>
                <Title order={4}>
                  {(Array.isArray(actionModalLecture.pdf_url) && actionModalLecture.pdf_url[0]?.title) ||
                   actionModalLecture.pdf_title ||
                   `${actionModalLecture.lecture_id && !isNaN(actionModalLecture.lecture_id) ? `${actionModalLecture.lecture_id}. ` : ""}${getLectureName(actionModalLecture.lecture_name)} - Study Notes`}
                </Title>
                <Text size="xs" c="dimmed" mt={4}>
                  Official Lecture Transcripts, Notes & Quranic Ayat Indices
                </Text>
              </div>
              <Group justify="center" mt="sm">
                {(() => {
                  const candidates = [];
                  if (Array.isArray(actionModalLecture.pdf_url) && actionModalLecture.pdf_url.length > 0) {
                    candidates.push(...actionModalLecture.pdf_url);
                  } else if (typeof actionModalLecture.pdf_url === "string" && actionModalLecture.pdf_url.trim()) {
                    candidates.push({ title: actionModalLecture.pdf_title || "Open PDF Booklet", url: actionModalLecture.pdf_url.trim() });
                  }
                  if (actionModalLecture.pdf_link) {
                    candidates.push({ title: actionModalLecture.pdf_title || "Open PDF Booklet", url: actionModalLecture.pdf_link });
                  }
                  if (Array.isArray(actionModalLecture.pdf_booklet_urls) && actionModalLecture.pdf_booklet_urls.length > 0) {
                    actionModalLecture.pdf_booklet_urls.forEach((u) => {
                      candidates.push({ title: actionModalLecture.pdf_title || "Open PDF Booklet", url: u });
                    });
                  }

                  const seenUrls = new Set();
                  const validPdfs = [];
                  for (const item of candidates) {
                    const u = typeof item === "string" ? item.trim() : (typeof item?.url === "string" ? item.url.trim() : "");
                    const t = (typeof item === "object" && item?.title) ? item.title : (actionModalLecture.pdf_title || "Open PDF Booklet");
                    if (u && !seenUrls.has(u)) {
                      seenUrls.add(u);
                      validPdfs.push({ title: t, url: u });
                    }
                  }

                  if (validPdfs.length === 0) {
                    return (
                      <Badge color="gray" size="md">
                        PDF Booklet being digitized
                      </Badge>
                    );
                  }

                  return validPdfs.map((pdf, idx) => (
                    <Button
                      key={idx}
                      color="red"
                      variant="light"
                      radius="xl"
                      leftSection={<PdfFileIcon size={18} />}
                      onClick={() => window.open(pdf.url, "_blank", "noopener,noreferrer")}
                    >
                      {pdf.title || (validPdfs.length > 1 ? `Open PDF Booklet ${idx + 1}` : "Open PDF Booklet")}
                    </Button>
                  ));
                })()}
              </Group>
            </Stack>
          )}

          {/* 2. Linked Verses Modal */}
          {activeActionModal === "verses" && (
            <Stack gap="xs" style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
              <Text size="xs" c="dimmed" mb={4}>
                All {actionModalLecture.ayat_references?.length || 0} Quranic Verses Cited in this Lecture:
              </Text>
              {(actionModalLecture.ayat_references || []).map((verse, vIdx) => (
                <Paper key={vIdx} p="sm" radius="md" withBorder style={{ background: "#f8fafc" }}>
                  <Group justify="space-between" mb={4}>
                    <Badge color="indigo" size="sm" variant="filled">
                      Ayat {formatVerseRef(verse.surah_number, verse.ayat_number)}
                    </Badge>
                    <Text size="xs" fw={700} c="dimmed">
                      {verse.surah_name}
                    </Text>
                  </Group>
                  <Text size="xs" c="dark.7" fs="italic">
                    "{verse.english_translation || verse.urdu_translation || "Quranic verse reference"}"
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}

          {/* 3. Seasons & Episodes Breakdown Modal */}
          {activeActionModal === "episodes" && (
            <Stack gap="xs">
              <Text size="xs" c="dimmed">
                Season Episodes & Topic Parts:
              </Text>

              <Stack gap="xs" style={{ maxHeight: 380, overflowY: "auto" }}>
                {(actionModalLecture.seasons && actionModalLecture.seasons.length > 0
                  ? actionModalLecture.seasons.flatMap((s) =>
                      (s.episodes || []).map((ep) => ({ ...ep, season_name: s.season_name }))
                    )
                  : (actionModalLecture.episodes || [])
                ).map((ep, idx) => (
                  <Paper key={ep.id || idx} p="sm" radius="md" withBorder>
                    <Group justify="space-between" align="center">
                      <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            backgroundColor: "#4f46e5",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Text size="xs" fw={700} lineClamp={1}>
                            {ep.episode_title || ep.title || `Episode ${idx + 1}`}
                          </Text>
                          <Text size="10px" c="dimmed">
                            {ep.season_name ? `${ep.season_name} • ` : ""}
                            {ep.episode_number || ep.duration || "Episode"}
                          </Text>
                        </div>
                      </Group>

                      <Button
                        size="compact-xs"
                        color="indigo"
                        variant="light"
                        leftSection={<Play size={11} fill="currentColor" />}
                        onClick={() => {
                          const epUrl = ep.episode_url || ep.videoUrl || ep.video_url;
                          if (epUrl) {
                            onOpenVideo(
                              `${getLectureName(actionModalLecture.lecture_name)} - ${ep.episode_title || ep.title || `Episode ${idx + 1}`}`,
                              epUrl
                            );
                            onClose();
                          }
                        }}
                      >
                        Play
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          )}
        </div>
      )}
    </Modal>
  );
}
