import React from "react";
import {
  Paper,
  Group,
  Text,
  Badge,
  Title,
  Button,
  Stack,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  Play,
  Heart,
  BookOpen,
  Layers,
  Download,
  List,
  Sparkles,
} from "lucide-react";
import {
  getLectureName,
  getLectureAliases,
  CUTE_REACTIONS,
  getCategoryIconUrl,
  getLectureIconUrl,
} from "./notebookUtils";
import { PdfFileIcon } from "./PdfFileIcon";
import { MediaIconBadge } from "./MediaIconBadge";

export function NotebookLectureDashboard({
  activeCategory,
  activeLecture,
  currentLectureVerses,
  seasonsList,
  currentSeason,
  activeSeasonIndex,
  setActiveSeasonIndex,
  episodesList,
  likedMap,
  openReactionLectureId,
  setOpenReactionLectureId,
  onCircularLikeClick,
  onSelectReaction,
  openActionModal,
  onOpenVideo,
  isDark,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        marginBottom: "20px",
      }}
    >
      {/* Main Lecture Info Card (Left) */}
      <Paper
        p="md"
        radius="lg"
        withBorder
        style={{
          gridColumn: "span 2",
          background: isDark ? "#141517" : "#ffffff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Group justify="space-between" align="flex-start" mb="sm">
            <div>
              <Group gap={6} mb={4} align="center">
                <MediaIconBadge
                  src={getCategoryIconUrl(activeCategory, activeCategory.language)}
                  alt={activeCategory.category_name}
                  size={20}
                  type="category"
                />
                <Text size="11px" fw={700} c="indigo.6" tt="uppercase" style={{ letterSpacing: 0.5 }}>
                  {activeCategory.category_name}
                </Text>
                <Text size="11px" c="dimmed">•</Text>
                <Badge size="xs" variant="light" color="indigo">
                  {currentSeason ? currentSeason.season_name : "Lecture Series"}
                </Badge>
                {activeLecture.year_delivered && (
                  <>
                    <Text size="11px" c="dimmed">•</Text>
                    <Text size="11px" c="dimmed">
                      Year {activeLecture.year_delivered}
                    </Text>
                  </>
                )}
              </Group>

              <Group gap="xs" align="center" wrap="nowrap">
                <MediaIconBadge
                  src={getLectureIconUrl(activeLecture, activeCategory.language)}
                  alt={getLectureName(activeLecture.lecture_name)}
                  size={36}
                  type="lecture"
                />
                <div>
                  <Title order={3} style={{ fontWeight: 800, fontSize: "1.3rem", color: isDark ? "#ffffff" : "#1e293b" }}>
                    {getLectureName(activeLecture.lecture_name)}
                  </Title>
                  {getLectureAliases(activeLecture.lecture_name).length > 0 && (
                    <Group gap={6} mt={6}>
                      <Text size="xs" c="dimmed" fw={700}>
                        Also Known As:
                      </Text>
                      {getLectureAliases(activeLecture.lecture_name).map((alias, aIdx) => (
                        <Badge key={aIdx} size="sm" variant="light" color="indigo">
                          {alias}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </div>
              </Group>
            </div>

            <Group gap="sm" align="center">
              {/* 3D Circular Reaction Button with 4 Cute Floating Icons */}
              <div style={{ position: "relative", display: "inline-block" }}>
                {openReactionLectureId === (activeLecture._id || activeLecture.lecture_id) && (
                  <>
                    {/* Click outside backdrop */}
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 998 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenReactionLectureId(null);
                      }}
                    />
                    {/* The 4 Cute Small Icons popping all around */}
                    <div className="reaction-aura-popover">
                      {CUTE_REACTIONS.map((r) => {
                        const IconComp = r.icon;
                        const isCurrent = likedMap[activeLecture._id || activeLecture.lecture_id]?.id === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            className="cute-reaction-btn"
                            onClick={(e) => onSelectReaction(activeLecture._id || activeLecture.lecture_id, r, e)}
                            title={`${r.label} (${r.emoji})`}
                            style={{
                              backgroundColor: r.bg,
                              color: r.color,
                              borderColor: isCurrent ? r.color : "transparent",
                              boxShadow: `0 4px 10px ${r.glow}`,
                              transform: isCurrent ? "scale(1.2)" : "scale(1)",
                            }}
                          >
                            <IconComp size={15} fill={r.fill || isCurrent ? "currentColor" : "none"} />
                            <span className="cute-reaction-tooltip">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="circular-like-btn"
                  onClick={(e) => onCircularLikeClick(activeLecture._id || activeLecture.lecture_id, e)}
                  title={
                    likedMap[activeLecture._id || activeLecture.lecture_id]
                      ? `Reacted: ${likedMap[activeLecture._id || activeLecture.lecture_id]?.label || "Liked"} (Click to change)`
                      : "Click to react with love, hear, thumb, spread"
                  }
                  style={{
                    backgroundColor: likedMap[activeLecture._id || activeLecture.lecture_id]?.bg || (isDark ? "#2c2e33" : "#f8fafc"),
                    color: likedMap[activeLecture._id || activeLecture.lecture_id]?.color || (isDark ? "#94a3b8" : "#64748b"),
                    borderColor: likedMap[activeLecture._id || activeLecture.lecture_id]?.color || (isDark ? "#3f444e" : "#cbd5e1"),
                    boxShadow: likedMap[activeLecture._id || activeLecture.lecture_id]
                      ? `0 4px 12px ${likedMap[activeLecture._id || activeLecture.lecture_id]?.glow || "rgba(219,39,119,0.35)"}`
                      : "0 3px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  {(() => {
                    const rec = likedMap[activeLecture._id || activeLecture.lecture_id];
                    if (!rec) return <Heart size={16} />;
                    const IconComp = rec.icon || Heart;
                    return typeof IconComp === "function" ? (
                      <IconComp size={16} fill={rec.fill ? "currentColor" : "none"} />
                    ) : (
                      <span style={{ fontSize: 16 }}>{rec.emoji || "❤️"}</span>
                    );
                  })()}
                </button>
              </div>

              {/* Real 3D PDF Document SVG Icon Button with tactile click feel */}
              <Tooltip
                label={
                  activeLecture.pdf_link ||
                  (Array.isArray(activeLecture.pdf_url) ? activeLecture.pdf_url.length > 0 : activeLecture.pdf_url) ||
                  activeLecture.pdf_booklet_urls?.length
                    ? "Download / View PDF Booklet & Notes"
                    : "PDF Booklet being digitized (Click to check)"
                }
                withArrow
                position="top"
                offset={6}
              >
              <button
                type="button"
                className="pdf-doc-btn"
                aria-label="Download or View PDF Booklet"
                onClick={() => {
                  const primaryPdf = Array.isArray(activeLecture.pdf_url) ? activeLecture.pdf_url[0] : activeLecture.pdf_url;
                  const pdfUrl =
                    (typeof primaryPdf === "object" ? primaryPdf?.url : primaryPdf) ||
                    activeLecture.pdf_link ||
                    (Array.isArray(activeLecture.pdf_booklet_urls) ? activeLecture.pdf_booklet_urls[0] : "");
                  if (pdfUrl) {
                    window.open(pdfUrl, "_blank", "noopener,noreferrer");
                  } else {
                    openActionModal("pdf", activeLecture);
                  }
                }}
                title="Download / View Official PDF Booklet & Notes"
              >
                <PdfFileIcon size={42} />
              </button>
            </Tooltip>
            </Group>
          </Group>

          {/* Lecture Stats Badges */}
          <Group gap="xs" mt="md">
            <Badge color="blue" variant="light" size="sm" leftSection={<BookOpen size={12} />}>
              {currentLectureVerses.length} Quran Verses Linked
            </Badge>
            <Badge color="violet" variant="light" size="sm" leftSection={<Layers size={12} />}>
              {seasonsList.length} Season(s) • {episodesList.length} Episodes
            </Badge>
            {activeLecture.year_delivered && (
              <Badge color="gray" variant="light" size="sm">
                Year: {activeLecture.year_delivered}
              </Badge>
            )}
          </Group>
        </div>

        {/* Full lecture video quick link if available */}
        {(activeLecture.full_lecture_video_url || (activeLecture.video_urls && activeLecture.video_urls.length > 0)) && (
          <Group justify="space-between" align="center" mt="md" p="xs" style={{ background: isDark ? "#1e1f23" : "#f8fafc", borderRadius: 8 }}>
            <Text size="xs" c="dimmed">
              Full lecture recording is available to watch:
            </Text>
            <Button
              size="compact-xs"
              color="red"
              variant="light"
              leftSection={<Play size={11} fill="currentColor" />}
              onClick={() => {
                const vUrl =
                  activeLecture.full_lecture_video_url ||
                  (activeLecture.video_urls && activeLecture.video_urls[0]) ||
                  "";
                if (vUrl) {
                  onOpenVideo(
                    `${getLectureName(activeLecture.lecture_name)} - Full Recording`,
                    vUrl
                  );
                }
              }}
            >
              Stream Full Lecture
            </Button>
          </Group>
        )}
      </Paper>

      {/* Season & Episodes List Panel (Right) */}
      <Paper
        p="md"
        radius="lg"
        withBorder
        style={{
          background: isDark ? "#141517" : "#ffffff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Group justify="space-between" align="center" mb={8}>
            <Group gap={6}>
              <List size={16} color="#4f46e5" />
              <Text size="sm" fw={800}>Season & Episodes</Text>
            </Group>

            {/* Season Selector / Badges if multiple seasons */}
            {seasonsList.length > 1 ? (
              <Group gap={4}>
                {seasonsList.map((s, sIdx) => {
                  const isCurrent = activeSeasonIndex === sIdx;
                  return (
                    <Button
                      key={sIdx}
                      size="compact-xs"
                      radius="xl"
                      variant={isCurrent ? "filled" : "light"}
                      color="indigo"
                      onClick={() => setActiveSeasonIndex(sIdx)}
                      style={{ fontSize: 10, fontWeight: 700 }}
                    >
                      {s.season_name || `Season ${sIdx + 1}`}
                    </Button>
                  );
                })}
              </Group>
            ) : seasonsList.length === 1 ? (
              <Badge size="xs" variant="light" color="indigo">
                {seasonsList[0].season_name || "Season 1"}
              </Badge>
            ) : null}
          </Group>

          <Text size="11px" c="dimmed" mb="xs">
            {currentSeason
              ? `${currentSeason.season_name} • ${episodesList.length} episodes available`
              : "Episodes and recorded parts in this lecture series:"}
          </Text>

          {episodesList.length === 0 ? (
            <Paper p="sm" radius="md" withBorder ta="center" style={{ background: isDark ? "#1e1f23" : "#f8fafc" }}>
              <Text size="xs" c="dimmed">
                No video episodes uploaded yet for this lecture.
              </Text>
            </Paper>
          ) : (
            <Stack gap={6} style={{ maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
              {episodesList.map((ep, idx) => (
                <Paper
                  key={ep.id || idx}
                  p="xs"
                  radius="md"
                  withBorder
                  onClick={() => {
                    const epUrl = ep.episode_url || ep.videoUrl || ep.video_url;
                    if (epUrl) {
                      onOpenVideo(
                        `${getLectureName(activeLecture.lecture_name)} - ${ep.episode_title || ep.title || `Episode ${idx + 1}`}`,
                        epUrl
                      );
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    background: idx === 0 ? (isDark ? "#1e1b4b33" : "#eef2ff") : "transparent",
                    borderColor: idx === 0 ? "#6366f1" : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:scale-[1.01]"
                >
                  <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: "#4f46e5",
                        color: "white",
                        fontSize: 10,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text size="xs" fw={700} lineClamp={1} style={{ maxWidth: 200 }}>
                        {ep.episode_title || ep.title || ep.episode_number || `Episode ${idx + 1}`}
                      </Text>
                      <Text size="9px" c="dimmed">
                        {ep.episode_number ? `${ep.episode_number} • ` : ""}
                        {ep.duration || "Watch Episode"}
                      </Text>
                    </div>
                  </Group>
                  <ActionIcon size="sm" variant="subtle" color="indigo">
                    <Play size={13} fill="currentColor" />
                  </ActionIcon>
                </Paper>
              ))}
            </Stack>
          )}
        </div>

        {/* Pro Tip Box */}
        <Paper
          p="xs"
          radius="md"
          mt="xs"
          style={{
            background: isDark ? "#1e1f23" : "#f0fdf4",
            border: `1px solid ${isDark ? "#2c2e33" : "#bbf7d0"}`,
          }}
        >
          <Group gap={6} mb={2}>
            <Sparkles size={13} color="#059669" />
            <Text size="10px" fw={800} c="teal.8">
              Pro Tip
            </Text>
          </Group>
          <Text size="10px" c="dimmed" style={{ lineHeight: 1.4 }}>
            Hover any chip at the top to pop out quick video, PDF, or episode controls directly!
          </Text>
        </Paper>
      </Paper>
    </div>
  );
}
