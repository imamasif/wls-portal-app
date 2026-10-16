// client/src/features/quran-reference-memorizer/components/AyatManagerView.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  Select,
  TextInput,
  Textarea,
  Switch,
  Group,
  Stack,
  Badge,
  Card,
  Modal,
  Table,
  Pagination,
  Loader,
  ActionIcon,
  Tooltip,
  Paper,
  Tabs,
  Divider,
  Alert,
} from "@mantine/core";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconDatabase,
  IconCheck,
  IconAlertCircle,
  IconSparkles,
  IconBrandYoutube,
  IconFileText,
  IconHelpCircle,
  IconLink,
} from "@tabler/icons-react";
import { SURAH_LIST } from "../../../components/common/QuranVersePicker";
import {
  fetchAyats,
  createAyat,
  updateAyat,
  deleteAyat,
  fetchQuranVerseFromProxy,
} from "../api/ayatsApi";

const INITIAL_FORM = {
  category_id_ref: "",
  lecture_id: "",
  surah_number: 1,
  surah_name: "Al-Fatihah",
  ayat_number: 1,
  arabic_text: "",
  english_translation: "",
  urdu_translation: "",
  hindi_translation: "",
  points_notes_eng: "",
  points_notes_urdu: "",
  points_notes_hindi: "",
  quest_answer: false,
  question_text: "",
  video_url_eng: "",
  youtube_url_eng: "",
  facebook_url_eng: "",
  video_url_urdu: "",
  youtube_url_urdu: "",
  facebook_url_urdu: "",
  ayat_image_eng_url: "",
  ayat_image_urdu_url: "",
  ayat_image_hindi_url: "",
};

