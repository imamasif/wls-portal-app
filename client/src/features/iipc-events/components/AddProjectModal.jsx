import React, { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Group,
  Stack,
  ActionIcon,
  Text,
  Paper,
  Image,
  SimpleGrid,
  FileButton,
  Badge,
  Divider,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconPhoto,
  IconUpload,
  IconCalendar,
  IconCoin,
  IconFileDescription,
} from "@tabler/icons-react";
import { CURRENCIES } from "../currencyUtils";

export function AddProjectModal({
  opened,
  onClose,
  onSave,
  initialProject = null,
  loading = false,
}) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState(10000);
  const [currency, setCurrency] = useState("CAD");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [pictures, setPictures] = useState([]);
  const [currentUrlInput, setCurrentUrlInput] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title || "");
      setTargetAmount(initialProject.targetAmount || 0);
      setCurrency(initialProject.currency || "CAD");
      setStartDate(
        initialProject.startDate
          ? new Date(initialProject.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setEndDate(
        initialProject.endDate
          ? new Date(initialProject.endDate).toISOString().split("T")[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
      );
      setDescription(initialProject.description || "");
      setComments(initialProject.comments || "");
      setPictures(
        Array.isArray(initialProject.pictures) ? initialProject.pictures : []
      );
      setStatus(initialProject.status || "ACTIVE");
    } else {
      setTitle("");
      setTargetAmount(10000);
      setCurrency("CAD");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      );
      setDescription("");
      setComments("");
      setPictures([]);
      setStatus("ACTIVE");
    }
  }, [initialProject, opened]);

  // Handle local file browse -> convert to base64
  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target.result;
      setPictures((prev) => [...prev, base64Url]);
    };
    reader.readAsDataURL(file);
  };

  // Add picture by URL with '+' button
  const handleAddUrl = () => {
    const trimmed = currentUrlInput.trim();
    if (trimmed) {
      setPictures((prev) => [...prev, trimmed]);
      setCurrentUrlInput("");
    }
  };

  // Remove picture with '-' button
  const handleRemovePicture = (indexToRemove) => {
    setPictures((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSave({
      title: title.trim(),
      targetAmount: Number(targetAmount) || 0,
      currency,
      startDate,
      endDate,
      description: description.trim(),
      comments: comments.trim(),
      pictures,
      status,
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCalendar size={22} color="var(--mantine-color-teal-6)" />
          <Text fw={700} size="lg">
            {initialProject
              ? "Edit Project / Event Appeal"
              : "Create New Project / Event Appeal"}
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Project / Event Title"
            placeholder="e.g. Ramadan Iftar Drive 2026 / Building Extension Fund"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <Group grow>
            <NumberInput
              label="Target Goal / Pledge Target"
              placeholder="e.g. 50000"
              required
              min={1}
              value={targetAmount}
              onChange={(val) => setTargetAmount(val)}
              leftSection={<IconCoin size={16} />}
            />
            <Select
              label="Target Currency"
              data={CURRENCIES}
              value={currency}
              onChange={(val) => setCurrency(val || "CAD")}
              searchable
              required
            />
          </Group>

          <Group grow>
            <TextInput
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
            />
            <TextInput
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.currentTarget.value)}
            />
          </Group>

          <Select
            label="Project Status"
            value={status}
            onChange={(val) => setStatus(val || "ACTIVE")}
            data={[
              { value: "ACTIVE", label: "Active - Open for Donations" },
              { value: "UPCOMING", label: "Upcoming - Pre-Launch" },
              { value: "COMPLETED", label: "Completed - Target Reached/Closed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />

          <Textarea
            label="Project Description"
            placeholder="Explain the background, purpose, and community impact of this project/event..."
            required
            minRows={3}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <Textarea
            label="Instructions & Remarks (Comments)"
            placeholder="Additional notes for donors, e.g. e-transfer instructions, bank info, or coordinator contact..."
            minRows={2}
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
          />

          <Divider label="Project Snaps / Pictures" labelPosition="center" />

          {/* Picture addition: Browse picture option + URL link input with +/- buttons */}
          <Paper p="sm" withBorder radius="sm" bg="gray.0">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text size="sm" fw={600}>
                  Project Photos & Snaps ({pictures.length} added)
                </Text>
                <FileButton
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                >
                  {(props) => (
                    <Button
                      {...props}
                      size="xs"
                      variant="light"
                      color="teal"
                      leftSection={<IconUpload size={14} />}
                    >
                      Browse & Upload Pic
                    </Button>
                  )}
                </FileButton>
              </Group>

              {/* Enter URL link with + button */}
              <Group gap="xs">
                <TextInput
                  placeholder="Or paste image URL (https://...)"
                  value={currentUrlInput}
                  onChange={(e) => setCurrentUrlInput(e.currentTarget.value)}
                  style={{ flex: 1 }}
                  size="xs"
                />
                <Button
                  size="xs"
                  color="blue"
                  variant="filled"
                  leftSection={<IconPlus size={14} />}
                  onClick={handleAddUrl}
                  disabled={!currentUrlInput.trim()}
                >
                  Add Snap Link
                </Button>
              </Group>

              {/* Thumbnail preview list with - remove button */}
              {pictures.length > 0 ? (
                <SimpleGrid cols={3} spacing="xs" mt="xs">
                  {pictures.map((picUrl, idx) => (
                    <Paper
                      key={idx}
                      p={4}
                      withBorder
                      radius="sm"
                      style={{ position: "relative" }}
                    >
                      <Image
                        src={picUrl}
                        height={70}
                        fit="cover"
                        radius="xs"
                        fallbackSrc="https://placehold.co/120x70?text=Snap"
                      />
                      <ActionIcon
                        size="xs"
                        color="red"
                        variant="filled"
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                        }}
                        onClick={() => handleRemovePicture(idx)}
                        title="Remove snap (-)"
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                      <Badge size="xs" variant="outline" mt={2} fullWidth>
                        Snap #{idx + 1}
                      </Badge>
                    </Paper>
                  ))}
                </SimpleGrid>
              ) : (
                <Text size="xs" c="dimmed" fs="italic" ta="center" py="xs">
                  No snaps uploaded yet. Will remain empty if not provided.
                </Text>
              )}
            </Stack>
          </Paper>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="teal" loading={loading}>
              {initialProject ? "Save Changes" : "Launch Project Appeal"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
