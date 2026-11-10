import React from "react";
import { Modal, Box, Group, Button, Text, ThemeIcon, Badge } from "@mantine/core";
import {
  IconFileTypePdf,
  IconDownload,
  IconBrandGoogleDrive,
  IconExternalLink,
} from "@tabler/icons-react";

export function MaintenancePdfModal({
  opened,
  onClose,
  pdfUrl,
  effectiveDate,
  googleDriveLink,
  onUploadDrive,
  uploadingDrive,
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" size="md" radius="md">
            <IconFileTypePdf size={18} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="sm">
              IIPC Canada Building Maintenance Report — PDF Preview
            </Text>
            <Text size="xs" c="dimmed">
              Effective Date: {effectiveDate || "Today"}
            </Text>
          </div>
        </Group>
      }
      size="xl"
      centered
    >
      <Box style={{ height: "72vh", width: "100%" }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }}
            title="Building Maintenance PDF Report"
          />
        ) : (
          <Box
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text c="dimmed">Generating PDF document preview...</Text>
          </Box>
        )}
      </Box>

      <Group justify="space-between" mt="md" wrap="wrap" gap="xs">
        <Group gap="xs">
          {googleDriveLink && (
            <Button
              size="xs"
              color="teal"
              variant="light"
              leftSection={<IconBrandGoogleDrive size={15} />}
              component="a"
              href={googleDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              rightSection={<IconExternalLink size={12} />}
            >
              Open in Google Drive
            </Button>
          )}
          {!googleDriveLink && onUploadDrive && (
            <Button
              size="xs"
              color="indigo"
              variant="light"
              leftSection={<IconBrandGoogleDrive size={15} />}
              onClick={onUploadDrive}
              loading={uploadingDrive}
            >
              Upload to Google Drive
            </Button>
          )}
        </Group>

        <Group gap="xs">
          <Button size="xs" variant="default" onClick={onClose}>
            Close
          </Button>
          {pdfUrl && (
            <Button
              size="xs"
              color="red"
              leftSection={<IconDownload size={15} />}
              component="a"
              href={pdfUrl}
              download
            >
              Download PDF Report
            </Button>
          )}
        </Group>
      </Group>
    </Modal>
  );
}
