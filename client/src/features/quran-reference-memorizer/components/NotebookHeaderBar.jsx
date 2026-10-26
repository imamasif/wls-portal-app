import React from "react";
import {
  Group,
  Box,
  Title,
  Text,
  Badge,
  SegmentedControl,
  ActionIcon,
  Paper,
  Button,
  TextInput,
  Select,
} from "@mantine/core";
import {
  IconBook,
  IconSun,
  IconMoon,
  IconPrinter,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { SURAH_LIST } from "../../../components/common/QuranVersePicker";

export function NotebookHeaderBar({
  isDark,
  toggleColorScheme,
  metaCategories,
  activeLanguage,
  onLanguageChange,
  searchQuery,
  setSearchQuery,
  filterSurah,
  setFilterSurah,
  filterAyat,
  setFilterAyat,
  filterAyatOptions,
  sortField,
  setSortField,
  hasActiveFilters,
  onClearFilters,
  viewMode,
  setViewMode,
}) {
  return (
    <>
      {/* Top Header Banner */}
      <Group justify="space-between" align="center" mb="md" px="xs">
        <Group gap="md">
          <Box
            style={{
              width: 50,
              height: 50,
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #059669 100%)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 6px 18px rgba(37, 99, 235, 0.4)",
            }}
          >
            <IconBook size={28} />
          </Box>
          <div>
            <Group gap="xs">
              <Title order={2} c={isDark ? "white" : "dark.8"} style={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                Quran Lecture Index Notebook
              </Title>
              <Badge variant="gradient" gradient={{ from: "indigo", to: "teal" }} size="sm">
                Excel Tabular Reference
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Choose Language Tag ➔ Pick Category ➔ Select Lecture ➔ Browse Tabular Verses with Live Quran API & Video Clips.
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { value: "NOTEBOOK", label: "📖 Category & Lecture Index" },
              { value: "CONCORDANCE", label: "📜 114-Surah Sequence" },
            ]}
            color="indigo"
            radius="xl"
            size="xs"
          />

          <ActionIcon variant="default" radius="xl" size={36} onClick={() => toggleColorScheme()} title="Toggle theme">
            {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
          </ActionIcon>

          <ActionIcon variant="default" radius="xl" size={36} onClick={() => window.print()} title="Print Notebook">
            <IconPrinter size={16} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Top Aligned Search, Filter & Language Tags Bar */}
      <Paper p="sm" radius="lg" withBorder mb="lg" shadow="xs" style={{ background: isDark ? "#25262b" : "#ffffff" }}>
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
          {/* Prominent Language Tags */}
          <div>
            <Text size="11px" fw={700} c="dimmed" mb={4}>
              SELECT LANGUAGE:
            </Text>
            <Group gap={6}>
              {[
                { id: "eng", label: "📘 English", count: metaCategories.filter((c) => (c.language || "eng").toLowerCase() === "eng").length },
                { id: "urdu", label: "📗 Urdu", count: metaCategories.filter((c) => (c.language || "eng").toLowerCase() === "urdu").length },
                { id: "hindi", label: "📙 Hindi", count: metaCategories.filter((c) => (c.language || "eng").toLowerCase() === "hindi").length },
              ].map((lang) => {
                const isSelected = activeLanguage === lang.id;
                return (
                  <Button
                    key={lang.id}
                    size="xs"
                    radius="xl"
                    onClick={() => onLanguageChange(lang.id)}
                    style={{
                      backgroundColor: isSelected ? "#facc15" : isDark ? "#374151" : "#f1f5f9",
                      color: isSelected ? "#000000" : isDark ? "#f3f4f6" : "#4b5563",
                      fontWeight: isSelected ? 800 : 600,
                      boxShadow: isSelected ? "0 4px 12px rgba(250, 204, 21, 0.45)" : "none",
                      border: isSelected ? "2px solid #ca8a04" : "1px solid #d1d5db",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {lang.label} ({lang.count})
                  </Button>
                );
              })}
            </Group>
          </div>

          {/* Search Input: Supports SurahNumber:ayatnumber (e.g. 2:53) or Range (e.g. 2:50-60) */}
          <TextInput
            placeholder="Search keyword, or Surah#:Ayat# (e.g. 2:53 or 2:50-60)..."
            leftSection={<IconSearch size={15} color="var(--mantine-color-dimmed)" />}
            rightSection={
              searchQuery ? (
                <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchQuery("")}>
                  <IconX size={12} />
                </ActionIcon>
              ) : null
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: 260, flex: 1.5 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Surah Filter"
            placeholder="All 114 Surahs"
            data={SURAH_LIST}
            clearable
            searchable
            value={filterSurah}
            onChange={(val) => {
              setFilterSurah(val || "");
              setFilterAyat("");
            }}
            style={{ width: 175 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Ayat Filter"
            placeholder={filterSurah ? "Ayat..." : "Pick Surah"}
            disabled={!filterSurah}
            data={filterAyatOptions}
            clearable
            searchable
            value={filterAyat}
            onChange={(val) => setFilterAyat(val || "")}
            style={{ width: 105 }}
            radius="md"
            size="xs"
          />

          <Select
            label="Sort By"
            data={[
              { value: "SURAH_THEN_AYAT", label: "Surah then Ayat (Asc)" },
              { value: "SURAH_ASC", label: "Surah Number (1 ➔ 114)" },
              { value: "SURAH_DESC", label: "Surah Number (114 ➔ 1)" },
              { value: "AYAT_ASC", label: "Ayat Number (1 ➔ N)" },
              { value: "AYAT_DESC", label: "Ayat Number (N ➔ 1)" },
            ]}
            value={sortField}
            onChange={(val) => setSortField(val || "SURAH_THEN_AYAT")}
            style={{ width: 180 }}
            radius="md"
            size="xs"
          />

          {hasActiveFilters && (
            <Button variant="light" color="gray" size="xs" radius="md" leftSection={<IconX size={14} />} onClick={onClearFilters}>
              Clear
            </Button>
          )}
        </Group>
      </Paper>
    </>
  );
}
