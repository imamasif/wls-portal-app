import React, { useState, useEffect } from "react";
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
  ActionIcon,
  Tooltip,
  Box,
  SegmentedControl,
  Divider,
  Center,
  Alert,
} from "@mantine/core";
import {
  Layers,
  Play,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  formatVerseRef,
  parseVideoTimestamps,
  normalizeAyatImageUrls,
} from "./notebookUtils";

export function NotebookAyatDetailModal({
  activeAyatModal,
  onClose,
  liveArabicText,
  isFetchingLiveArabic,
  verseCitationsMap,
  onOpenVideo,
  isDark,
  activeLanguage = "eng",
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeImageGroup, setActiveImageGroup] = useState("eng");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState("image"); // 'image' | 'arabic'
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const surahNum = Number(activeAyatModal?.surah_number);
  const ayatNum = Number(activeAyatModal?.ayat_number);

  // Helper to ensure an image actually corresponds to this specific surah and ayat
  const matchesCurrentVerse = (url) => {
    if (!url || typeof url !== "string") return false;
    // Check if it's a /quran/{surah}/{ayat}.png format
    const quranMatch = url.match(/\/quran\/0*(\d+)\/0*(\d+)\./i);
    if (quranMatch) {
      const s = Number(quranMatch[1]);
      const a = Number(quranMatch[2]);
      return s === surahNum && a === ayatNum;
    }
    // Exclude old combined multi-ayat slides (e.g. ayat_53_19_20)
    if (url.match(/_\d+_\d+_/)) {
      return false;
    }
    return true;
  };

  // Extract all slide image arrays (supporting array of strings, single string, or none/null)
  const rawEng = normalizeAyatImageUrls(
    activeAyatModal?.ayat_image_eng_url || activeAyatModal?.ayat_image_eng_urls
  ).filter(matchesCurrentVerse);
  const rawUrdu = normalizeAyatImageUrls(
    activeAyatModal?.ayat_image_urdu_url || activeAyatModal?.ayat_image_urdu_urls
  ).filter(matchesCurrentVerse);
  const rawHindi = normalizeAyatImageUrls(
    activeAyatModal?.ayat_image_hindi_url || activeAyatModal?.ayat_image_hindi_urls
  ).filter(matchesCurrentVerse);
  const rawGeneral = normalizeAyatImageUrls(
    activeAyatModal?.imageUrl ||
      activeAyatModal?.imageUrls ||
      activeAyatModal?.image_url ||
      activeAyatModal?.image ||
      activeAyatModal?.ayat_image
  ).filter(matchesCurrentVerse);

  // Dedicated Quran Verse Image (/quran/{surah}/{ayat}.png)
  const allImages = Array.from(new Set([...rawGeneral, ...rawEng, ...rawUrdu, ...rawHindi]));
  const quranVerseImages = allImages.filter((u) => u.includes("/quran/"));

  // Slides that are NOT the /quran/ calligraphy image
  const nonQuranEng = rawEng.filter((u) => !u.includes("/quran/"));
  const nonQuranUrdu = rawUrdu.filter((u) => !u.includes("/quran/"));
  const nonQuranHindi = rawHindi.filter((u) => !u.includes("/quran/"));
  const nonQuranGeneral = rawGeneral.filter((u) => !u.includes("/quran/"));

  const imageGroups = [];
  if (quranVerseImages.length > 0) {
    imageGroups.push({
      id: "quran",
      label: `Ayat Image (${quranVerseImages.length})`,
      images: quranVerseImages,
    });
  }
  if (nonQuranEng.length > 0) {
    imageGroups.push({
      id: "eng",
      label: `English Slides (${nonQuranEng.length})`,
      images: nonQuranEng,
    });
  }
  if (nonQuranUrdu.length > 0) {
    imageGroups.push({
      id: "urdu",
      label: `Urdu Slides (${nonQuranUrdu.length})`,
      images: nonQuranUrdu,
    });
  }
  if (nonQuranHindi.length > 0) {
    imageGroups.push({
      id: "hindi",
      label: `Hindi Slides (${nonQuranHindi.length})`,
      images: nonQuranHindi,
    });
  }
  if (nonQuranGeneral.length > 0) {
    imageGroups.push({
      id: "general",
      label: `Slides (${nonQuranGeneral.length})`,
      images: nonQuranGeneral,
    });
  }

  // Fallback
  if (imageGroups.length === 0 && allImages.length > 0) {
    imageGroups.push({
      id: "general",
      label: `Image (${allImages.length})`,
      images: allImages,
    });
  }

  const hasAyatImage = imageGroups.length > 0;

  // Sync state whenever modal opens or active verse changes
  useEffect(() => {
    if (!activeAyatModal) {
      setZoomLevel(1);
      setImageError(false);
      setActiveSlideIndex(0);
      return;
    }

    // Default image preference: prioritize Quran verse calligraphy image if present
    const isUrduContext = (activeLanguage || "").toLowerCase().includes("urdu");
    if (quranVerseImages.length > 0) {
      setActiveImageGroup("quran");
    } else if (isUrduContext && nonQuranUrdu.length > 0) {
      setActiveImageGroup("urdu");
    } else if (nonQuranEng.length > 0) {
      setActiveImageGroup("eng");
    } else if (nonQuranUrdu.length > 0) {
      setActiveImageGroup("urdu");
    } else if (nonQuranHindi.length > 0) {
      setActiveImageGroup("hindi");
    } else if (imageGroups[0]) {
      setActiveImageGroup(imageGroups[0].id);
    } else {
      setActiveImageGroup("quran");
    }

    setActiveSlideIndex(0);
    setZoomLevel(1);
    setIsImageLoading(true);
    setImageError(false);

    // If an ayat image is provided, display it and hide the Arabic text by default
    if (hasAyatImage) {
      setViewMode("image");
    } else {
      setViewMode("arabic");
    }
  }, [
    activeAyatModal,
    activeLanguage,
    hasAyatImage,
    quranVerseImages.length,
    nonQuranEng.length,
    nonQuranUrdu.length,
    nonQuranHindi.length,
    nonQuranGeneral.length,
  ]);

  const currentGroup =
    imageGroups.find((g) => g.id === activeImageGroup) ||
    imageGroups[0] ||
    null;
  const currentSlideList = currentGroup?.images || [];
  const safeSlideIndex = Math.min(
    activeSlideIndex,
    Math.max(0, currentSlideList.length - 1)
  );
  const currentImageUrl = currentSlideList[safeSlideIndex] || "";

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Math.round((prev + 0.25) * 100) / 100, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Math.round((prev - 0.25) * 100) / 100, 0.75));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const toggleImageClickZoom = () => {
    setZoomLevel((prev) => (prev > 1.1 ? 1 : 1.5));
  };

  const handlePrevSlide = () => {
    if (safeSlideIndex > 0) {
      setActiveSlideIndex(safeSlideIndex - 1);
      setIsImageLoading(true);
    }
  };

  const handleNextSlide = () => {
    if (safeSlideIndex < currentSlideList.length - 1) {
      setActiveSlideIndex(safeSlideIndex + 1);
      setIsImageLoading(true);
    }
  };

  if (!activeAyatModal) return null;

  const cKey = `${activeAyatModal.surah_number}:${activeAyatModal.ayat_number}`;
  const citations = activeAyatModal.citations || verseCitationsMap?.get(cKey) || [];

  // Visual Section: Image vs Arabic Text
  const renderVisualContent = () => {
    // 1. Image Mode (When image is provided and viewMode is "image")
    if (hasAyatImage && viewMode === "image" && !imageError) {
      return (
        <Paper
          withBorder
          radius="md"
          p="xs"
          style={{
            background: isDark ? "#141517" : "#ffffff",
            borderColor: isDark ? "#2c2e33" : "#e2e8f0",
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header Controls for Ayat Slide */}
          <Group justify="space-between" align="center" wrap="wrap" gap="xs" mb="xs">
            <Group gap="xs" align="center">
              <Badge
                color="indigo"
                size={isExpanded ? "sm" : "xs"}
                variant="light"
                leftSection={<ImageIcon size={12} />}
              >
                {currentGroup?.id === "quran" ? "Ayat Calligraphy Image" : "Ayat Slide"} {currentSlideList.length > 1 ? `(${safeSlideIndex + 1}/${currentSlideList.length})` : ""}
              </Badge>

              {/* View Switcher: Slide Image vs Arabic Text */}
              <SegmentedControl
                size="xs"
                value={viewMode}
                onChange={setViewMode}
                data={[
                  {
                    value: "image",
                    label: (
                      <Center style={{ gap: 4 }}>
                        <ImageIcon size={12} />
                        <span>Slide Image</span>
                      </Center>
                    ),
                  },
                  {
                    value: "arabic",
                    label: (
                      <Center style={{ gap: 4 }}>
                        <FileText size={12} />
                        <span>Arabic Text</span>
                      </Center>
                    ),
                  },
                ]}
              />
            </Group>

            {/* Language Selection, Multi-Slide Pager & Zoom Controls */}
            <Group gap={6} align="center" wrap="wrap">
              {/* Language Switcher if multiple languages have images */}
              {imageGroups.length > 1 && (
                <SegmentedControl
                  size="xs"
                  value={activeImageGroup}
                  onChange={(val) => {
                    setActiveImageGroup(val);
                    setActiveSlideIndex(0);
                    setIsImageLoading(true);
                    setImageError(false);
                    setZoomLevel(1);
                  }}
                  data={imageGroups.map((g) => ({
                    value: g.id,
                    label: g.label,
                  }))}
                />
              )}

              {/* Previous / Next Slide buttons when multiple slides exist in active group */}
              {currentSlideList.length > 1 && (
                <Group gap={3} align="center" style={{ background: isDark ? "#1e2025" : "#f1f5f9", borderRadius: 6, padding: "2px 6px" }}>
                  <Tooltip label="Previous slide" position="bottom" withArrow>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="indigo"
                      onClick={handlePrevSlide}
                      disabled={safeSlideIndex === 0}
                    >
                      <ChevronLeft size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Text size="11px" fw={700} c="indigo">
                    {safeSlideIndex + 1} / {currentSlideList.length}
                  </Text>
                  <Tooltip label="Next slide" position="bottom" withArrow>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="indigo"
                      onClick={handleNextSlide}
                      disabled={safeSlideIndex === currentSlideList.length - 1}
                    >
                      <ChevronRight size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}

              {/* Zoom Controls */}
              <Tooltip label="Zoom In" position="bottom" withArrow>
                <ActionIcon size="sm" variant="subtle" color="indigo" onClick={handleZoomIn}>
                  <ZoomIn size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Zoom Out" position="bottom" withArrow>
                <ActionIcon size="sm" variant="subtle" color="indigo" onClick={handleZoomOut}>
                  <ZoomOut size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Reset Zoom (100%)" position="bottom" withArrow>
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={handleZoomReset}>
                  <RotateCcw size={14} />
                </ActionIcon>
              </Tooltip>
              <Badge size="xs" variant="outline" color="indigo" style={{ minWidth: 42, textAlign: "center" }}>
                {Math.round(zoomLevel * 100)}%
              </Badge>

              {/* Open Full Image in New Tab */}
              {currentImageUrl && (
                <Tooltip label="Open full image in new tab" position="bottom" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => window.open(currentImageUrl, "_blank")}
                  >
                    <ExternalLink size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>

          {/* Main Image Display Frame */}
          <Box
            style={{
              position: "relative",
              textAlign: "center",
              borderRadius: 8,
              overflow: "auto",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              maxHeight: isExpanded ? "64vh" : "400px",
              minHeight: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
            }}
          >
            {isImageLoading && (
              <Center style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", zIndex: 2 }}>
                <Loader size="md" color="indigo" />
              </Center>
            )}

            <img
              src={currentImageUrl}
              alt={`Ayat Slide ${formatVerseRef(activeAyatModal.surah_number, activeAyatModal.ayat_number)} - Slide ${safeSlideIndex + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: isExpanded ? "62vh" : "380px",
                objectFit: "contain",
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.15s ease-out",
                cursor: zoomLevel > 1.1 ? "zoom-out" : "zoom-in",
                borderRadius: 4,
              }}
              onClick={toggleImageClickZoom}
              title="Click to toggle zoom (enlarge for visionary clarity)"
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setIsImageLoading(false);
                setImageError(true);
              }}
            />
          </Box>

          {/* Thumbnail Strip when multiple slides exist */}
          {currentSlideList.length > 1 && (
            <Group gap={6} mt={8} justify="center" wrap="wrap">
              {currentSlideList.map((url, sIdx) => {
                const isSelected = safeSlideIndex === sIdx;
                return (
                  <Box
                    key={sIdx}
                    onClick={() => {
                      setActiveSlideIndex(sIdx);
                      setIsImageLoading(true);
                    }}
                    style={{
                      cursor: "pointer",
                      borderRadius: 4,
                      overflow: "hidden",
                      border: isSelected ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                      boxShadow: isSelected ? "0 0 6px rgba(79, 70, 229, 0.45)" : "none",
                      width: 54,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#ffffff",
                      opacity: isSelected ? 1 : 0.7,
                      transition: "all 0.15s ease",
                    }}
                    title={`Slide ${sIdx + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${sIdx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                );
              })}
            </Group>
          )}

          <Text size="10px" c="dimmed" ta="center" mt={4}>
            💡 Tip: Click image or use zoom buttons to enlarge. Toggle Expand icon in top-right for maximum view.
          </Text>
        </Paper>
      );
    }

    // 2. Arabic Text Mode (Default when no image / null provision, or when user toggles to Arabic text)
    return (
      <Paper
        p="md"
        radius="md"
        style={{
          background: isDark ? "rgba(6, 78, 59, 0.15)" : "#f0fdf4",
          border: `1px solid ${isDark ? "#065f46" : "#bbf7d0"}`,
          position: "relative",
        }}
      >
        <Group justify="space-between" align="center" mb={6}>
          <Group gap="xs" align="center">
            <Badge size="xs" color="teal" variant="light">
              Authentic Uthmani Text (Quran API)
            </Badge>

            {hasAyatImage && (
              <Button
                size="compact-xs"
                variant="light"
                color="indigo"
                leftSection={<ImageIcon size={12} />}
                onClick={() => {
                  setViewMode("image");
                  setImageError(false);
                }}
              >
                Show Ayat Slide Image
              </Button>
            )}
          </Group>

          {isFetchingLiveArabic && <Loader size="xs" color="teal" />}
        </Group>

        {imageError && (
          <Alert color="yellow" variant="light" p="xs" mb="xs" radius="sm">
            <Text size="xs">Ayat image could not be loaded. Displaying authentic Arabic calligraphy text instead.</Text>
          </Alert>
        )}

        <Text
          className="arabic-calligraphy"
          style={{
            fontSize: isExpanded ? 32 : 24,
            color: isDark ? "#34d399" : "#065f46",
            lineHeight: 1.8,
            textAlign: "right",
            direction: "rtl",
            padding: "4px 0",
          }}
        >
          {liveArabicText || activeAyatModal.arabic_text || "Loading authentic text from Quran API..."}
        </Text>
      </Paper>
    );
  };

  // Translations, Notes, Questions, and Citations
  const renderDetailContent = () => {
    return (
      <Stack gap="sm">
        {/* Multilingual Translation Tabs */}
        <Tabs defaultValue="english" color="indigo" radius="sm">
          <Tabs.List mb="xs">
            <Tabs.Tab value="english">
              <Text size={isExpanded ? "sm" : "xs"} fw={600}>
                English Translation
              </Text>
            </Tabs.Tab>
            {activeAyatModal.urdu_translation && (
              <Tabs.Tab value="urdu">
                <Text size={isExpanded ? "sm" : "xs"} fw={600}>
                  Urdu Translation
                </Text>
              </Tabs.Tab>
            )}
            {activeAyatModal.hindi_translation && (
              <Tabs.Tab value="hindi">
                <Text size={isExpanded ? "sm" : "xs"} fw={600}>
                  Hindi Translation
                </Text>
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="english">
            <Text
              size={isExpanded ? "sm" : "xs"}
              c={isDark ? "gray.2" : "dark.7"}
              style={{ lineHeight: 1.7, fontSize: isExpanded ? 15 : 13 }}
            >
              {activeAyatModal.english_translation || "No English translation provided."}
            </Text>
          </Tabs.Panel>

          {activeAyatModal.urdu_translation && (
            <Tabs.Panel value="urdu">
              <Text
                className="urdu-calligraphy"
                size={isExpanded ? "sm" : "xs"}
                c={isDark ? "gray.2" : "dark.7"}
                style={{ lineHeight: 1.8, fontSize: isExpanded ? 16 : 14, direction: "rtl", textAlign: "right" }}
              >
                {activeAyatModal.urdu_translation}
              </Text>
            </Tabs.Panel>
          )}

          {activeAyatModal.hindi_translation && (
            <Tabs.Panel value="hindi">
              <Text
                size={isExpanded ? "sm" : "xs"}
                c={isDark ? "gray.2" : "dark.7"}
                style={{ lineHeight: 1.7, fontSize: isExpanded ? 15 : 13 }}
              >
                {activeAyatModal.hindi_translation}
              </Text>
            </Tabs.Panel>
          )}
        </Tabs>

        {/* Lecture Points / Notes */}
        {(activeAyatModal.points_notes_eng ||
          activeAyatModal.points_notes_urdu ||
          activeAyatModal.points_notes) && (
          <Paper
            p={isExpanded ? "sm" : "xs"}
            radius="sm"
            style={{
              background: isDark ? "rgba(245, 158, 11, 0.12)" : "#fef3c7",
              borderLeft: "4px solid #f59e0b",
            }}
          >
            <Text size={isExpanded ? "sm" : "xs"} fw={700} c={isDark ? "yellow.3" : "dark.8"} mb={2}>
              💡 Lecture Notes & Explanations:
            </Text>
            <Text
              size={isExpanded ? "sm" : "xs"}
              c={isDark ? "gray.3" : "dark.7"}
              style={{ fontSize: isExpanded ? 14 : 12, lineHeight: 1.6 }}
            >
              {activeAyatModal.points_notes_eng ||
                activeAyatModal.points_notes_urdu ||
                activeAyatModal.points_notes}
            </Text>
          </Paper>
        )}

        {/* Question & Answer if any */}
        {activeAyatModal.quest_answer && activeAyatModal.question_text && (
          <Paper
            p={isExpanded ? "sm" : "xs"}
            radius="sm"
            style={{
              background: isDark ? "rgba(59, 130, 246, 0.12)" : "#eff6ff",
              borderLeft: "4px solid #3b82f6",
            }}
          >
            <Text size={isExpanded ? "sm" : "xs"} fw={700} c={isDark ? "blue.3" : "blue.9"} mb={2}>
              ❓ Question Addressed in Lecture:
            </Text>
            <Text
              size={isExpanded ? "sm" : "xs"}
              c={isDark ? "gray.3" : "dark.7"}
              style={{ fontSize: isExpanded ? 14 : 12, lineHeight: 1.6 }}
            >
              {activeAyatModal.question_text}
            </Text>
          </Paper>
        )}

        {/* Cited in Lectures & Categories (Both English & Urdu) */}
        {citations.length > 0 && (
          <Paper
            p="sm"
            radius="md"
            withBorder
            style={{
              background: isDark ? "#141517" : "#f8fafc",
              borderColor: isDark ? "#2c2e33" : "#e2e8f0",
            }}
          >
            <Group justify="space-between" mb="xs">
              <Group gap={6}>
                <Layers size={14} color="#4f46e5" />
                <Text size={isExpanded ? "sm" : "xs"} fw={800} c={isDark ? "white" : "dark.8"}>
                  Cited in {citations.length} Lecture{citations.length === 1 ? "" : "s"} across Categories (English & Urdu):
                </Text>
              </Group>
              <Badge size="xs" color="indigo" variant="light">
                Lectures & Clips
              </Badge>
            </Group>

            <Stack gap="xs" style={{ maxHeight: isExpanded ? 320 : 220, overflowY: "auto", paddingRight: 4 }}>
              {citations.map((cite, cIdx) => {
                const isEnglish = cite.language === "eng";
                const isUrdu = cite.language === "urdu";
                const langLabel = isEnglish ? "English" : isUrdu ? "Urdu" : cite.language;
                const langColor = isEnglish ? "blue" : isUrdu ? "green" : "orange";

                return (
                  <Paper
                    key={cIdx}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{ background: isDark ? "#1e1f23" : "#ffffff" }}
                  >
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
                        <Text size={isExpanded ? "sm" : "xs"} fw={700} lineClamp={1}>
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
        )}
      </Stack>
    );
  };

  return (
    <Modal
      opened={!!activeAyatModal}
      onClose={onClose}
      title={
        <Group justify="space-between" align="center" style={{ width: "100%" }} pr="xs">
          <Group gap="xs">
            <Badge
              color="indigo"
              size={isExpanded ? "lg" : "md"}
              variant="filled"
              style={{ fontFamily: "monospace", fontWeight: 800 }}
            >
              {formatVerseRef(activeAyatModal.surah_number, activeAyatModal.ayat_number)}
            </Badge>
            <Text fw={700} size={isExpanded ? "md" : "sm"}>
              {activeAyatModal.surah_name || `Surah ${activeAyatModal.surah_number}`}
            </Text>
            {hasAyatImage && (
              <Badge size="xs" color="teal" variant="light" leftSection={<ImageIcon size={11} />}>
                Ayat Slide ({currentSlideList.length})
              </Badge>
            )}
          </Group>

          {/* Expand / Visionary Aid Enlarge Toggle */}
          <Tooltip
            label={
              isExpanded
                ? "Collapse Dialog (Standard view)"
                : "Expand Dialog (Enlarge for visionary aid)"
            }
            withArrow
            position="bottom"
          >
            <ActionIcon
              variant={isExpanded ? "filled" : "light"}
              color="indigo"
              size={isExpanded ? "md" : "sm"}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label="Expand dialog"
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      }
      size={isExpanded ? "95vw" : "lg"}
      centered
      radius="md"
      styles={{
        header: {
          borderBottom: isDark ? "1px solid #2c2e33" : "1px solid #e2e8f0",
          paddingBottom: 10,
        },
        body: {
          padding: isExpanded ? 20 : 14,
          maxHeight: isExpanded ? "88vh" : "80vh",
          overflowY: "auto",
        },
      }}
    >
      {/* If Expanded on wide screen, render 2-column layout; otherwise render clean stacked layout */}
      {isExpanded ? (
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Column 1: Visual Slide / Calligraphy (Enlarged) */}
          <Box style={{ minWidth: 0 }}>
            {renderVisualContent()}
          </Box>

          {/* Column 2: Text details, translations, notes, and citations */}
          <Box style={{ minWidth: 0 }}>
            {renderDetailContent()}
          </Box>
        </Box>
      ) : (
        /* Standard Stacked View */
        <Stack gap="sm">
          {renderVisualContent()}
          {renderDetailContent()}
        </Stack>
      )}
    </Modal>
  );
}
