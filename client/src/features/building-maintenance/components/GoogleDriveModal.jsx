import React from "react";
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Paper,
  Badge,
  ThemeIcon,
  Divider,
  Alert,
} from "@mantine/core";
import {
  IconBrandGoogleDrive,
  IconCheck,
  IconExternalLink,
  IconUpload,
  IconCloudCheck,
} from "@tabler/icons-react";

export function GoogleDriveModal({
  opened,
  onClose,
  report,
  onUpload,
  uploading,
}) {
  const hasDriveLink = Boolean(report?.googleDriveLink);
  const driveLink = report?.googleDriveLink;
  const uploadedAt = report?.googleDriveUploadedAt
    ? new Date(report.googleDriveUploadedAt).toLocaleString()
    : null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="teal" size="md" radius="md">
            <IconBrandGoogleDrive size={20} />
          </ThemeIcon>
          <Text fw={700} size="sm">
            Google Drive Report Repository
          </Text>
        </Group>
      }
      size="md"
      centered
    >
      <Stack gap="md">
        <Text size="xs" c="dimmed">
          Official Building Manager &amp; Maintenance daily reports are automatically saved and uploaded
          to the authorized Google Drive organization folder.
        </Text>

        <Paper p="sm" withBorder radius="md" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <IconCloudCheck size={18} color="#16a34a" />
                <Text size="xs" fw={700} c="teal.9">
                  Google Drive Status:
                </Text>
              </Group>
              <Badge color={hasDriveLink ? "green" : "orange"} size="sm" variant="filled">
                {hasDriveLink ? "Synced to Drive" : "Ready to Upload"}
              </Badge>
            </Group>

            {hasDriveLink && (
              <>
                <Text size="xs" c="dark.7">
                  <strong>Uploaded Timestamp:</strong> {uploadedAt || "Recorded"}
                </Text>
                {report?.googleDriveFileId && (
                  <Text size="xs" c="dimmed">
                    <strong>File ID:</strong> {report.googleDriveFileId}
                  </Text>
                )}
              </>
            )}
          </Stack>
        </Paper>

        <Paper p="sm" withBorder radius="md" style={{ background: "#f8fafc" }}>
          <Stack gap={4}>
            <Text size="xs" fw={700} c="dark.8">
              Target Destination Folder:
            </Text>
            <Text size="11px" c="dimmed" style={{ wordBreak: "break-all" }}>
              Google Drive ID: <code>1xfPlSXmPK6QsbeJQMlkLBmy1fFhUtVuP</code>
            </Text>
            <Text size="11px" c="dimmed">
              Organization: IIPC Canada Building Manager &amp; Maintenance Archive
            </Text>
          </Stack>
        </Paper>

        {hasDriveLink && (
          <Alert icon={<IconCheck size={16} />} color="teal" radius="sm">
            Report PDF is safely saved in the cloud. You can open and view it in Google Drive at any time.
          </Alert>
        )}

        <Group justify="space-between" mt="sm">
          <Button size="xs" variant="default" onClick={onClose}>
            Close
          </Button>

          <Group gap="xs">
            <Button
              size="xs"
              color="indigo"
              variant={hasDriveLink ? "light" : "filled"}
              leftSection={<IconUpload size={14} />}
              onClick={onUpload}
              loading={uploading}
            >
              {hasDriveLink ? "Re-upload to Drive" : "Upload to Google Drive"}
            </Button>

            {hasDriveLink && (
              <Button
                size="xs"
                color="teal"
                variant="filled"
                leftSection={<IconBrandGoogleDrive size={15} />}
                component="a"
                href={driveLink}
                target="_blank"
                rel="noopener noreferrer"
                rightSection={<IconExternalLink size={12} />}
              >
                Open in Google Drive
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
