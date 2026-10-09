import React from "react";
import {
  Card,
  Group,
  ThemeIcon,
  Text,
  Box,
  Paper,
  Divider,
  Button,
  TextInput,
  Stack,
  List,
  Alert,
  Tooltip,
  ActionIcon,
  Textarea,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconClock,
  IconCheck,
  IconAward,
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconBook,
  IconAlertCircle,
  IconVideoPlus,
  IconHelpCircle,
  IconBrandGoogleDrive,
  IconLink,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { ZoomInviteCard } from "../../wls-management/components/ZoomInviteCard";
import { SubmittedBadgeSticker } from "./SubmittedBadgeSticker";
import { SessionResources } from "./SessionResources";
import { SessionChatSection } from "./SessionChatSection";
import { submitAssessment } from "../api/wlsManagementApi";

const getUserGroup = (groupAssignments, currentUserId) => {
  if (!groupAssignments || typeof groupAssignments !== "object") return null;
  for (const [groupNum, groupData] of Object.entries(groupAssignments)) {
    const isStudent =
      Array.isArray(groupData?.userIds) &&
      groupData.userIds.includes(currentUserId);
    const isAdmin =
      Array.isArray(groupData?.adminIds) &&
      groupData.adminIds.includes(currentUserId);
    if (isStudent || isAdmin) {
      return { groupNumber: groupNum, isStudent, isAdmin, ...groupData };
    }
  }
  return null;
};

const validateGoogleDriveUrl = (url) => {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error:
        "Video URL cannot be empty. Please enter a valid Google Drive link.",
    };
  }
  const isGdrive =
    url.includes("drive.google.com") || url.includes("docs.google.com");
  if (!isGdrive)
    return { isValid: false, error: "Please enter a valid Google Drive link." };
  return { isValid: true, error: null };
};

