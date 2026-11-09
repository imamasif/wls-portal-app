import React from "react";
import {
  Modal,
  Paper,
  Box,
  Text,
  Title,
  Group,
  Stack,
  Button,
  Badge,
  Divider,
} from "@mantine/core";
import { IconPrinter, IconAward, IconCheck } from "@tabler/icons-react";

export function CertificateModal({ certificate, opened, onClose }) {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = certificate.issuedDate
    ? new Date(certificate.issuedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={<Text fw={600}>Official University Certificate</Text>}
      centered
    >
      <Box id="printable-certificate" p={{ base: "xs", sm: "md" }}>
        <Paper
          p={{ base: "md", sm: 40 }}
          radius="md"
          style={{
            border: "8px double #1e3a8a",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Top Crest / Icon */}
          <Box mb="md">
            <IconAward
              size={54}
              color="#d97706"
              style={{ margin: "0 auto", display: "block" }}
            />
          </Box>

          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="blue.9"
            style={{ letterSpacing: "2px" }}
          >
            IIPC - International Islamic Propagation Center Canada University
          </Text>
          <Title
            order={2}
            c="indigo.9"
            style={{
              fontFamily: "Georgia, serif",
              letterSpacing: "1px",
              marginTop: "4px",
              marginBottom: "8px",
            }}
          >
            OFFICIAL CERTIFICATION BOARD
          </Title>

          <Divider
            my="md"
            style={{ borderColor: "#d97706", width: "60%", margin: "0 auto" }}
          />

          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mt="md">
            This Official Certificate is Awarded to
          </Text>

          <Title
            order={1}
            my="sm"
            c="dark.9"
            style={{
              fontFamily: "Georgia, serif",
              textDecoration: "underline",
              textDecorationColor: "#d97706",
              textUnderlineOffset: "6px",
            }}
          >
            {certificate.studentName}
          </Title>

          <Group justify="center" gap="md" mb="md">
            <Badge size="md" color="indigo" variant="outline">
              Roll No: {certificate.rollNumber}
            </Badge>
            <Badge size="md" color="teal" variant="filled">
              Status: {certificate.grade || "PASSED"}
            </Badge>
          </Group>

          <Text
            size="sm"
            c="gray.7"
            maw={520}
            mx="auto"
            style={{ lineHeight: 1.6 }}
          >
            for successfully satisfying and completing all coursework, sequential
            lectures, assignments, and examinations for
          </Text>

          <Title order={3} c="blue.8" my="md" style={{ fontFamily: "Georgia, serif" }}>
            {certificate.title}
          </Title>

          <Divider my="xl" style={{ borderColor: "#cbd5e1" }} />

          {/* Signatures & Verification */}
          <Group justify="space-between" align="flex-end" px={{ base: 0, sm: "xl" }} mt="xl">
            <Stack gap={2} align="center">
              <Box
                style={{
                  borderBottom: "1px solid #64748b",
                  width: "160px",
                  height: "30px",
                  fontFamily: "cursive",
                  fontSize: "18px",
                  color: "#1e3a8a",
                }}
              >
                Muhammad Shaikh
              </Box>
              <Text size="xs" fw={700} c="gray.8">
                Vice Chancellor
              </Text>
              <Text size="10px" c="dimmed">
                Muhammad Shaikh
              </Text>
            </Stack>

            <Stack gap={2} align="center">
              <Badge color="green" variant="light" size="sm">
                <IconCheck size={12} style={{ marginRight: "4px" }} /> Verified Document
              </Badge>
              <Text size="10px" c="dimmed" mt={4}>
                Certificate #{certificate.certificateNumber}
              </Text>
              <Text size="10px" c="dimmed">
                Issued on: {formattedDate}
              </Text>
            </Stack>

            <Stack gap={2} align="center">
              <Box
                style={{
                  borderBottom: "1px solid #64748b",
                  width: "160px",
                  height: "30px",
                  fontFamily: "cursive",
                  fontSize: "18px",
                  color: "#1e3a8a",
                }}
              >
                Academic Council
              </Box>
              <Text size="xs" fw={700} c="gray.8">
                Registrar & Controller
              </Text>
              <Text size="10px" c="dimmed">
                Examinations Board
              </Text>
            </Stack>
          </Group>
        </Paper>

        <Group justify="flex-end" mt="md">
          <Button
            leftSection={<IconPrinter size={16} />}
            color="indigo"
            onClick={handlePrint}
          >
            Print / Save PDF
          </Button>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
