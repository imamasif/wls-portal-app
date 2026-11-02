import React, { useState } from "react";
import {
  Modal,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
  FileButton,
  Image,
  Divider,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconUpload,
  IconCheck,
} from "@tabler/icons-react";
import { formatCurrency } from "../currencyUtils";

export function SubmitProofModal({
  opened,
  onClose,
  onSave,
  donation = null,
  loading = false,
}) {
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [comments, setComments] = useState("");

  if (!donation) return null;

  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentProofUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      donationId: donation.id || donation._id,
      paymentProofUrl,
      comments: comments.trim(),
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFileInvoice size={22} color="var(--mantine-color-teal-6)" />
          <Text fw={700} size="lg">
            Submit Payment Proof & Remarks
          </Text>
        </Group>
      }
      size="md"
      radius="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Paper p="sm" withBorder radius="sm" bg="teal.0">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  Your Pledge Commitment:
                </Text>
                <Text size="md" fw={700} c="teal.9">
                  {formatCurrency(donation.pledgeAmount, donation.currency)}
                </Text>
              </div>
              <Badge color="blue" variant="filled">
                {donation.status}
              </Badge>
            </Group>
          </Paper>

          {/* Browse Invoice Proof */}
          <Paper p="sm" withBorder radius="sm">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <div>
                  <Text size="sm" fw={600}>
                    Browse Invoice / Receipt Proof
                  </Text>
                  <Text size="xs" c="dimmed">
                    Attach bank transfer screenshot, receipt, or check copy
                  </Text>
                </div>
                <FileButton
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                >
                  {(props) => (
                    <Button
                      {...props}
                      size="xs"
                      color="teal"
                      variant="light"
                      leftSection={<IconUpload size={14} />}
                    >
                      Browse Snap
                    </Button>
                  )}
                </FileButton>
              </Group>

              {paymentProofUrl ? (
                <Group gap="xs" align="center" mt="xs">
                  <Image
                    src={paymentProofUrl}
                    height={60}
                    width={60}
                    radius="xs"
                    fit="cover"
                    fallbackSrc="https://placehold.co/60x60?text=Invoice"
                  />
                  <div>
                    <Text size="xs" c="teal" fw={600}>
                      Proof file selected
                    </Text>
                    <Button
                      size="compact-xs"
                      color="red"
                      variant="subtle"
                      onClick={() => setPaymentProofUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                </Group>
              ) : (
                <Text size="xs" c="dimmed" fs="italic">
                  No snapshot uploaded yet.
                </Text>
              )}
            </Stack>
          </Paper>

          <Textarea
            label="Comments / Payment Remarks"
            placeholder="Type your transaction reference number, bank remarks, or personal message..."
            minRows={3}
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="teal"
              loading={loading}
              leftSection={<IconCheck size={16} />}
            >
              Submit Proof
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
