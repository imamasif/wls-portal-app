// src/features/wls-assessment/components/WlsAssignedMembers.jsx
import React from "react";
import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  ThemeIcon,
  UnstyledButton,
  Paper,
  Box,
} from "@mantine/core";
import { IconUsers, IconUser } from "@tabler/icons-react";
import { ASSESSMENT_STATUSES } from "../../../config/constants";

export function WlsAssignedMembers({
  assignedUsers,
  selectedUserId,
  onUserSelect,
  currentAdminId,
  currentAdminName,
}) {
  const getAdminMemberStatus = (member) => {
    const evaluations = Array.isArray(member?.evaluations)
      ? member.evaluations
      : [];

    const adminIdStr = currentAdminId ? String(currentAdminId).trim() : "";
    const adminNameStr = currentAdminName
      ? String(currentAdminName).trim()
      : "";

    // Find the evaluation created specifically by THIS logged-in admin
    const myEval = evaluations.find((e) => {
      const eId = e?.evaluatorId ? String(e.evaluatorId).trim() : "";
      const eName = e?.evaluatorName ? String(e.evaluatorName).trim() : "";
      return (
        (adminIdStr && eId === adminIdStr) ||
        (adminNameStr && eName === adminNameStr) ||
        eId === "admin-default"
      );
    });

    // 1. Overall Super User Finalized
    if (member?.status === ASSESSMENT_STATUSES.COMPLETED) {
      return (
        <Badge size="xs" color="teal" variant="filled">
          COMPLETED
        </Badge>
      );
    }

    // 2. THIS Admin finished grading
    if (
      myEval?.status === ASSESSMENT_STATUSES.REVIEWED ||
      myEval?.status === ASSESSMENT_STATUSES.COMPLETED
    ) {
      return (
        <Badge size="xs" color="indigo" variant="filled">
          REVIEWED
        </Badge>
      );
    }

    // 3. THIS Admin saved draft
    if (myEval?.status === ASSESSMENT_STATUSES.PARTIAL_SAVED) {
      return (
        <Badge size="xs" color="orange" variant="filled">
          PARTIAL_SAVED
        </Badge>
      );
    }

    // 4. Student submitted video, but THIS Admin hasn't graded yet
    if (member?.submissionUrl || member?.adminSubmissionUrl) {
      return (
        <Badge size="xs" color="blue" variant="filled">
          SUBMITTED
        </Badge>
      );
    }

    // 5. No video submitted
    return (
      <Badge size="xs" color="red" variant="filled">
        PENDING
      </Badge>
    );
  };

  return (
    <Card shadow="xs" padding="lg" radius="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon size="lg" radius="xl" color="blue" variant="light">
            <IconUsers size={20} />
          </ThemeIcon>
          <Text fw={800} size="md" c="dark">
            Assigned Members
          </Text>
        </Group>
        <Badge color="blue" variant="filled" radius="sm">
          {assignedUsers.length}
        </Badge>
      </Group>

      <Stack gap="xs">
        {assignedUsers.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" py="md">
            No members assigned to you for this session.
          </Text>
        ) : (
          assignedUsers.map((item) => {
            const isSelected = selectedUserId === item.id;

            return (
              <Paper
                key={item.id}
                component={UnstyledButton}
                onClick={() => onUserSelect(item)}
                p="sm"
                radius="md"
                withBorder
                style={{
                  display: "block",
                  width: "100%",
                  cursor: "pointer",
                  backgroundColor: isSelected
                    ? "var(--mantine-color-blue-0)"
                    : "#ffffff",
                  borderColor: isSelected
                    ? "var(--mantine-color-blue-5)"
                    : "var(--mantine-color-gray-3)",
                  borderWidth: isSelected ? 2 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                <Group justify="space-between" wrap="nowrap" align="center">
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={isSelected ? "blue" : "gray"}
                      variant={isSelected ? "filled" : "light"}
                    >
                      <IconUser size={16} />
                    </ThemeIcon>

                    <Box>
                      <Text fw={700} size="sm" c="dark">
                        {item.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Group {item.groupNumber}
                      </Text>
                    </Box>
                  </Group>

                  {getAdminMemberStatus(item)}
                </Group>
              </Paper>
            );
          })
        )}
      </Stack>
    </Card>
  );
}
