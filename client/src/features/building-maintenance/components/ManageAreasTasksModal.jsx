import React, { useState } from "react";
import {
  Modal,
  Stack,
  Text,
  Group,
  TextInput,
  Textarea,
  Button,
  Select,
  Paper,
  Divider,
  ActionIcon,
  Badge,
  Accordion,
  Alert,
  ThemeIcon,
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconCategory,
  IconChecklist,
  IconArrowRight,
} from "@tabler/icons-react";
import { buildingMaintenanceApi } from "../api/buildingMaintenanceApi";

export function ManageAreasTasksModal({
  opened,
  onClose,
  items = [],
  reportDate = "",
  userRole = "SUPER_USER",
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("addArea"); // addArea, addTask, editArea
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaDefaultTask, setNewAreaDefaultTask] = useState("");

  const [selectedAreaForTask, setSelectedAreaForTask] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskInitial, setNewTaskInitial] = useState("YK");
  const [newTaskCheckedBy, setNewTaskCheckedBy] = useState("Yahya");

  const [renameOldArea, setRenameOldArea] = useState("");
  const [renameNewArea, setRenameNewArea] = useState("");

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Extract unique areas from items
  const uniqueAreas = Array.from(new Set(items.map((i) => i.area).filter(Boolean)));

  // Group items by Area
  const groupedByArea = uniqueAreas.reduce((acc, area) => {
    acc[area] = items.filter((it) => it.area.toLowerCase() === area.toLowerCase());
    return acc;
  }, {});

  const handleAddArea = async () => {
    if (!newAreaName.trim()) {
      setError("Please enter a valid Area name.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await buildingMaintenanceApi.addArea(
        {
          area: newAreaName.trim(),
          defaultTask: newAreaDefaultTask.trim(),
          reportDate,
        },
        userRole
      );
      setSuccess(`Area "${newAreaName.trim()}" added successfully!`);
      setNewAreaName("");
      setNewAreaDefaultTask("");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to add Area");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!selectedAreaForTask) {
      setError("Please select an Area.");
      return;
    }
    if (!newTaskDescription.trim()) {
      setError("Please enter a Daily Task description.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await buildingMaintenanceApi.addTask(
        {
          area: selectedAreaForTask,
          dailyTask: newTaskDescription.trim(),
          checkedBy: newTaskCheckedBy.trim() || "Yahya",
          status: "Pending",
          initial: newTaskInitial.trim(),
          reportDate,
        },
        userRole
      );
      setSuccess(`New Daily Task added to "${selectedAreaForTask}"!`);
      setNewTaskDescription("");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to add Task");
    } finally {
      setLoading(false);
    }
  };

  const handleRenameArea = async () => {
    if (!renameOldArea || !renameNewArea.trim()) {
      setError("Please choose the area and provide its new name.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await buildingMaintenanceApi.renameArea(
        {
          oldArea: renameOldArea,
          newArea: renameNewArea.trim(),
          reportDate,
        },
        userRole
      );
      setSuccess(`Area "${renameOldArea}" renamed to "${renameNewArea.trim()}"!`);
      setRenameOldArea("");
      setRenameNewArea("");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to rename Area");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArea = async (areaName) => {
    if (!window.confirm(`Are you sure you want to delete Area "${areaName}" and all of its daily tasks?`)) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await buildingMaintenanceApi.deleteArea({ area: areaName, reportDate }, userRole);
      setSuccess(`Area "${areaName}" and its tasks deleted.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to delete Area");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Remove this Daily Task from the checklist?")) return;
    try {
      setLoading(true);
      setError(null);
      await buildingMaintenanceApi.deleteTask(taskId, reportDate, userRole);
      setSuccess("Daily Task removed successfully.");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to delete Task");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditTask = async (taskId) => {
    if (!editTaskText.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await buildingMaintenanceApi.updateTask(
        taskId,
        { dailyTask: editTaskText.trim() },
        reportDate,
        userRole
      );
      setSuccess("Task updated successfully.");
      setEditingTaskId(null);
      setEditTaskText("");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update Task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="teal" size="md" radius="md">
            <IconChecklist size={18} />
          </ThemeIcon>
          <Text fw={700} size="sm">
            Manage Areas &amp; Daily Tasks (Master &amp; Active Checklist)
          </Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          Define unique inspection <strong>Areas</strong> and unique <strong>Daily Tasks</strong> under each area.
          Changes are synchronized to both the Master Template and the active daily checklist.
        </Text>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" radius="sm" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert icon={<IconCheck size={16} />} color="teal" radius="sm" withCloseButton onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Action Toggle Bar */}
        <Group grow gap="xs">
          <Button
            size="xs"
            variant={activeTab === "addArea" ? "filled" : "light"}
            color="teal"
            leftSection={<IconCategory size={14} />}
            onClick={() => setActiveTab("addArea")}
          >
            Add New Area
          </Button>
          <Button
            size="xs"
            variant={activeTab === "addTask" ? "filled" : "light"}
            color="indigo"
            leftSection={<IconPlus size={14} />}
            onClick={() => setActiveTab("addTask")}
          >
            Add Task under Area
          </Button>
          <Button
            size="xs"
            variant={activeTab === "renameArea" ? "filled" : "light"}
            color="blue"
            leftSection={<IconEdit size={14} />}
            onClick={() => setActiveTab("renameArea")}
          >
            Rename Area
          </Button>
        </Group>

        {/* 1. Add Area Form */}
        {activeTab === "addArea" && (
          <Paper p="sm" withBorder radius="md" style={{ background: "#f8fafc" }}>
            <Stack gap="xs">
              <Text size="xs" fw={700} c="teal.9">
                Create Unique Inspection Area
              </Text>
              <TextInput
                size="xs"
                label="New Area Name"
                placeholder="e.g. Electrical & HVAC Room, Prayer Hall, Cafeteria"
                required
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
              />
              <TextInput
                size="xs"
                label="First Daily Task under this Area (Optional)"
                placeholder="e.g. Check temperature settings and visual inspect electrical panels"
                value={newAreaDefaultTask}
                onChange={(e) => setNewAreaDefaultTask(e.target.value)}
              />
              <Group justify="flex-end" mt={4}>
                <Button size="xs" color="teal" onClick={handleAddArea} loading={loading} leftSection={<IconPlus size={14} />}>
                  Insert Area
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {/* 2. Add Task under Area Form */}
        {activeTab === "addTask" && (
          <Paper p="sm" withBorder radius="md" style={{ background: "#f8fafc" }}>
            <Stack gap="xs">
              <Text size="xs" fw={700} c="indigo.9">
                Insert Unique Daily Task Under Area
              </Text>
              <Select
                size="xs"
                label="Select Target Area"
                placeholder="Pick existing Area..."
                required
                data={uniqueAreas.map((a) => ({ value: a, label: a }))}
                value={selectedAreaForTask}
                onChange={setSelectedAreaForTask}
              />
              <Textarea
                size="xs"
                label="Daily Task Description (Unique to this Area)"
                placeholder="Describe the exact inspection or maintenance routine to be carried out..."
                required
                rows={2}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
              <Group grow gap="xs">
                <TextInput
                  size="xs"
                  label="Default Inspector"
                  value={newTaskCheckedBy}
                  onChange={(e) => setNewTaskCheckedBy(e.target.value)}
                />
                <TextInput
                  size="xs"
                  label="Inspector Initial"
                  value={newTaskInitial}
                  onChange={(e) => setNewTaskInitial(e.target.value)}
                />
              </Group>
              <Group justify="flex-end" mt={4}>
                <Button size="xs" color="indigo" onClick={handleAddTask} loading={loading} leftSection={<IconPlus size={14} />}>
                  Insert Daily Task
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {/* 3. Rename Area Form */}
        {activeTab === "renameArea" && (
          <Paper p="sm" withBorder radius="md" style={{ background: "#f8fafc" }}>
            <Stack gap="xs">
              <Text size="xs" fw={700} c="blue.9">
                Rename Existing Area
              </Text>
              <Select
                size="xs"
                label="Select Area to Rename"
                placeholder="Choose area..."
                data={uniqueAreas.map((a) => ({ value: a, label: a }))}
                value={renameOldArea}
                onChange={(val) => {
                  setRenameOldArea(val || "");
                  setRenameNewArea(val || "");
                }}
              />
              <TextInput
                size="xs"
                label="New Area Name"
                placeholder="Type updated area name..."
                value={renameNewArea}
                onChange={(e) => setRenameNewArea(e.target.value)}
              />
              <Group justify="flex-end" mt={4}>
                <Button size="xs" color="blue" onClick={handleRenameArea} loading={loading} leftSection={<IconCheck size={14} />}>
                  Save Area Rename
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        <Divider label={`Current Defined Inspection Areas (${uniqueAreas.length})`} labelPosition="center" my="xs" />

        {/* Accordion view of all Areas and their Daily Tasks */}
        <Box style={{ maxHeight: "360px", overflowY: "auto" }}>
          <Accordion variant="separated" radius="md">
            {uniqueAreas.map((area) => {
              const tasks = groupedByArea[area] || [];
              return (
                <Accordion.Item key={area} value={area}>
                  <Accordion.Control>
                    <Group justify="space-between" pr="sm">
                      <Group gap="xs">
                        <Badge color="teal" size="sm" variant="filled">
                          {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
                        </Badge>
                        <Text fw={700} size="xs" c="dark.8">
                          {area}
                        </Text>
                      </Group>
                      <ActionIcon
                        size="xs"
                        color="red"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArea(area);
                        }}
                        title={`Delete Area "${area}" and its tasks`}
                      >
                        <IconTrash size={13} />
                      </ActionIcon>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap={6}>
                      {tasks.map((t, idx) => (
                        <Paper key={t._id || idx} p="xs" withBorder radius="sm" style={{ background: "#ffffff" }}>
                          {editingTaskId === t._id ? (
                            <Stack gap={4}>
                              <TextInput
                                size="xs"
                                value={editTaskText}
                                onChange={(e) => setEditTaskText(e.target.value)}
                              />
                              <Group justify="flex-end" gap={6}>
                                <Button size="compact-xs" variant="default" onClick={() => setEditingTaskId(null)}>
                                  Cancel
                                </Button>
                                <Button size="compact-xs" color="teal" onClick={() => handleSaveEditTask(t._id)}>
                                  Save
                                </Button>
                              </Group>
                            </Stack>
                          ) : (
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                              <Text size="xs" style={{ flex: 1 }}>
                                {idx + 1}. {t.dailyTask}
                              </Text>
                              <Group gap={4}>
                                <ActionIcon
                                  size="xs"
                                  color="blue"
                                  variant="subtle"
                                  onClick={() => {
                                    setEditingTaskId(t._id);
                                    setEditTaskText(t.dailyTask);
                                  }}
                                  title="Edit Task Text"
                                >
                                  <IconEdit size={13} />
                                </ActionIcon>
                                <ActionIcon
                                  size="xs"
                                  color="red"
                                  variant="subtle"
                                  onClick={() => handleDeleteTask(t._id)}
                                  title="Delete Task"
                                >
                                  <IconTrash size={13} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </Box>
      </Stack>
    </Modal>
  );
}
