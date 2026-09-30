import React from "react";
import {
  Stack,
  Alert,
  Paper,
  Group,
  Badge,
  Text,
  Card,
  SimpleGrid,
  Anchor,
  Button,
} from "@mantine/core";
import {
  IconBellRinging,
  IconHeartHandshake,
  IconExternalLink,
  IconBrandYoutube,
} from "@tabler/icons-react";

export function DonationReminderSection() {
  return (
    <Stack gap="md" mb="lg">
      <Alert
        icon={<IconBellRinging size={18} />}
        title="Monthly Reminder: Sadqa / Zakat / Support"
        color="orange"
        radius="md"
      >
        This is a reminder to send in your Monthly Donations / Sadqa / Zakat.
      </Alert>

      <Paper
        p="md"
        radius="lg"
        style={{ backgroundColor: "#fff7ed", border: "1px solid #ffedd5" }}
      >
        <Group gap="xs" mb={4}>
          <Badge color="orange" variant="filled">
            ⚡ URGENT NEED
          </Badge>
          <Text fw={700} size="sm" c="orange.9">
            AI-Related Video Production Work
          </Text>
        </Group>
        <Text size="xs" c="dark.8">
          Support is urgently required for AI-related work for Muhammad Shaikh
          (MS) Videos to expand reach and video production!
        </Text>
      </Paper>

      <Card
        withBorder
        padding="md"
        radius="lg"
        shadow="sm"
        style={{ borderLeft: "5px solid #0284c7", backgroundColor: "#ffffff" }}
      >
        <Group gap="xs" mb="xs">
          <IconHeartHandshake color="#0284c7" size={20} />
          <Text fw={700} size="sm" c="sky.9">
            💳 How to Donate (50/50 Split Guidance)
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mb={12}>
          Whatever amount you wish to donate, please divide it 50/50 between
          IIPC Canada and Br. Muhammad Shaikh Consultation:
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          <Anchor
            href="https://iipccanada.com/donate/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="light"
              color="blue"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              50% IIPC Canada Donation
            </Button>
          </Anchor>
          <Anchor
            href="https://www.muhammadshaikh.com/consultation/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="light"
              color="orange"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              50% MS Consultation
            </Button>
          </Anchor>
        </SimpleGrid>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Card
          withBorder
          padding="xs"
          radius="md"
          style={{ backgroundColor: "#fafafa" }}
        >
          <Text size="xs" fw={700} c="dark.8" mb={4}>
            📢 Marketing & Promotion Lecture
          </Text>
          <Anchor
            href="https://youtu.be/mXp2MmQsx6A?si=nO0VLN7MH-zM_uFC"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="subtle"
              color="red"
              size="xs"
              fullWidth
              leftSection={<IconBrandYoutube size={14} />}
            >
              Marketing kay experts ko dawat? (6/7)
            </Button>
          </Anchor>
        </Card>

        <Card
          withBorder
          padding="xs"
          radius="md"
          style={{ backgroundColor: "#fafafa" }}
        >
          <Text size="xs" fw={700} c="dark.8" mb={4}>
            🤲 Sadaqa / Charity Lecture
          </Text>
          <Anchor
            href="https://youtu.be/sP69wV-FTzU?si=DQp0LoTpyN7ghVaz"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="subtle"
              color="red"
              size="xs"
              fullWidth
              leftSection={<IconBrandYoutube size={14} />}
            >
              Kaisay Sadaqa / Charity ko Taqseem Karain? (7/7)
            </Button>
          </Anchor>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
