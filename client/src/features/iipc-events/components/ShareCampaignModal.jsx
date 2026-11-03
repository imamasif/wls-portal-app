import React from "react";
import {
  Modal,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  Button,
  CopyButton,
  ActionIcon,
  Tooltip,
  Paper,
  SimpleGrid,
  Badge,
  Divider,
} from "@mantine/core";
import {
  IconShare,
  IconCopy,
  IconCheck,
  IconBrandWhatsapp,
  IconBrandFacebook,
  IconBrandX,
  IconBrandTelegram,
  IconMail,
  IconHeartHandshake,
} from "@tabler/icons-react";
import { formatCurrency } from "../currencyUtils";

export function ShareCampaignModal({ opened, onClose, project }) {
  if (!project) return null;

  const eventId = project.id || project._id;
  const baseUrl = window.location.origin;
  const campaignUrl = `${baseUrl}/?event=${eventId}`;

  const shareTitle = `Support ${project.title} - IIPC Canada`;
  const shareText = `Assalamu Alaikum wa Rahmatullahi wa Barakatuh,\n\nPlease support our charitable project appeal: "${project.title}"\n🎯 Funding Target: ${formatCurrency(
    project.targetAmount,
    project.currency
  )}\n\nCRA Registered Charity: #80654 8632 RR0001 (Tax Deductible)\n\n👉 Donate or Pledge directly online here:\n${campaignUrl}\n\nPlease share with your family and friends to spread the blessing. JazakAllah Khair!`;

  const handleSocialShare = (platform) => {
    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Please support "${project.title}" - IIPC Canada CRA #806548632RR0001: ${campaignUrl}`
        )}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(
          campaignUrl
        )}&text=${encodeURIComponent(shareTitle)}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(
          shareTitle
        )}&body=${encodeURIComponent(shareText)}`;
        break;
      default:
        break;
    }
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconShare size={22} color="var(--mantine-color-teal-6)" />
          <Text fw={700} size="lg">
            Share Campaign & Propagate Donation Appeal
          </Text>
        </Group>
      }
      size="md"
      radius="md"
    >
      <Stack gap="md">
        {/* Campaign Mini Summary */}
        <Paper p="sm" withBorder radius="sm" bg="teal.0">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed">
                Active Campaign
              </Text>
              <Text fw={700} size="sm" c="teal.9">
                {project.title}
              </Text>
            </div>
            <Badge color="teal" variant="filled">
              {formatCurrency(project.targetAmount, project.currency)}
            </Badge>
          </Group>
        </Paper>

        {/* Public Share Link Input */}
        <div>
          <Text size="xs" fw={600} mb={4}>
            Public Donation Link (No login required for donors)
          </Text>
          <Group gap="xs">
            <TextInput
              value={campaignUrl}
              readOnly
              style={{ flex: 1 }}
              size="sm"
            />
            <CopyButton value={campaignUrl}>
              {({ copied, copy }) => (
                <Button
                  color={copied ? "green" : "teal"}
                  onClick={copy}
                  leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              )}
            </CopyButton>
          </Group>
        </div>

        <Divider label="Share Instantly via Social Channels" labelPosition="center" />

        {/* Social Share Buttons */}
        <SimpleGrid cols={2} spacing="xs">
          <Button
            color="green"
            variant="filled"
            leftSection={<IconBrandWhatsapp size={18} />}
            onClick={() => handleSocialShare("whatsapp")}
          >
            WhatsApp
          </Button>

          <Button
            color="blue.7"
            variant="filled"
            leftSection={<IconBrandFacebook size={18} />}
            onClick={() => handleSocialShare("facebook")}
          >
            Facebook
          </Button>

          <Button
            color="dark"
            variant="filled"
            leftSection={<IconBrandX size={18} />}
            onClick={() => handleSocialShare("twitter")}
          >
            X (Twitter)
          </Button>

          <Button
            color="cyan"
            variant="filled"
            leftSection={<IconBrandTelegram size={18} />}
            onClick={() => handleSocialShare("telegram")}
          >
            Telegram
          </Button>
        </SimpleGrid>

        <Button
          variant="default"
          leftSection={<IconMail size={16} />}
          onClick={() => handleSocialShare("email")}
          fullWidth
        >
          Share via Email
        </Button>

        {/* Preformatted Message Copy */}
        <Paper p="xs" radius="sm" bg="gray.0" withBorder>
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600} c="dimmed">
              Pre-Drafted Message Preview:
            </Text>
            <CopyButton value={shareText}>
              {({ copied, copy }) => (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color={copied ? "teal" : "gray"}
                  leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                  onClick={copy}
                >
                  {copied ? "Copied" : "Copy Message"}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Text size="11px" c="gray.7" style={{ whiteSpace: "pre-line" }}>
            {shareText}
          </Text>
        </Paper>
      </Stack>
    </Modal>
  );
}
