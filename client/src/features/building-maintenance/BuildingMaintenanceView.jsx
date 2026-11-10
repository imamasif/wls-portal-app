import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Grid,
  ThemeIcon,
  Table,
  Select,
  TextInput,
  Textarea,
  ActionIcon,
  Progress,
  Tooltip,
  Alert,
  LoadingOverlay,
  Box,
  Divider,
  SegmentedControl,
  Tabs,
} from "@mantine/core";
import {
  IconTools,
  IconBuildingBank,
  IconCalendar,
  IconClock,
  IconUserCheck,
  IconFileTypePdf,
  IconBrandGoogleDrive,
  IconPlus,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconDeviceFloppy,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconCircleCheck,
  IconCircleMinus,
  IconExternalLink,
  IconHistory,
  IconChecklist,
  IconNotes,
} from "@tabler/icons-react";
import { buildingMaintenanceApi } from "./api/buildingMaintenanceApi";
import { ManageAreasTasksModal } from "./components/ManageAreasTasksModal";
import { MaintenancePdfModal } from "./components/MaintenancePdfModal";
import { GoogleDriveModal } from "./components/GoogleDriveModal";

export function BuildingMaintenanceView({ user }) {
  const userRole = (user?.role || "SUPER_USER").toUpperCase();

  // Active date selection (defaults to sample 6/11/26 or today)
  const [selectedDate, setSelectedDate] = useState("6/11/26");
  const [report, setReport] = useState(null);
  const [items, setItems] = useState([]);
  const [effectiveDate, setEffectiveDate] = useState("6/11/26");
  const [checkedByGlobal, setCheckedByGlobal] = useState("Yahya");
  const [verifiedBy, setVerifiedBy] = useState("Super Admin");
  const [generalNotes, setGeneralNotes] = useState("");

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [driveUploading, setDriveUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals state
  const [manageModalOpened, setManageModalOpened] = useState(false);
  const [pdfModalOpened, setPdfModalOpened] = useState(false);
  const [driveModalOpened, setDriveModalOpened] = useState(false);

  // Archive / All Dates
  const [availableDates, setAvailableDates] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, Completed, Pending, Inactive
  const [areaFilter, setAreaFilter] = useState("ALL");

  // Fetch report for selected date
  const loadReport = async (dateToLoad) => {
    try {
      setLoading(true);
      setError(null);
      const res = await buildingMaintenanceApi.getReportByDate(dateToLoad, userRole);
      if (res?.report) {
        setReport(res.report);
        setItems(res.report.items || []);
        setEffectiveDate(res.report.effectiveDate || dateToLoad);
        setCheckedByGlobal(res.report.checkedByGlobal || "Yahya");
        setVerifiedBy(res.report.verifiedBy || "Super Admin");
        setGeneralNotes(res.report.generalNotes || "");
      }
    } catch (err) {
      console.error("Failed to load maintenance report:", err);
      setError(err.response?.data?.error || err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available recorded dates
  const loadDatesList = async () => {
    try {
      const res = await buildingMaintenanceApi.getAllDates(userRole);
      if (res?.dates) {
        setAvailableDates(res.dates);
      }
    } catch (err) {
      console.warn("Could not load dates list:", err);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
    loadDatesList();
  }, [selectedDate]);

  // Handle item change in table
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Quick mark all as completed
  const handleMarkAllCompleted = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        status: "Completed",
        checkedBy: it.checkedBy || checkedByGlobal || "Yahya",
        initial: it.initial || "YK",
      }))
    );
    setSuccess("Marked all items as Completed!");
  };

  // Save current inspection checklist to DB
  const handleSaveChecklist = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        reportDate: selectedDate,
        effectiveDate,
        checkedByGlobal,
        verifiedBy,
        generalNotes,
        items,
      };

      const res = await buildingMaintenanceApi.saveDailyReport(payload, userRole);
      if (res?.report) {
        setReport(res.report);
        setItems(res.report.items || []);
        setSuccess("Daily inspection checklist saved successfully to database!");
        loadDatesList();
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err.response?.data?.error || err.message || "Failed to save checklist");
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF and open modal
  const handleGeneratePdf = async () => {
    if (!report?._id) {
      await handleSaveChecklist();
    }
    try {
      setPdfGenerating(true);
      setError(null);
      const res = await buildingMaintenanceApi.generatePdf(report._id, userRole);
      if (res?.pdfUrl) {
        setReport((prev) => ({ ...prev, pdfUrl: res.pdfUrl }));
        setPdfModalOpened(true);
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(err.response?.data?.error || err.message || "Failed to generate PDF");
    } finally {
      setPdfGenerating(false);
    }
  };

  // Upload to Google Drive and open modal
  const handleUploadDrive = async () => {
    if (!report?._id) return;
    try {
      setDriveUploading(true);
      setError(null);
      const res = await buildingMaintenanceApi.uploadToGoogleDrive(report._id, userRole);
      if (res?.report) {
        setReport(res.report);
        setSuccess("Report successfully registered with Google Drive!");
        setDriveModalOpened(true);
      }
    } catch (err) {
      console.error("Google Drive error:", err);
      setError(err.response?.data?.error || err.message || "Failed to upload to Google Drive");
    } finally {
      setDriveUploading(false);
    }
  };

  // Add ad-hoc task to current date checklist
  const handleAddAdHocTask = () => {
    const area = prompt("Enter Area name for this new task:", "General");
    if (!area) return;
    const task = prompt(`Enter Daily Task description for Area "${area}":`);
    if (!task) return;

    setItems((prev) => [
      ...prev,
      {
        area: area.trim(),
        dailyTask: task.trim(),
        date: effectiveDate || selectedDate,
        checkedBy: checkedByGlobal || "Yahya",
        status: "Pending",
        initial: "YK",
        dueDate: "",
        notes: "",
        order: prev.length + 1,
      },
    ]);
    setSuccess(`Ad-hoc task added to "${area}". Click "Save Daily Inspection" to commit.`);
  };

  // Remove row from current date
  const handleRemoveItem = (index) => {
    if (!window.confirm("Remove this item from the active checklist?")) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculate live statistics
  const stats = useMemo(() => {
    const total = items.length;
    let completed = 0;
    let pending = 0;
    let inactive = 0;

    for (const it of items) {
      const s = (it.status || "").toLowerCase();
      if (s === "completed") completed++;
      else if (s === "inactive") inactive++;
      else pending++;
    }

    const activeTotal = total - inactive;
    const percentage = activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : 0;
    return { total, completed, pending, inactive, percentage };
  }, [items]);

  // Unique areas for filter dropdown
  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.area).filter(Boolean)));
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        it.area?.toLowerCase().includes(q) ||
        it.dailyTask?.toLowerCase().includes(q) ||
        it.notes?.toLowerCase().includes(q) ||
        it.checkedBy?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || (it.status || "").toLowerCase() === statusFilter.toLowerCase();

      const matchesArea =
        areaFilter === "ALL" || it.area?.toLowerCase() === areaFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesArea;
    });
  }, [items, searchQuery, statusFilter, areaFilter]);

  return (
    <Container size="xl" py="lg">
      <LoadingOverlay visible={loading || saving} overlayProps={{ radius: "md", blur: 2 }} />

      <Stack gap="lg">
        {/* TOP HERO BANNER */}
        <Paper
          p="lg"
          radius="md"
          style={{
            background: "linear-gradient(135deg, #042f2e 0%, #064e3b 50%, #0f766e 100%)",
            color: "#ffffff",
            boxShadow: "0 6px 24px rgba(4, 47, 46, 0.25)",
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <div>
              <Group gap="xs" mb={4}>
                <ThemeIcon size="lg" radius="md" color="teal" variant="filled">
                  <IconTools size={22} />
                </ThemeIcon>
                <Title order={2} style={{ color: "#ffffff", fontWeight: 800 }}>
                  Building Manager &amp; Maintenance — Daily Inspection
                </Title>
              </Group>
              <Text size="sm" style={{ color: "#ccfbf1", fontWeight: 600 }}>
                INTERNATIONAL ISLAMIC PROPAGATION CENTRE CANADA
              </Text>
              <Text size="xs" style={{ color: "#99f6e4" }}>
                132 Main Street South, Rockwood, Ontario N0B 2K0 &bull; Daily Facility Inspection &amp; Maintenance Management
              </Text>
            </div>

            <Group gap="xs">
              <Badge color="red" variant="filled" size="md">
                Super User Only
              </Badge>
              <Badge color="cyan" variant="light" size="md" leftSection={<IconFileTypePdf size={14} />}>
                PDF Report
              </Badge>
              <Badge color="teal" variant="light" size="md" leftSection={<IconBrandGoogleDrive size={14} />}>
                Google Drive
              </Badge>
            </Group>
          </Group>
        </Paper>

        {/* FEEDBACK ALERTS */}
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert icon={<IconCheck size={16} />} color="teal" radius="md" withCloseButton onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* CONTROLS & DATE SELECTOR BAR */}
        <Paper p="md" withBorder radius="md" style={{ background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <Stack gap="sm">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="xs" align="center">
                <ThemeIcon color="teal" size="sm" radius="sm">
                  <IconCalendar size={14} />
                </ThemeIcon>
                <Text size="xs" fw={700} c="dark.8">
                  Effective Inspection Date:
                </Text>
                <TextInput
                  size="xs"
                  placeholder="e.g. 6/11/26"
                  value={effectiveDate}
                  onChange={(e) => {
                    setEffectiveDate(e.target.value);
                  }}
                  style={{ width: "120px" }}
                />
                <Button
                  size="compact-xs"
                  variant="light"
                  color="teal"
                  onClick={() => {
                    setSelectedDate(effectiveDate);
                  }}
                >
                  Load Date
                </Button>

                <Divider orientation="vertical" />

                {availableDates.length > 0 && (
                  <Select
                    size="xs"
                    placeholder="Switch to Past Date..."
                    data={availableDates.map((d) => ({
                      value: d.reportDate || d.effectiveDate,
                      label: `${d.effectiveDate || d.reportDate} (${d.stats?.completed || 0}/${d.stats?.total || 0} Done)`,
                    }))}
                    onChange={(val) => {
                      if (val) {
                        setSelectedDate(val);
                        setEffectiveDate(val);
                      }
                    }}
                    style={{ width: "210px" }}
                  />
                )}
              </Group>

              {/* Action Buttons */}
              <Group gap="xs" wrap="wrap">
                <Button
                  size="xs"
                  color="teal"
                  variant="filled"
                  leftSection={<IconDeviceFloppy size={15} />}
                  onClick={handleSaveChecklist}
                  loading={saving}
                >
                  Save Daily Inspection
                </Button>

                <Button
                  size="xs"
                  color="indigo"
                  variant="light"
                  leftSection={<IconChecklist size={15} />}
                  onClick={() => setManageModalOpened(true)}
                >
                  Manage Areas &amp; Tasks
                </Button>

                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  leftSection={<IconFileTypePdf size={15} />}
                  onClick={handleGeneratePdf}
                  loading={pdfGenerating}
                >
                  Download PDF
                </Button>

                <Button
                  size="xs"
                  color="teal"
                  variant="light"
                  leftSection={<IconBrandGoogleDrive size={15} />}
                  onClick={() => setDriveModalOpened(true)}
                >
                  Google Drive
                </Button>
              </Group>
            </Group>

            {/* Quick Meta details row */}
            <Group gap="md" wrap="wrap">
              <TextInput
                size="xs"
                label="Primary Inspector (Checked by Whom)"
                placeholder="e.g. Yahya"
                value={checkedByGlobal}
                onChange={(e) => setCheckedByGlobal(e.target.value)}
                style={{ width: "200px" }}
              />
              <TextInput
                size="xs"
                label="Manager Review & Verification"
                placeholder="e.g. Super Admin"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                style={{ width: "200px" }}
              />
              <TextInput
                size="xs"
                label="General Daily Comments / Notice"
                placeholder="e.g. Building safe and secure; parking lot cleared."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                style={{ flex: 1, minWidth: "260px" }}
              />
            </Group>
          </Stack>
        </Paper>

        {/* PROGRESS & METRIC CARDS */}
        <Paper p="sm" withBorder radius="md" style={{ background: "#f0fdfa", borderColor: "#ccfbf1" }}>
          <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="lg">
                <Text size="xs" fw={700} c="teal.9">
                  Daily Completion Status:
                </Text>
                <Group gap="xs">
                  <Badge color="blue" size="md" variant="filled">
                    Total: {stats.total}
                  </Badge>
                  <Badge color="green" size="md" variant="filled" leftSection={<IconCircleCheck size={12} />}>
                    Completed: {stats.completed}
                  </Badge>
                  <Badge color="orange" size="md" variant="filled" leftSection={<IconClock size={12} />}>
                    Pending: {stats.pending}
                  </Badge>
                  {stats.inactive > 0 && (
                    <Badge color="gray" size="md" variant="filled" leftSection={<IconCircleMinus size={12} />}>
                      Inactive: {stats.inactive}
                    </Badge>
                  )}
                  <Badge color="teal" size="md" variant="light">
                    Rate: {stats.percentage}%
                  </Badge>
                </Group>
              </Group>

              <Group gap="xs">
                <Button size="compact-xs" color="teal" variant="light" onClick={handleMarkAllCompleted}>
                  Mark All Completed
                </Button>
                <Button size="compact-xs" color="indigo" variant="light" leftSection={<IconPlus size={12} />} onClick={handleAddAdHocTask}>
                  Add Item
                </Button>
              </Group>
            </Group>

            <Progress
              value={stats.percentage}
              color={stats.percentage === 100 ? "green" : "teal"}
              radius="xl"
              size="md"
              striped
              animated={stats.percentage < 100}
            />
          </Stack>
        </Paper>

        {/* FILTER & SEARCH BAR */}
        <Paper p="xs" withBorder radius="md" style={{ background: "#f8fafc" }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <TextInput
              size="xs"
              placeholder="Search Area, Task description, notes..."
              leftSection={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "260px" }}
              clearable
            />

            <Group gap="xs">
              <Select
                size="xs"
                placeholder="Filter by Status"
                data={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "Completed", label: "Completed" },
                  { value: "Pending", label: "Pending" },
                  { value: "Inactive", label: "Inactive" },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val || "ALL")}
                style={{ width: "140px" }}
              />

              <Select
                size="xs"
                placeholder="Filter by Area"
                data={[{ value: "ALL", label: "All Areas" }, ...uniqueAreas.map((a) => ({ value: a, label: a }))]}
                value={areaFilter}
                onChange={(val) => setAreaFilter(val || "ALL")}
                style={{ width: "170px" }}
              />

              {(searchQuery || statusFilter !== "ALL" || areaFilter !== "ALL") && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setAreaFilter("ALL");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        {/* 8-COLUMN OFFICIAL BUILDING MAINTENANCE TABLE */}
        <Paper p="sm" withBorder radius="md" style={{ background: "#ffffff", overflowX: "auto" }}>
          <Table highlightOnHover withTableBorder withColumnBorders style={{ minWidth: "1050px" }}>
            <Table.Thead style={{ background: "#0f766e" }}>
              <Table.Tr>
                <Table.Th style={{ color: "#ffffff", width: "150px" }}>Area</Table.Th>
                <Table.Th style={{ color: "#ffffff", minWidth: "260px" }}>Daily Task</Table.Th>
                <Table.Th style={{ color: "#ffffff", width: "95px", textAlign: "center" }}>Date</Table.Th>
                <Table.Th style={{ color: "#ffffff", width: "115px", textAlign: "center" }}>Checked by</Table.Th>
                <Table.Th style={{ color: "#ffffff", width: "140px", textAlign: "center" }}>Status</Table.Th>
                <Table.Th style={{ color: "#ffffff", width: "75px", textAlign: "center" }}>Initial</Table.Th>
                <Table.Th style={{ color: "#ffffff", width: "100px", textAlign: "center" }}>Due Date</Table.Th>
                <Table.Th style={{ color: "#ffffff", minWidth: "180px" }}>Notes / Issues / Action Taken</Table.Th>
                <Table.Th style={{ color: "#ffffff", width: "45px", textAlign: "center" }}>Del</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredItems.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9} style={{ textAlign: "center", padding: "24px" }}>
                    <Text c="dimmed" size="sm">
                      No maintenance tasks match your filter criteria. Click &ldquo;Add Item&rdquo; or reset filters.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredItems.map((item, index) => {
                  const originalIndex = items.findIndex(
                    (it) => (it._id && it._id === item._id) || (it.area === item.area && it.dailyTask === item.dailyTask)
                  );
                  const realIdx = originalIndex >= 0 ? originalIndex : index;

                  const s = (item.status || "Pending").toLowerCase();

                  return (
                    <Table.Tr
                      key={item._id || `${item.area}-${index}`}
                      style={{
                        background:
                          s === "completed"
                            ? "rgba(240, 253, 244, 0.6)"
                            : s === "inactive"
                            ? "rgba(248, 250, 252, 0.6)"
                            : "#ffffff",
                      }}
                    >
                      {/* 1. Area */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <Text fw={700} size="xs" c="teal.9">
                          {item.area}
                        </Text>
                      </Table.Td>

                      {/* 2. Daily Task */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <Text size="xs" c="dark.9" style={{ lineHeight: 1.45 }}>
                          {item.dailyTask}
                        </Text>
                      </Table.Td>

                      {/* 3. Date */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <TextInput
                          size="xs"
                          value={item.date || effectiveDate}
                          onChange={(e) => handleItemChange(realIdx, "date", e.target.value)}
                          style={{ minWidth: "80px" }}
                        />
                      </Table.Td>

                      {/* 4. Checked by */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <TextInput
                          size="xs"
                          value={item.checkedBy || checkedByGlobal}
                          onChange={(e) => handleItemChange(realIdx, "checkedBy", e.target.value)}
                          placeholder="Yahya"
                          style={{ minWidth: "90px" }}
                        />
                      </Table.Td>

                      {/* 5. Status */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <Select
                          size="xs"
                          data={[
                            { value: "Completed", label: "Completed" },
                            { value: "Pending", label: "Pending" },
                            { value: "Inactive", label: "Inactive" },
                          ]}
                          value={item.status || "Pending"}
                          onChange={(val) => handleItemChange(realIdx, "status", val || "Pending")}
                          style={{ minWidth: "120px" }}
                        />
                      </Table.Td>

                      {/* 6. Initial */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <TextInput
                          size="xs"
                          value={item.initial || ""}
                          onChange={(e) => handleItemChange(realIdx, "initial", e.target.value)}
                          placeholder="YK"
                          style={{ width: "60px", textAlign: "center" }}
                        />
                      </Table.Td>

                      {/* 7. Due Date */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <TextInput
                          size="xs"
                          value={item.dueDate || ""}
                          onChange={(e) => handleItemChange(realIdx, "dueDate", e.target.value)}
                          placeholder="M/D/YY"
                          style={{ minWidth: "85px" }}
                        />
                      </Table.Td>

                      {/* 8. Notes / Issues / Action Taken notes / Description / Comments */}
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <TextInput
                          size="xs"
                          placeholder="Add comments, issues or action taken..."
                          value={item.notes || ""}
                          onChange={(e) => handleItemChange(realIdx, "notes", e.target.value)}
                        />
                      </Table.Td>

                      {/* Delete */}
                      <Table.Td style={{ verticalAlign: "top", textAlign: "center" }}>
                        <ActionIcon
                          size="xs"
                          color="red"
                          variant="subtle"
                          onClick={() => handleRemoveItem(realIdx)}
                          title="Remove item"
                        >
                          <IconTrash size={13} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* BOTTOM ACTION BAR */}
        <Paper p="md" withBorder radius="md" style={{ background: "#ffffff" }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                color="indigo"
                leftSection={<IconPlus size={14} />}
                onClick={handleAddAdHocTask}
              >
                Add Inspection Item
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconRefresh size={14} />}
                onClick={() => loadReport(selectedDate)}
              >
                Reload from Database
              </Button>
            </Group>

            <Group gap="xs">
              <Button
                size="sm"
                color="teal"
                variant="filled"
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSaveChecklist}
                loading={saving}
              >
                Save Daily Checklist
              </Button>
              <Button
                size="sm"
                color="red"
                variant="light"
                leftSection={<IconFileTypePdf size={16} />}
                onClick={handleGeneratePdf}
                loading={pdfGenerating}
              >
                Generate &amp; Download PDF
              </Button>
              <Button
                size="sm"
                color="indigo"
                variant="light"
                leftSection={<IconBrandGoogleDrive size={16} />}
                onClick={handleUploadDrive}
                loading={driveUploading}
              >
                Upload to Google Drive
              </Button>
            </Group>
          </Group>
        </Paper>
      </Stack>

      {/* MODAL 1: Manage Areas & Tasks (Insert, Edit, Rename, Delete Unique) */}
      <ManageAreasTasksModal
        opened={manageModalOpened}
        onClose={() => setManageModalOpened(false)}
        items={items}
        reportDate={selectedDate}
        userRole={userRole}
        onRefresh={() => loadReport(selectedDate)}
      />

      {/* MODAL 2: PDF Preview & Download */}
      <MaintenancePdfModal
        opened={pdfModalOpened}
        onClose={() => setPdfModalOpened(false)}
        pdfUrl={report?.pdfUrl}
        effectiveDate={effectiveDate || selectedDate}
        googleDriveLink={report?.googleDriveLink}
        onUploadDrive={handleUploadDrive}
        uploadingDrive={driveUploading}
      />

      {/* MODAL 3: Google Drive Sync & Link */}
      <GoogleDriveModal
        opened={driveModalOpened}
        onClose={() => setDriveModalOpened(false)}
        report={report}
        onUpload={handleUploadDrive}
        uploading={driveUploading}
      />
    </Container>
  );
}

export default BuildingMaintenanceView;
