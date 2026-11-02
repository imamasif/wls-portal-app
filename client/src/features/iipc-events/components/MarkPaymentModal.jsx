import React, { useState, useEffect } from "react";
import {
  Modal,
  NumberInput,
  Select,
  TextInput,
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
  IconCheck,
  IconCoin,
  IconCalendar,
  IconUpload,
  IconFileInvoice,
} from "@tabler/icons-react";
import { CURRENCIES, getCurrencySymbol, formatCurrency } from "../currencyUtils";

export function MarkPaymentModal({
  opened,
  onClose,
  onSave,
  donation = null,
  loading = false,
}) {
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [receivedCurrency, setReceivedCurrency] = useState("CAD");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (donation) {
      setReceivedAmount(
        donation.receivedAmount > 0
          ? donation.receivedAmount
          : donation.pledgeAmount || 0
      );
      setReceivedCurrency(donation.receivedCurrency || donation.currency || "CAD");
      setReceivedDate(
        donation.receivedDate
          ? new Date(donation.receivedDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setPaymentProofUrl(donation.paymentProofUrl || "");
      setComments("");
    }
  }, [donation, opened]);

  if (!donation) return null;

  const pledgeAmount = donation.pledgeAmount || 0;
  const pledgeCurrency = donation.currency || "CAD";
  const lacking = Math.max(0, pledgeAmount - receivedAmount);
  const surplus = Math.max(0, receivedAmount - pledgeAmount);

  // File upload for receipt proof
  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentProofUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMarkFull = () => {
    setReceivedAmount(pledgeAmount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      donationId: donation.id || donation._id,
      receivedAmount: Number(receivedAmount) || 0,
      receivedCurrency,
      receivedDate,
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
          <IconCoin size={22} color="var(--mantine-color-teal-6)" />
          <Text fw={700} size="lg">
            Record / Update Received Payment
          </Text>
        </Group>
      }
      size="md"
      radius="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Donor Info Banner */}
          <Paper p="sm" withBorder radius="sm" bg="gray.0">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed">
                  Donor
                </Text>
                <Text fw={700} size="sm">
                  {donation.donorName}
                </Text>
                <Text size="xs" c="dimmed">
                  {donation.donorEmail}
                </Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text size="xs" c="dimmed">
                  Pledged Commitment
                </Text>
                <Badge size="lg" color="indigo" variant="light">
                  {formatCurrency(pledgeAmount, pledgeCurrency)}
                </Badge>
              </div>
            </Group>
          </Paper>

          {/* Quick full payment helper */}
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Quick action:
            </Text>
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconCheck size={14} />}
              onClick={handleMarkFull}
            >
              Fill Full Pledged Amount ({formatCurrency(pledgeAmount, pledgeCurrency)})
            </Button>
          </Group>

          <Group grow>
            <NumberInput
              label="Money Received"
              placeholder="Amount collected"
              required
              min={0}
              value={receivedAmount}
              onChange={(val) => setReceivedAmount(val || 0)}
              leftSection={
                <Text size="sm" fw={700} c="teal">
                  {getCurrencySymbol(receivedCurrency)}
                </Text>
              }
            />

            <Select
              label="Received Country Currency"
              description="Track country money"
              data={CURRENCIES}
              value={receivedCurrency}
              onChange={(val) => setReceivedCurrency(val || "CAD")}
              searchable
              required
            />
          </Group>

          <TextInput
            label="Payment Received Date"
            type="date"
            required
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.currentTarget.value)}
            leftSection={<IconCalendar size={16} />}
          />

          {/* Payment Status Preview */}
          <Paper p="xs" withBorder radius="sm" bg={surplus > 0 ? "blue.0" : lacking === 0 ? "teal.0" : "orange.0"}>
            <Group justify="space-between">
              <div>
                <Text size="xs" fw={600}>
                  Payment Reconciliation:
                </Text>
                <Text size="xs">
                  {surplus > 0
                    ? `Over-collected by ${formatCurrency(surplus, receivedCurrency)}`
                    : lacking === 0
                    ? "Target met: 100% Collected"
                    : `Remaining balance / lacking: ${formatCurrency(lacking, pledgeCurrency)}`}
                </Text>
              </div>
              <Badge
                color={surplus > 0 ? "cyan" : lacking === 0 ? "green" : receivedAmount > 0 ? "orange" : "red"}
                variant="filled"
              >
                {surplus > 0
                  ? "Overpaid / Surplus"
                  : lacking === 0
                  ? "Fully Received"
                  : receivedAmount > 0
                  ? "Partially Received"
                  : "Unpaid / Pledged"}
              </Badge>
            </Group>
          </Paper>

          {/* Proof Upload */}
          <Paper p="xs" withBorder radius="sm">
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconFileInvoice size={18} color="var(--mantine-color-blue-6)" />
                <Text size="xs" fw={600}>
                  Payment Proof / Invoice Snapshot
                </Text>
              </Group>
              <FileButton
                onChange={handleFileSelect}
                accept="image/png,image/jpeg,image/webp,application/pdf"
              >
                {(props) => (
                  <Button
                    {...props}
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<IconUpload size={14} />}
                  >
                    Browse Receipt Pic
                  </Button>
                )}
              </FileButton>
            </Group>

            {paymentProofUrl ? (
              <Group gap="xs" align="center">
                <Image
                  src={paymentProofUrl}
                  height={50}
                  width={50}
                  radius="xs"
                  fit="cover"
                  fallbackSrc="https://placehold.co/50x50?text=Receipt"
                />
                <Text size="xs" c="teal" fw={600}>
                  Proof snapshot attached
                </Text>
                <Button
                  size="compact-xs"
                  color="red"
                  variant="subtle"
                  onClick={() => setPaymentProofUrl("")}
                >
                  Remove
                </Button>
              </Group>
            ) : (
              <Text size="xs" c="dimmed">
                No receipt snapshot attached yet.
              </Text>
            )}
          </Paper>

          <Textarea
            label="Comments / Transaction Remarks"
            placeholder="e.g. Received via Interac E-transfer ref #1234567, deposited into community account..."
            minRows={2}
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="teal" loading={loading}>
              Save Payment Record
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
