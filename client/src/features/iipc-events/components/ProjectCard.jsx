import React, { useState } from "react";
import {
  Card,
  Image,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Progress,
  Paper,
  SimpleGrid,
  Modal,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconCalendar,
  IconCoin,
  IconUsers,
  IconBrandWhatsapp,
  IconEdit,
  IconTrash,
  IconChartBar,
  IconHeartHandshake,
  IconZoomIn,
  IconShare,
} from "@tabler/icons-react";
import { formatCurrency, getCurrencySymbol } from "../currencyUtils";
import { ShareCampaignModal } from "./ShareCampaignModal";

export function ProjectCard({
  project,
  isSuperUser = false,
  onAddPledgeOnBehalf,
  onViewReport,
  onEdit,
  onDelete,
  onUserPledge,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [shareModalOpened, setShareModalOpened] = useState(false);

  const summary = project.summary || {};
  const target = project.targetAmount || 0;
  const pledged = summary.totalPledged || 0;
  const received = summary.totalReceived || 0;
  const remaining = summary.remainingAmount || Math.max(0, target - received);
  const isTargetMet = summary.isTargetMet || (target > 0 && received >= target);
  const surplus = summary.surplusAmount || Math.max(0, received - target);
  const percentageReceived =
    target > 0 ? Math.min(100, Math.round((received / target) * 100)) : 0;
  const percentagePledged =
    target > 0 ? Math.min(100, Math.round((pledged / target) * 100)) : 0;

  const pictures = Array.isArray(project.pictures) ? project.pictures : [];
  const heroPic = pictures.length > 0 ? pictures[0] : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "teal";
      case "UPCOMING":
        return "blue";
      case "COMPLETED":
        return "green";
      case "CANCELLED":
        return "gray";
      default:
        return "teal";
    }
  };

  return (
    <>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderColor: isTargetMet
            ? "var(--mantine-color-green-4)"
            : "var(--mantine-color-gray-3)",
          boxShadow: isTargetMet
            ? "0 4px 14px rgba(46, 184, 92, 0.15)"
            : undefined,
        }}
      >
        <div>
          {/* Card Top Media: If snap provided show picture; if not remain empty */}
          {heroPic ? (
            <Card.Section style={{ position: "relative" }}>
              <Image
                src={heroPic}
                height={160}
                fit="cover"
                alt={project.title}
                fallbackSrc="https://placehold.co/600x160?text=IIPC+Project"
              />
              <ActionIcon
                size="sm"
                variant="filled"
                color="dark"
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  opacity: 0.85,
                }}
                onClick={() => setSelectedPhoto(heroPic)}
                title="View Full Snap"
              >
                <IconZoomIn size={14} />
              </ActionIcon>
              {pictures.length > 1 && (
                <Badge
                  size="xs"
                  variant="filled"
                  color="dark"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    opacity: 0.9,
                  }}
                >
                  +{pictures.length - 1} more snaps
                </Badge>
              )}
            </Card.Section>
          ) : (
            /* Clean graphic placeholder when no pictures are provided */
            <Card.Section
              p="md"
              bg="teal.0"
              style={{
                borderBottom: "1px solid var(--mantine-color-teal-1)",
                textAlign: "center",
              }}
            >
              <Text size="xs" fw={700} c="teal.8" tt="uppercase" lts={1}>
                IIPC Community Event Appeal
              </Text>
            </Card.Section>
          )}

          {/* Additional Snaps thumbnail strip if multiple snaps */}
          {pictures.length > 1 && (
            <Group gap={6} mt="xs">
              {pictures.slice(0, 4).map((pic, idx) => (
                <Image
                  key={idx}
                  src={pic}
                  height={34}
                  width={34}
                  radius="xs"
                  fit="cover"
                  style={{ cursor: "pointer", border: "1px solid #ddd" }}
                  onClick={() => setSelectedPhoto(pic)}
                />
              ))}
            </Group>
          )}

          {/* Title & Status */}
          <Group justify="space-between" align="flex-start" mt="md" mb="xs">
            <Text fw={700} size="md" lineClamp={1} style={{ flex: 1 }}>
              {project.title}
            </Text>
            <Badge color={getStatusColor(project.status)} variant="filled">
              {project.status}
            </Badge>
          </Group>

          {/* Dates */}
          <Group gap="xs" mb="xs">
            <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              {formatDate(project.startDate)} – {formatDate(project.endDate)}
            </Text>
          </Group>

          {/* Description */}
          <Text size="sm" c="gray.7" lineClamp={2} mb="md">
            {project.description}
          </Text>

          {/* Comments if any */}
          {project.comments && (
            <Paper p="xs" radius="sm" bg="gray.0" mb="md">
              <Text size="xs" c="dimmed" lineClamp={1}>
                📌 <b>Note:</b> {project.comments}
              </Text>
            </Paper>
          )}

          {/* Target Progress Bar & Metrics */}
          <Paper p="sm" withBorder radius="md" bg="gray.0" mb="md">
            <Group justify="space-between" mb={4}>
              <Text size="xs" fw={600} c="dimmed">
                Target: {formatCurrency(target, project.currency)}
              </Text>
              <Badge
                size="sm"
                color={isTargetMet ? "green" : surplus > 0 ? "cyan" : "teal"}
                variant="light"
              >
                {isTargetMet
                  ? "🎉 TARGET MET!"
                  : `${percentageReceived}% Collected`}
              </Badge>
            </Group>

            {/* Visual Progress Bar */}
            <Progress.Root size="xl" radius="xl">
              <Tooltip label={`Received: ${formatCurrency(received, project.currency)} (${percentageReceived}%)`}>
                <Progress.Section
                  value={percentageReceived}
                  color={isTargetMet ? "green" : "teal"}
                >
                  <Progress.Label>{percentageReceived}%</Progress.Label>
                </Progress.Section>
              </Tooltip>
              {pledged > received && (
                <Tooltip label={`Pledged (Pending): ${formatCurrency(pledged - received, project.currency)}`}>
                  <Progress.Section
                    value={Math.min(100 - percentageReceived, percentagePledged - percentageReceived)}
                    color="indigo"
                  />
                </Tooltip>
              )}
            </Progress.Root>

            <SimpleGrid cols={3} spacing="xs" mt="xs">
              <div>
                <Text size="10px" c="dimmed" tt="uppercase">
                  Pledged
                </Text>
                <Text size="xs" fw={700} c="indigo">
                  {formatCurrency(pledged, project.currency)}
                </Text>
              </div>
              <div>
                <Text size="10px" c="dimmed" tt="uppercase">
                  Received
                </Text>
                <Text size="xs" fw={700} c="teal">
                  {formatCurrency(received, project.currency)}
                </Text>
              </div>
              <div>
                <Text size="10px" c="dimmed" tt="uppercase">
                  {isTargetMet ? "Surplus" : "Remaining"}
                </Text>
                <Text
                  size="xs"
                  fw={700}
                  c={isTargetMet ? "green" : remaining > 0 ? "orange" : "teal"}
                >
                  {isTargetMet
                    ? `+${formatCurrency(surplus, project.currency)}`
                    : formatCurrency(remaining, project.currency)}
                </Text>
              </div>
            </SimpleGrid>
          </Paper>
        </div>

        {/* Action Buttons */}
        <Stack gap="xs" mt="md">
          {/* Share Button (Available for all) */}
          <Button
            size="xs"
            color="teal"
            variant="outline"
            leftSection={<IconShare size={14} />}
            onClick={() => setShareModalOpened(true)}
            fullWidth
          >
            Share Campaign Link
          </Button>

          {isSuperUser ? (
            <>
              <Group grow gap="xs">
                <Button
                  size="xs"
                  color="green"
                  variant="light"
                  leftSection={<IconBrandWhatsapp size={14} />}
                  onClick={() => onAddPledgeOnBehalf && onAddPledgeOnBehalf(project)}
                >
                  + Add Pledge (WhatsApp)
                </Button>

                <Button
                  size="xs"
                  color="grape"
                  variant="light"
                  leftSection={<IconChartBar size={14} />}
                  onClick={() => onViewReport && onViewReport(project)}
                >
                  Report & Donors
                </Button>
              </Group>

              <Group justify="flex-end" gap={6}>
                <Tooltip label="Edit Project Details">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="blue"
                    onClick={() => onEdit && onEdit(project)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete Project">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete && onDelete(project)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </>
          ) : (
            <Group grow>
              <Button
                color="teal"
                size="sm"
                leftSection={<IconHeartHandshake size={16} />}
                onClick={() => onUserPledge && onUserPledge(project)}
              >
                Pledge for this Project
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      {/* Snap Viewer Modal */}
      {selectedPhoto && (
        <Modal
          opened={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title="Project Snap"
          size="lg"
          centered
        >
          <Image src={selectedPhoto} radius="md" />
        </Modal>
      )}

      {/* Share Campaign Modal */}
      <ShareCampaignModal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        project={project}
      />
    </>
  );
}