export function AyatManagerView({ user }) {
  // Data list state
  const [ayatsList, setAyatsList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("");
  const [selectedFilterLecture, setSelectedFilterLecture] = useState("");

  // Meta Categories state (for cascading dropdowns)
  const [metaCategories, setMetaCategories] = useState([]);

  // Modal State: "CLOSED" | "CREATE" | "EDIT"
  const [modalMode, setModalMode] = useState(null);
  const [currentEditingId, setCurrentEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingFromApi, setIsFetchingFromApi] = useState(false);
  const [formError, setFormError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Delete confirmation modal
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Meta Categories for select dropdowns
  useEffect(() => {
    fetch("/api/category-lectures/meta")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMetaCategories(data);
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  // Fetch Ayats with current filters and pagination
  const loadAyats = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await fetchAyats({
        page,
        limit: 15,
        search: searchQuery,
        categoryId: selectedFilterCategory,
        lectureId: selectedFilterLecture,
      });

      setAyatsList(data.items || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || 1);
    } catch (err) {
      console.error("Error loading ayats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAyats(currentPage);
  }, [currentPage, selectedFilterCategory, selectedFilterLecture]);

  // Handle Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAyats(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedFilterCategory("");
    setSelectedFilterLecture("");
    setCurrentPage(1);
  };

  // Category options for dropdowns
  const categoryOptions = useMemo(() => {
    return metaCategories.map((c) => {
      const id = String(c._id || c.category_id);
      const isUrdu = (c.language || "eng").toLowerCase() === "urdu";
      return {
        value: id,
        label: `${c.category_name} (${isUrdu ? "Urdu" : "Eng"})`,
      };
    });
  }, [metaCategories]);

  // Filter Lectures based on selected category in Filter bar
  const filterLectureOptions = useMemo(() => {
    if (!selectedFilterCategory) {
      return metaCategories.flatMap((c) =>
        (c.lectures || []).map((l) => ({
          value: String(l._id || l.id || l.lecture_id),
          label: `${l.lecture_name} (${c.category_name})`,
        }))
      );
    }
    const cat = metaCategories.find(
      (c) => String(c._id) === selectedFilterCategory || String(c.category_id) === selectedFilterCategory
    );
    if (!cat) return [];
    return (cat.lectures || []).map((l) => ({
      value: String(l._id || l.id || l.lecture_id),
      label: `${l.lecture_name} (Lec ${l.lecture_id})`,
    }));
  }, [selectedFilterCategory, metaCategories]);

  // Lectures for Modal Form based on formData.category_id_ref
  const modalLectureOptions = useMemo(() => {
    if (!formData.category_id_ref) {
      return metaCategories.flatMap((c) =>
        (c.lectures || []).map((l) => ({
          value: String(l._id || l.id || l.lecture_id),
          label: `${l.lecture_name} (${c.category_name})`,
        }))
      );
    }
    const cat = metaCategories.find(
      (c) =>
        String(c._id) === String(formData.category_id_ref) ||
        String(c.category_id) === String(formData.category_id_ref)
    );
    if (!cat) return [];
    return (cat.lectures || []).map((l) => ({
      value: String(l._id || l.id || l.lecture_id),
      label: `${l.lecture_name} (Lec ${l.lecture_id})`,
    }));
  }, [formData.category_id_ref, metaCategories]);

  // Surah Options from SURAH_LIST
  const surahOptions = useMemo(() => {
    return SURAH_LIST.map((s) => ({
      value: s.value,
      label: s.label,
    }));
  }, []);

  // Update Surah and auto-populate surah_name
  const handleSurahChange = (val) => {
    const num = Number(val) || 1;
    const match = SURAH_LIST.find((s) => s.value === String(num));
    const name = match ? match.label.split(". ")[1]?.split(" (")[0] || "" : `Surah ${num}`;
    setFormData((prev) => ({
      ...prev,
      surah_number: num,
      surah_name: name,
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      ...INITIAL_FORM,
      category_id_ref: selectedFilterCategory || (metaCategories[0] ? String(metaCategories[0]._id || metaCategories[0].category_id) : ""),
    });
    setFormError("");
    setModalMode("CREATE");
    setCurrentEditingId(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setFormData({
      category_id_ref: String(item.category_id_ref || ""),
      lecture_id: String(item.lecture_id || ""),
      surah_number: Number(item.surah_number) || 1,
      surah_name: item.surah_name || "",
      ayat_number: Number(item.ayat_number) || 1,
      arabic_text: item.arabic_text || "",
      english_translation: item.english_translation || "",
      urdu_translation: item.urdu_translation || "",
      hindi_translation: item.hindi_translation || "",
      points_notes_eng: item.points_notes_eng || "",
      points_notes_urdu: item.points_notes_urdu || "",
      points_notes_hindi: item.points_notes_hindi || "",
      quest_answer: Boolean(item.quest_answer),
      question_text: item.question_text || "",
      video_url_eng: item.video_url_eng || "",
      youtube_url_eng: item.youtube_url_eng || "",
      facebook_url_eng: item.facebook_url_eng || "",
      video_url_urdu: item.video_url_urdu || "",
      youtube_url_urdu: item.youtube_url_urdu || "",
      facebook_url_urdu: item.facebook_url_urdu || "",
      ayat_image_eng_url: item.ayat_image_eng_url || "",
      ayat_image_urdu_url: item.ayat_image_urdu_url || "",
      ayat_image_hindi_url: item.ayat_image_hindi_url || "",
    });
    setFormError("");
    setCurrentEditingId(item._id);
    setModalMode("EDIT");
  };

  // Auto-Fetch text from Quran API proxy
  const handleAutoFetchQuranApi = async () => {
    if (!formData.surah_number || !formData.ayat_number) return;
    setIsFetchingFromApi(true);
    setFormError("");
    try {
      const data = await fetchQuranVerseFromProxy(
        formData.surah_number,
        formData.ayat_number
      );
      if (data) {
        setFormData((prev) => ({
          ...prev,
          arabic_text: data.arabic || prev.arabic_text,
          english_translation: data.english || prev.english_translation,
          urdu_translation: data.urdu || prev.urdu_translation,
          surah_name: data.surahName || prev.surah_name,
        }));
      }
    } catch (err) {
      setFormError(`Quran API fetch error: ${err.message}`);
    } finally {
      setIsFetchingFromApi(false);
    }
  };

  // Submit Create or Update
  const handleSaveAyat = async () => {
    if (!formData.lecture_id) {
      setFormError("Please select a target lecture.");
      return;
    }
    if (!formData.surah_number || !formData.ayat_number) {
      setFormError("Surah number and Ayat number are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      if (modalMode === "CREATE") {
        await createAyat(formData);
        setSuccessNotice("New Ayat reference successfully added!");
      } else if (modalMode === "EDIT" && currentEditingId) {
        await updateAyat(currentEditingId, formData);
        setSuccessNotice("Ayat reference successfully updated!");
      }

      setModalMode(null);
      loadAyats(currentPage);
      setTimeout(() => setSuccessNotice(""), 3500);
    } catch (err) {
      setFormError(err.message || "Failed to save Ayat reference.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteAyat(deleteCandidate._id);
      setDeleteCandidate(null);
      setSuccessNotice("Ayat record deleted successfully.");
      loadAyats(currentPage);
      setTimeout(() => setSuccessNotice(""), 3500);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container size="xl" py="lg">
      <style>{`
        .arabic-preview {
          font-family: 'Amiri', 'Traditional Arabic', 'Scheherazade New', serif;
          font-size: 18px;
          line-height: 1.8;
          direction: rtl;
          text-align: right;
        }
        .urdu-text {
          font-family: 'Nafees', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif;
          direction: rtl;
          text-align: right;
        }
      `}</style>

      {/* Header Banner */}
      <Paper
        p="lg"
        radius="lg"
        mb="lg"
        style={{
          background: "linear-gradient(135deg, #09203f 0%, #537895 100%)",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="md">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(5px)",
              }}
            >
              <IconDatabase size={26} color="white" />
            </div>
            <div>
              <Group gap="xs">
                <Title order={2} style={{ color: "#ffffff", fontWeight: 700 }}>
                  Ayats Database Studio
                </Title>
                <Badge color="yellow" variant="filled" size="sm">
                  Super User Only
                </Badge>
              </Group>
              <Text size="xs" style={{ color: "#e2e8f0" }}>
                Add, inspect, enrich translations & notes, and patch MongoDB records in the `ayats` collection.
              </Text>
            </div>
          </Group>

          <Button
            color="teal"
            size="sm"
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenCreate}
            style={{ boxShadow: "0 4px 12px rgba(20, 184, 166, 0.4)" }}
          >
            Add New Ayat Reference
          </Button>
        </Group>
      </Paper>

      {/* Toast Notice */}
      {successNotice && (
        <Alert
          icon={<IconCheck size={16} />}
          title="Operation Succeeded"
          color="teal"
          radius="md"
          mb="md"
          withCloseButton
          onClose={() => setSuccessNotice("")}
        >
          {successNotice}
        </Alert>
      )}

      {/* Filter and Search Card */}
      <Card withBorder radius="md" p="md" mb="md" shadow="xs">
        <form onSubmit={handleSearch}>
          <Group align="flex-end" gap="sm" wrap="wrap">
            <TextInput
              label="Keyword Search"
              placeholder="Search translation, surah, notes..."
              leftSection={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: 220, flex: 1 }}
              size="xs"
            />

            <Select
              label="Filter by Category"
              placeholder="All Categories"
              data={categoryOptions}
              clearable
              searchable
              value={selectedFilterCategory}
              onChange={(val) => {
                setSelectedFilterCategory(val || "");
                setSelectedFilterLecture("");
                setCurrentPage(1);
              }}
              style={{ minWidth: 200 }}
              size="xs"
            />

            <Select
              label="Filter by Lecture"
              placeholder={selectedFilterCategory ? "All Lectures in Category" : "All Lectures"}
              data={filterLectureOptions}
              clearable
              searchable
              value={selectedFilterLecture}
              onChange={(val) => {
                setSelectedFilterLecture(val || "");
                setCurrentPage(1);
              }}
              style={{ minWidth: 220 }}
              size="xs"
            />

            <Button type="submit" color="indigo" size="xs" leftSection={<IconSearch size={14} />}>
              Filter
            </Button>

            {(searchQuery || selectedFilterCategory || selectedFilterLecture) && (
              <Button variant="subtle" color="gray" size="xs" leftSection={<IconRefresh size={14} />} onClick={handleResetFilters}>
                Reset
              </Button>
            )}
          </Group>
        </form>
      </Card>

      {/* Main Table Card */}
      <Card withBorder radius="md" p="0" shadow="xs" style={{ overflow: "hidden" }}>
        <Group justify="space-between" p="md" style={{ borderBottom: "1px solid #e2e8f0" }}>
          <Group gap="xs">
            <Text fw={700} size="sm" c="dark.7">
              Ayats Collection Records
            </Text>
            <Badge color="gray" variant="light" size="sm">
              Total {totalCount.toLocaleString()} Records
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Showing Page {currentPage} of {totalPages}
          </Text>
        </Group>

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="md" color="indigo" />
            <Text size="sm" c="dimmed">
              Loading Ayats Records...
            </Text>
          </Group>
        ) : ayatsList.length === 0 ? (
          <Stack align="center" py="xl">
            <IconAlertCircle size={36} color="gray" />
            <Text size="sm" c="dimmed">
              No Ayat records found matching your filters.
            </Text>
          </Stack>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
              <Table.Thead style={{ background: "#f8fafc" }}>
                <Table.Tr>
                  <Table.Th style={{ width: 150 }}>Verse</Table.Th>
                  <Table.Th style={{ width: 220 }}>Category & Lecture</Table.Th>
                  <Table.Th>Arabic & Translation Snippet</Table.Th>
                  <Table.Th style={{ width: 140 }}>Enrichment</Table.Th>
                  <Table.Th style={{ width: 90, textAlign: "right" }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ayatsList.map((item) => {
                  const hasVideo =
                    item.video_url_eng ||
                    item.youtube_url_eng ||
                    item.video_url_urdu ||
                    item.youtube_url_urdu;
                  const hasNotes = item.points_notes_eng || item.points_notes_urdu;
                  const hasQA = item.quest_answer && item.question_text;

                  return (
                    <Table.Tr key={item._id}>
                      <Table.Td>
                        <Badge color="teal" size="sm" variant="light">
                          {item.surah_name || `Surah ${item.surah_number}`}
                        </Badge>
                        <Text fw={700} size="xs" c="dark.8" mt={2}>
                          {item.surah_number} : {item.ayat_number}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Text size="xs" fw={600} c="dark.7" lineClamp={1}>
                          {item.lecture_name || `Lecture ID: ${item.lecture_id}`}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {item.category_name || "Category Ref"}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        {item.arabic_text && (
                          <Text className="arabic-preview" lineClamp={1} style={{ fontSize: 14, color: "#065f46" }}>
                            {item.arabic_text}
                          </Text>
                        )}
                        <Text size="xs" c="dark.6" lineClamp={1}>
                          {item.english_translation || item.urdu_translation || "No translation"}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Group gap={4}>
                          {hasVideo && (
                            <Tooltip label="Video clip linked">
                              <Badge size="xs" color="red" variant="light">
                                <IconBrandYoutube size={11} style={{ marginRight: 2 }} />
                                Video
                              </Badge>
                            </Tooltip>
                          )}
                          {hasNotes && (
                            <Tooltip label="Notes / Points recorded">
                              <Badge size="xs" color="yellow" variant="light">
                                <IconFileText size={11} style={{ marginRight: 2 }} />
                                Notes
                              </Badge>
                            </Tooltip>
                          )}
                          {hasQA && (
                            <Tooltip label="Q&A Attached">
                              <Badge size="xs" color="blue" variant="light">
                                <IconHelpCircle size={11} style={{ marginRight: 2 }} />
                                Q&A
                              </Badge>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>

                      <Table.Td style={{ textAlign: "right" }}>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label="Edit / Enrich Ayat Record">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <IconPencil size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Record">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="red"
                              onClick={() => setDeleteCandidate(item)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <Group justify="center" p="md" style={{ borderTop: "1px solid #e2e8f0" }}>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              color="indigo"
              size="sm"
            />
          </Group>
        )}
      </Card>

      {/* CREATE / EDIT AYAT MODAL */}
      <Modal
        opened={!!modalMode}
        onClose={() => setModalMode(null)}
        title={
          <Group gap="xs">
            <IconDatabase size={18} color="teal" />
            <Text fw={700} size="sm">
              {modalMode === "CREATE" ? "Create New Ayat Reference" : "Edit / Patch Ayat Record"}
            </Text>
          </Group>
        }
        size="xl"
        centered
      >
        <Stack gap="sm">
          {formError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
              {formError}
            </Alert>
          )}

          {/* 1. Category and Lecture Selection */}
          <Group grow align="flex-start">
            <Select
              label="Category"
              description="Pick category from loaded database"
              placeholder="Choose category..."
              data={categoryOptions}
              value={formData.category_id_ref}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  category_id_ref: val || "",
                  lecture_id: "",
                }))
              }
              searchable
              required
            />

            <Select
              label="Lecture"
              description="Pick lecture inside selected category"
              placeholder="Choose lecture..."
              data={modalLectureOptions}
              value={formData.lecture_id}
              onChange={(val) => setFormData((prev) => ({ ...prev, lecture_id: val || "" }))}
              searchable
              required
            />
          </Group>

          {/* 2. Surah & Ayat Number */}
          <Group align="flex-end" grow>
            <Select
              label="Surah"
              placeholder="Select Surah..."
              data={surahOptions}
              value={String(formData.surah_number)}
              onChange={handleSurahChange}
              searchable
              required
              style={{ flex: 2 }}
            />

            <TextInput
              label="Surah Name"
              placeholder="Auto-populated"
              value={formData.surah_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, surah_name: e.target.value }))}
              style={{ flex: 1.5 }}
            />

            <TextInput
              label="Ayat Number"
              placeholder="e.g. 255"
              type="number"
              min={1}
              value={formData.ayat_number}
              onChange={(e) => setFormData((prev) => ({ ...prev, ayat_number: Number(e.target.value) || 1 }))}
              style={{ flex: 1 }}
              required
            />

            <Button
              variant="light"
              color="teal"
              leftSection={<IconSparkles size={16} />}
              loading={isFetchingFromApi}
              onClick={handleAutoFetchQuranApi}
              style={{ height: 36 }}
            >
              Auto-Fill Text
            </Button>
          </Group>

          {/* 3. Arabic Text */}
          <Textarea
            label="Arabic Text"
            placeholder="أدخل النص القرآني بالعربية..."
            minRows={2}
            autosize
            value={formData.arabic_text}
            onChange={(e) => setFormData((prev) => ({ ...prev, arabic_text: e.target.value }))}
            styles={{
              input: {
                fontFamily: "'Amiri', 'Traditional Arabic', serif",
                fontSize: 18,
                direction: "rtl",
                textAlign: "right",
              },
            }}
          />

          {/* 4. Translations Tabs */}
          <Divider label="Multilingual Translations" labelPosition="center" my="xs" />
          <Tabs defaultValue="english" color="teal">
            <Tabs.List mb="xs">
              <Tabs.Tab value="english">English Translation</Tabs.Tab>
              <Tabs.Tab value="urdu">Urdu Translation</Tabs.Tab>
              <Tabs.Tab value="hindi">Hindi Translation</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="english">
              <Textarea
                placeholder="Enter English translation..."
                minRows={2}
                autosize
                value={formData.english_translation}
                onChange={(e) => setFormData((prev) => ({ ...prev, english_translation: e.target.value }))}
              />
            </Tabs.Panel>

            <Tabs.Panel value="urdu">
              <Textarea
                placeholder="اردو ترجمہ یہاں درج کریں..."
                minRows={2}
                autosize
                value={formData.urdu_translation}
                onChange={(e) => setFormData((prev) => ({ ...prev, urdu_translation: e.target.value }))}
                styles={{
                  input: {
                    fontFamily: "'Nafees', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                    direction: "rtl",
                    textAlign: "right",
                  },
                }}
              />
            </Tabs.Panel>

            <Tabs.Panel value="hindi">
              <Textarea
                placeholder="हिंदी अनुवाद दर्ज करें..."
                minRows={2}
                autosize
                value={formData.hindi_translation}
                onChange={(e) => setFormData((prev) => ({ ...prev, hindi_translation: e.target.value }))}
              />
            </Tabs.Panel>
          </Tabs>

          {/* 5. Lecture Points & Notes Tabs */}
          <Divider label="Lecture Points & Key Notes" labelPosition="center" my="xs" />
          <Tabs defaultValue="notes_eng" color="indigo">
            <Tabs.List mb="xs">
              <Tabs.Tab value="notes_eng">English Points / Notes</Tabs.Tab>
              <Tabs.Tab value="notes_urdu">Urdu Points / Notes</Tabs.Tab>
              <Tabs.Tab value="notes_hindi">Hindi Points / Notes</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="notes_eng">
              <Textarea
                placeholder="Key takeaways, context, or explanations delivered during the lecture..."
                minRows={2}
                autosize
                value={formData.points_notes_eng}
                onChange={(e) => setFormData((prev) => ({ ...prev, points_notes_eng: e.target.value }))}
              />
            </Tabs.Panel>

            <Tabs.Panel value="notes_urdu">
              <Textarea
                placeholder="لیکچر کے اہم نکات اور وضاحت..."
                minRows={2}
                autosize
                value={formData.points_notes_urdu}
                onChange={(e) => setFormData((prev) => ({ ...prev, points_notes_urdu: e.target.value }))}
                styles={{
                  input: {
                    fontFamily: "'Nafees', 'Jameel Noori Nastaleeq', 'Urdu Typesetting', serif",
                    direction: "rtl",
                    textAlign: "right",
                  },
                }}
              />
            </Tabs.Panel>

            <Tabs.Panel value="notes_hindi">
              <Textarea
                placeholder="व्याख्यान के मुख्य बिंदु..."
                minRows={2}
                autosize
                value={formData.points_notes_hindi}
                onChange={(e) => setFormData((prev) => ({ ...prev, points_notes_hindi: e.target.value }))}
              />
            </Tabs.Panel>
          </Tabs>

          {/* 6. Question / Answer Section */}
          <Divider label="Question & Answer (Optional)" labelPosition="center" my="xs" />
          <Switch
            label="Is this verse part of a Q&A session?"
            checked={formData.quest_answer}
            onChange={(e) => setFormData((prev) => ({ ...prev, quest_answer: e.currentTarget.checked }))}
            color="teal"
          />

          {formData.quest_answer && (
            <Textarea
              label="Question Text"
              placeholder="Question asked about this ayah..."
              minRows={2}
              autosize
              value={formData.question_text}
              onChange={(e) => setFormData((prev) => ({ ...prev, question_text: e.target.value }))}
            />
          )}

          {/* 7. Video Links Section */}
          <Divider label="Video & Clip Links" labelPosition="center" my="xs" />
          <Group grow>
            <TextInput
              label="English Video URL"
              placeholder="https://..."
              value={formData.video_url_eng}
              onChange={(e) => setFormData((prev) => ({ ...prev, video_url_eng: e.target.value }))}
            />
            <TextInput
              label="English YouTube URL"
              placeholder="https://youtube.com/..."
              value={formData.youtube_url_eng}
              onChange={(e) => setFormData((prev) => ({ ...prev, youtube_url_eng: e.target.value }))}
            />
            <TextInput
              label="English Facebook URL"
              placeholder="https://facebook.com/..."
              value={formData.facebook_url_eng}
              onChange={(e) => setFormData((prev) => ({ ...prev, facebook_url_eng: e.target.value }))}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Urdu Video URL"
              placeholder="https://..."
              value={formData.video_url_urdu}
              onChange={(e) => setFormData((prev) => ({ ...prev, video_url_urdu: e.target.value }))}
            />
            <TextInput
              label="Urdu YouTube URL"
              placeholder="https://youtube.com/..."
              value={formData.youtube_url_urdu}
              onChange={(e) => setFormData((prev) => ({ ...prev, youtube_url_urdu: e.target.value }))}
            />
            <TextInput
              label="Urdu Facebook URL"
              placeholder="https://facebook.com/..."
              value={formData.facebook_url_urdu}
              onChange={(e) => setFormData((prev) => ({ ...prev, facebook_url_urdu: e.target.value }))}
            />
          </Group>

          {/* 8. Image URLs */}
          <Divider label="Ayat Card Image URLs" labelPosition="center" my="xs" />
          <Group grow>
            <TextInput
              label="English Card Image URL"
              placeholder="https://...image.jpg"
              value={formData.ayat_image_eng_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, ayat_image_eng_url: e.target.value }))}
            />
            <TextInput
              label="Urdu Card Image URL"
              placeholder="https://...image.jpg"
              value={formData.ayat_image_urdu_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, ayat_image_urdu_url: e.target.value }))}
            />
            <TextInput
              label="Hindi Card Image URL"
              placeholder="https://...image.jpg"
              value={formData.ayat_image_hindi_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, ayat_image_hindi_url: e.target.value }))}
            />
          </Group>

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalMode(null)}>
              Cancel
            </Button>
            <Button color="teal" loading={isSubmitting} onClick={handleSaveAyat}>
              {modalMode === "CREATE" ? "Create Ayat Record" : "Save Changes"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        opened={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="Confirm Ayat Deletion"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this Ayat record for{" "}
            <strong>
              {deleteCandidate?.surah_name || `Surah ${deleteCandidate?.surah_number}`}{" "}
              {deleteCandidate?.surah_number}:{deleteCandidate?.ayat_number}
            </strong>
            ? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" size="xs" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </Button>
            <Button color="red" size="xs" loading={isDeleting} onClick={handleConfirmDelete}>
              Delete Permanently
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