export function WlsSessionCard({
  session,
  userId,
  currentUser,
  isUpcoming,
  videoUrls,
  completedTasks,
  urlErrors,
  saveSuccess,
  commentInputs,
  commentErrors,
  apiErrors,
  assessmentsMap,
  onUrlChange,
  onSaveVideoUrl,
  onMarkCompleted,
  onPostMessage,
  onAddComment,
  onRefreshChat,
  setCommentInputs,
}) {
  const sessionId = session.id || session._id;
  const userGroup = getUserGroup(session.groupAssignments, userId);
  const currentAssessment = assessmentsMap?.[sessionId];
  const currentStatus = currentAssessment?.status;
  const isCompleted =
    completedTasks[sessionId] ||
    session.status === "COMPLETED" ||
    currentStatus === "COMPLETED";
  const isUnderReview = currentStatus === "UNDER_REVIEW";
  const hasSubmittedUrl =
    Boolean(videoUrls[sessionId]) || currentStatus === "SUBMITTED";

  const handleOpenDriveHelpModal = () => {
    modals.open({
      title: (
        <Group gap="xs">
          <ThemeIcon color="blue" size="md" radius="xl">
            <IconBrandGoogleDrive size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">
            How to Upload & Share Google Drive Video
          </Text>
        </Group>
      ),
      centered: true,
      size: "lg",
      children: (
        <Stack gap="md" py="xs">
          <Text size="sm" c="gray.7">
            Follow these steps to upload your assignment video to Google Drive:
          </Text>
          <Paper withBorder p="sm" radius="md" bg="gray.0">
            <Text fw={700} size="sm" c="indigo.8" mb="xs">
              Step 1: Upload Video to Google Drive
            </Text>
            <List type="ordered" size="sm" spacing="xs">
              <List.Item>
                Go to <strong>drive.google.com</strong> and click{" "}
                <strong>+ New</strong> &gt; <strong>File upload</strong>.
              </List.Item>
            </List>
          </Paper>
          <Paper withBorder p="sm" radius="md" bg="blue.0">
            <Text fw={700} size="sm" c="indigo.8" mb="xs">
              Step 2: Grant Sharing Permissions
            </Text>
            <List type="ordered" size="sm" spacing="xs">
              <List.Item>
                Right-click file &gt; Share &gt; Change Restricted to{" "}
                <strong>"Anyone with the link can view"</strong>.
              </List.Item>
            </List>
          </Paper>
          <Button
            fullWidth
            color="blue"
            mt="xs"
            onClick={() => modals.closeAll()}
          >
            Got It!
          </Button>
        </Stack>
      ),
    });
  };

  const handleMarkCompletedClick = () => {
    const url = videoUrls[sessionId];
    const validation = validateGoogleDriveUrl(url);
    if (!validation.isValid) {
      modals.open({
        title: (
          <Text fw={700} c="red">
            Missing Video Submission
          </Text>
        ),
        centered: true,
        children: (
          <Text size="sm" c="dimmed">
            Please submit a valid video URL before marking task as completed.
          </Text>
        ),
      });
      return;
    }

    modals.openConfirmModal({
      title: (
        <Text fw={700} size="md">
          Confirm Task Completion
        </Text>
      ),
      centered: true,
      children: (
        <Text size="sm" c="dimmed">
          Are you sure you want to mark this task as completed? Once finalized,
          your submission will move to past sessions.
        </Text>
      ),
      labels: { confirm: "Yes, Complete", cancel: "Cancel" },
      confirmProps: { color: "green" },
      onConfirm: () => {
        onMarkCompleted(sessionId, true);
        submitAssessment({
          sessionId,
          userId,
          videoUrl: url,
          submissionUrl: url,
          groupNumber: 1,
          status: "COMPLETED",
        }).catch((err) => console.error(err));
      },
    });
  };

  const handleRequestAbsence = () => {
    let reasonText = "";
    modals.openConfirmModal({
      title: (
        <Text fw={700} size="md">
          Request Absence
        </Text>
      ),
      centered: true,
      children: (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Please provide a reason for requesting absence:
          </Text>
          <Textarea
            placeholder="Enter reason..."
            minRows={3}
            onChange={(e) => {
              reasonText = e.currentTarget.value;
            }}
          />
        </Stack>
      ),
      labels: { confirm: "Submit Absence Request", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        if (!reasonText.trim()) return;
        const userName = currentUser?.name || currentUser?.fullName || "User";
        try {
          await onPostMessage(sessionId, {
            senderId: userId,
            senderName: userName,
            senderRole: currentUser?.role || "USER",
            text: `[ABSENCE REQUEST]: ${reasonText}`,
          });
        } catch (err) {}
      },
    });
  };

  return (
    <Card
      withBorder
      shadow="xl"
      radius="lg"
      p="xl"
      mb="xl"
      w="100%"
      style={{
        borderWidth: "2px",
        borderColor: isCompleted
          ? "var(--mantine-color-green-6)"
          : isUnderReview
            ? "var(--mantine-color-orange-6)"
            : hasSubmittedUrl
              ? "var(--mantine-color-blue-6)"
              : "var(--mantine-color-gray-3)",
        background: isCompleted
          ? "linear-gradient(135deg, #f4fdf6 0%, #e6fcf5 100%)"
          : isUnderReview
            ? "linear-gradient(135deg, #fff9db 0%, #fff3bf 100%)"
            : hasSubmittedUrl
              ? "linear-gradient(135deg, #f4f8ff 0%, #e7f5ff 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
      }}
    >
      <Group justify="space-between" align="center" mb="md">
        <Group gap="xs">
          <ThemeIcon
            size="lg"
            radius="xl"
            color={
              isCompleted
                ? "green"
                : isUnderReview
                  ? "orange"
                  : hasSubmittedUrl
                    ? "blue"
                    : "gray"
            }
            variant="filled"
          >
            {isCompleted ? (
              <IconAward size={22} />
            ) : isUnderReview ? (
              <IconClock size={20} />
            ) : hasSubmittedUrl ? (
              <IconCheck size={20} />
            ) : (
              <IconClock size={20} />
            )}
          </ThemeIcon>
          <Box>
            <Text
              fw={800}
              size="lg"
              c={
                isCompleted
                  ? "green.9"
                  : isUnderReview
                    ? "orange.9"
                    : hasSubmittedUrl
                      ? "blue.9"
                      : "dark.8"
              }
            >
              {session.title ||
                session.topicName ||
                session.sessionName ||
                "WLS Study Session"}
            </Text>
            <Text size="xs" c="dimmed">
              {session.sessionDate
                ? new Date(session.sessionDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </Text>
          </Box>
        </Group>

        {isCompleted ? (
          <SubmittedBadgeSticker text="COMPLETED" isCompleted={true} />
        ) : isUnderReview ? (
          <SubmittedBadgeSticker text="UNDER REVIEW" isUnderReview={true} />
        ) : hasSubmittedUrl ? (
          <SubmittedBadgeSticker text="SUBMITTED" isCompleted={false} />
        ) : (
          <Box
            px="md"
            py={6}
            style={{
              background: "#ced4da",
              color: "#fff",
              borderRadius: "20px",
              fontWeight: 800,
              fontSize: "12px",
            }}
          >
            ⏳ PENDING
          </Box>
        )}
      </Group>

      <ZoomInviteCard
        session={session}
        isUpcoming={isUpcoming && !isCompleted}
      />
      <SessionResources session={session} />

      {userGroup && (
        <Paper
          withBorder
          p="md"
          mt="md"
          radius="md"
          bg={isCompleted ? "green.0" : hasSubmittedUrl ? "blue.0" : "gray.0"}
        >
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <ThemeIcon
                color={
                  isCompleted ? "green" : hasSubmittedUrl ? "blue" : "indigo"
                }
                size="sm"
                variant="light"
              >
                <IconUsers size={16} />
              </ThemeIcon>
              <Text fw={700} size="sm">
                Your Assignment: Group {userGroup.groupNumber}
              </Text>
            </Group>
            {!isCompleted && (
              <Button
                size="xs"
                variant="outline"
                color="red"
                leftSection={<IconUserX size={12} />}
                onClick={handleRequestAbsence}
              >
                Request Absence
              </Button>
            )}
          </Group>

          <Divider my="xs" />

          <Group gap="xs" mb="xs">
            <ThemeIcon color="orange" size="xs" variant="light">
              <IconUserCheck size={14} />
            </ThemeIcon>
            <Text size="xs" fw={600}>
              Admin(s):{" "}
              <Text span size="xs" c="dimmed">
                {userGroup.admins?.map((a) => a.name).join(", ") || "None"}
              </Text>
            </Text>
          </Group>

          {/* Assigned Ayats / Verses Section */}
          {Array.isArray(userGroup.selectedAyats) &&
            userGroup.selectedAyats.length > 0 && (
              <Paper withBorder p="sm" mb="md" radius="sm" bg="white">
                <Group gap="xs" mb="xs">
                  <ThemeIcon color="blue" size="sm" variant="light">
                    <IconBook size={16} />
                  </ThemeIcon>
                  <Text size="sm" fw={700} c="dark.7" tt="uppercase">
                    Assigned Ayats / Verses
                  </Text>
                </Group>
                <List
                  spacing="xs"
                  size="sm"
                  center
                  icon={
                    <ThemeIcon color="blue" size={18} radius="xl">
                      <IconBook size={12} />
                    </ThemeIcon>
                  }
                >
                  {userGroup.selectedAyats.map((ayat, idx) => (
                    <List.Item key={idx}>
                      <Text size="sm" fw={600} c="dark.8">
                        {typeof ayat === "string"
                          ? ayat
                          : `${ayat.surahName || "Surah"}:${ayat.verseNumber}`}
                      </Text>
                    </List.Item>
                  ))}
                </List>
              </Paper>
            )}

          {userGroup.instructions && (
            <Paper withBorder p="sm" mb="md" radius="sm" bg="white">
              <Text size="sm" fw={700} c="dark.7" tt="uppercase" mb={4}>
                Instructions
              </Text>
              <Text size="sm" c="gray.8" style={{ whiteSpace: "pre-wrap" }}>
                {userGroup.instructions}
              </Text>
            </Paper>
          )}

          {apiErrors[sessionId] && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="API Notice"
              color="yellow"
              mt="md"
            >
              {apiErrors[sessionId]}
            </Alert>
          )}

          <Paper withBorder p="md" mt="md" radius="md" bg="white">
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <ThemeIcon color="blue" size="md" variant="light">
                  <IconVideoPlus size={20} />
                </ThemeIcon>
                <Text size="xs" fw={700} c="gray.8" tt="uppercase">
                  Submit Assignment Video URL
                </Text>
              </Group>
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                radius="xl"
                onClick={handleOpenDriveHelpModal}
              >
                <IconHelpCircle size={18} />
              </ActionIcon>
            </Group>

            <Group align="flex-start">
              <TextInput
                style={{ flex: 1 }}
                placeholder="https://drive.google.com/file/d/..."
                value={videoUrls[sessionId] || ""}
                readOnly={isCompleted}
                onChange={(e) => onUrlChange(sessionId, e.target.value)}
                error={!!urlErrors[sessionId]}
                leftSection={<IconBrandGoogleDrive size={18} color="#1f1f1f" />}
              />
              {!isCompleted && (
                <Button
                  color={saveSuccess[sessionId] ? "teal" : "blue"}
                  onClick={() =>
                    onSaveVideoUrl(
                      sessionId,
                      validateGoogleDriveUrl(videoUrls[sessionId]),
                      videoUrls[sessionId],
                    )
                  }
                  leftSection={
                    saveSuccess[sessionId] ? (
                      <IconCheck size={16} />
                    ) : (
                      <IconLink size={16} />
                    )
                  }
                >
                  {saveSuccess[sessionId] ? "Saved" : "Save Video URL"}
                </Button>
              )}
            </Group>

            {!isCompleted && (
              <Button
                fullWidth
                color="green"
                mt="md"
                size="md"
                leftSection={<IconCheck size={18} />}
                onClick={handleMarkCompletedClick}
              >
                Mark Task as Completed
              </Button>
            )}

            {urlErrors[sessionId] && (
              <Alert
                icon={<IconAlertTriangle size={16} />}
                color="red"
                variant="light"
                mt="xs"
                p="xs"
              >
                <Text size="xs" fw={500}>
                  {urlErrors[sessionId]}
                </Text>
              </Alert>
            )}
          </Paper>

          <SessionChatSection
            sessionId={sessionId}
            messages={assessmentsMap[sessionId]?.messages || []}
            isCompleted={isCompleted}
            commentInput={commentInputs[sessionId]}
            commentError={commentErrors[sessionId]}
            onCommentChange={(e) =>
              setCommentInputs((prev) => ({
                ...prev,
                [sessionId]: e.target.value,
              }))
            }
            onAddComment={() => onAddComment(sessionId)}
            onRefreshChat={() => onRefreshChat(sessionId)}
            onAddEmoji={(emoji) =>
              setCommentInputs((prev) => ({
                ...prev,
                [sessionId]: (prev[sessionId] || "") + emoji,
              }))
            }
          />
        </Paper>
      )}
    </Card>
  );
}
