import React, { useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Badge,
  Table,
  Button,
  TextInput,
  Select,
  ActionIcon,
  Modal,
  Image,
  Progress,
  Tooltip,
} from "@mantine/core";
import {
  IconSearch,
  IconCoin,
  IconCheck,
  IconAlertCircle,
  IconFileInvoice,
  IconUser,
  IconClock,
  IconArrowUpRight,
  IconArrowDownRight,
  IconPrinter,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import { formatCurrency, getCurrencySymbol } from "../currencyUtils";

export function EventReportSection({
  reportData,
  onMarkPayment,
  isSuperUser = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [previewProofUrl, setPreviewProofUrl] = useState(null);

  if (!reportData || !reportData.event) {
    return (
      <Paper p="xl" withBorder radius="md" ta="center">
        <Text c="dimmed">No report data available.</Text>
      </Paper>
    );
  }

  const { event, summary, donors = [] } = reportData;
  const currency = summary.currency || event.currency || "CAD";

  // Filter donors by search query and status
  const filteredDonors = donors.filter((d) => {
    const matchesSearch =
      (d.donorName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.donorEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.comments || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PAID" && (d.status === "RECEIVED" || d.status === "OVERPAID" || d.isFullyPaid)) ||
      (statusFilter === "UNPAID" && d.status === "PLEDGED" && (!d.receivedAmount || d.receivedAmount === 0)) ||
      (statusFilter === "PARTIAL" && d.status === "PARTIALLY_RECEIVED") ||
      d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (donation) => {
    if (donation.status === "OVERPAID" || (donation.receivedAmount > donation.pledgeAmount && donation.pledgeAmount > 0)) {
      return (
        <Badge color="cyan" variant="filled">
          Overpaid (+{formatCurrency(donation.receivedAmount - donation.pledgeAmount, donation.receivedCurrency)})
        </Badge>
      );
    }
    if (donation.status === "RECEIVED" || donation.isFullyPaid) {
      return (
        <Badge color="green" variant="filled" leftSection={<IconCheck size={12} />}>
          Fully Received
        </Badge>
      );
    }
    if (donation.status === "PARTIALLY_RECEIVED" || (donation.receivedAmount > 0 && donation.receivedAmount < donation.pledgeAmount)) {
      return (
        <Badge color="orange" variant="filled">
          Partial ({formatCurrency(donation.receivedAmount, donation.receivedCurrency)})
        </Badge>
      );
    }
    return (
      <Badge color="red" variant="light" leftSection={<IconClock size={12} />}>
        Pending Payment
      </Badge>
    );
  };

  return (
    <Stack gap="lg">
      {/* Report Header Card */}
      <Paper
        p="lg"
        radius="md"
        withBorder
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #eef2f7 100%)",
        }}
      >
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs" mb={4}>
              <Title order={3}>{event.title}</Title>
              <Badge color="teal" size="lg" variant="light">
                {event.status}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Campaign Target: {formatCurrency(summary.targetExpected, currency)} | Created:{" "}
              {new Date(event.createdAt).toLocaleDateString()}
            </Text>
          </div>
          <Button
            size="xs"
            variant="default"
            leftSection={<IconPrinter size={14} />}
            onClick={() => window.print()}
          >
            Print Report
          </Button>
        </Group>

        {/* Colorful Key Metrics KPI Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mt="lg">
          {/* Card 1: Target Expected */}
          <Paper
            p="md"
            radius="md"
            withBorder
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
              color: "white",
            }}
          >
            <Text size="xs" fw={700} tt="uppercase" opacity={0.85}>
              1. Expectation (Target)
            </Text>
            <Title order={2} mt={4}>
              {formatCurrency(summary.targetExpected, currency)}
            </Title>
            <Text size="xs" mt={4} opacity={0.85}>
              Total project funding required
            </Text>
          </Paper>

          {/* Card 2: Total Pledged */}
          <Paper
            p="md"
            radius="md"
            withBorder
            style={{
              background: "linear-gradient(135deg, #581c87 0%, #8b5cf6 100%)",
              color: "white",
            }}
          >
            <Text size="xs" fw={700} tt="uppercase" opacity={0.85}>
              2. Total Pledged So Far
            </Text>
            <Title order={2} mt={4}>
              {formatCurrency(summary.totalPledged, currency)}
            </Title>
            <Text size="xs" mt={4} opacity={0.85}>
              {summary.percentagePledged}% of target committed
            </Text>
          </Paper>

          {/* Card 3: Total Received */}
          <Paper
            p="md"
            radius="md"
            withBorder
            style={{
              background: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
              color: "white",
            }}
          >
            <Text size="xs" fw={700} tt="uppercase" opacity={0.85}>
              3. Total Received So Far
            </Text>
            <Title order={2} mt={4}>
              {formatCurrency(summary.totalReceived, currency)}
            </Title>
            <Text size="xs" mt={4} opacity={0.85}>
              {summary.percentageReceived}% collected in account
            </Text>
          </Paper>

          {/* Card 4: What is Left / Target Met with dynamic eye-catching colors */}
          <Paper
            p="md"
            radius="md"
            withBorder
            style={{
              background: summary.isTargetMet
                ? "linear-gradient(135deg, #047857 0%, #34d399 100%)"
                : summary.remainingAmount > 0
                ? "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)"
                : "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
              color: "white",
            }}
          >
            <Text size="xs" fw={700} tt="uppercase" opacity={0.85}>
              4. {summary.isTargetMet ? "Target Met! (Surplus)" : "What is Left (Lacking)"}
            </Text>
            <Title order={2} mt={4}>
              {summary.isTargetMet
                ? `+ ${formatCurrency(summary.surplusAmount, currency)}`
                : formatCurrency(summary.remainingAmount, currency)}
            </Title>
            <Badge
              size="sm"
              mt={6}
              color={summary.isTargetMet ? "green.9" : "dark"}
              variant="filled"
            >
              {summary.isTargetMet
                ? "🎉 GOAL ACHIEVED"
                : `${summary.percentageReceived}% of goal reached`}
            </Badge>
          </Paper>
        </SimpleGrid>

        {/* Campaign Progress Gauge */}
        <Paper p="md" radius="md" withBorder bg="white" mt="md">
          <Group justify="space-between" mb={6}>
            <Text size="sm" fw={600}>
              Collection Breakdown:
            </Text>
            <Text size="xs" c="dimmed">
              {summary.receivedDonorsCount} of {summary.totalDonorsCount} donors paid
            </Text>
          </Group>
          <Progress.Root size="xl" radius="xl">
            <Tooltip label={`Received: ${formatCurrency(summary.totalReceived, currency)} (${summary.percentageReceived}%)`}>
              <Progress.Section
                value={Math.min(100, summary.percentageReceived)}
                color={summary.isTargetMet ? "green" : "teal"}
              >
                <Progress.Label>{summary.percentageReceived}%</Progress.Label>
              </Progress.Section>
            </Tooltip>
            {summary.percentagePledged > summary.percentageReceived && (
              <Tooltip label={`Pledged pending: ${formatCurrency(summary.totalPledged - summary.totalReceived, currency)}`}>
                <Progress.Section
                  value={Math.min(
                    100 - summary.percentageReceived,
                    summary.percentagePledged - summary.percentageReceived
                  )}
                  color="indigo"
                />
              </Tooltip>
            )}
          </Progress.Root>
        </Paper>
      </Paper>

      {/* Donors List Table Section */}
      <Paper p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md" align="center">
          <div>
            <Title order={4}>
              Donor Commitments & Payment Tracking
            </Title>
            <Text size="xs" c="dimmed">
              Always sorted alphabetically in order with sequence # 1, 2, 3...
            </Text>
          </div>

          <Group gap="xs">
            <TextInput
              placeholder="Search donor name, email, remarks..."
              size="xs"
              leftSection={<IconSearch size={14} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ width: 240 }}
            />
            <Select
              size="xs"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val || "ALL")}
              data={[
                { value: "ALL", label: "All Statuses" },
                { value: "PAID", label: "Paid in Full" },
                { value: "PARTIAL", label: "Partially Paid" },
                { value: "UNPAID", label: "Unpaid / Pending" },
              ]}
              style={{ width: 140 }}
            />
          </Group>
        </Group>

        {filteredDonors.length > 0 ? (
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm">
              <Table.Thead bg="gray.1">
                <Table.Tr>
                  <Table.Th style={{ width: 48, textAlign: "center" }}>#</Table.Th>
                  <Table.Th>Donor Name</Table.Th>
                  <Table.Th>Email (User Account)</Table.Th>
                  <Table.Th>Pledge Money</Table.Th>
                  <Table.Th>Received Money</Table.Th>
                  <Table.Th>Lacking / Balance</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Proof</Table.Th>
                  <Table.Th>Remarks / Channel</Table.Th>
                  {isSuperUser && <Table.Th style={{ width: 120 }}>Action</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredDonors.map((donor, idx) => {
                  const lacking = Math.max(0, (donor.pledgeAmount || 0) - (donor.receivedAmount || 0));
                  const surplus = Math.max(0, (donor.receivedAmount || 0) - (donor.pledgeAmount || 0));

                  return (
                    <Table.Tr key={donor.id || donor._id || idx}>
                      {/* Sequence Number 1, 2, 3... */}
                      <Table.Td style={{ textAlign: "center", fontWeight: 700, color: "#495057" }}>
                        <Badge size="sm" variant="default">
                          {donor.sequenceNumber || idx + 1}
                        </Badge>
                      </Table.Td>

                      {/* Donor Name */}
                      <Table.Td>
                        <Group gap="xs">
                          <IconUser size={16} color="var(--mantine-color-teal-6)" />
                          <Text fw={600} size="sm">
                            {donor.donorName}
                          </Text>
                        </Group>
                      </Table.Td>

                      {/* Email */}
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {donor.donorEmail || "N/A"}
                        </Text>
                      </Table.Td>

                      {/* Pledge Money */}
                      <Table.Td>
                        <Text fw={700} size="sm" c="indigo.8">
                          {formatCurrency(donor.pledgeAmount, donor.currency)}
                        </Text>
                      </Table.Td>

                      {/* Received Money */}
                      <Table.Td>
                        <Text
                          fw={700}
                          size="sm"
                          c={donor.receivedAmount > 0 ? "teal.8" : "gray.6"}
                        >
                          {formatCurrency(donor.receivedAmount, donor.receivedCurrency || donor.currency)}
                        </Text>
                        {donor.receivedCurrency && donor.receivedCurrency !== donor.currency && (
                          <Text size="10px" c="dimmed">
                            Paid in: {donor.receivedCurrency}
                          </Text>
                        )}
                      </Table.Td>

                      {/* Lacking / Balance */}
                      <Table.Td>
                        {surplus > 0 ? (
                          <Text size="xs" fw={700} c="cyan.7">
                            +{formatCurrency(surplus, donor.currency)} (Surplus)
                          </Text>
                        ) : lacking === 0 ? (
                          <Text size="xs" fw={700} c="green.7">
                            $0 (Cleared)
                          </Text>
                        ) : (
                          <Text size="xs" fw={700} c="red.7">
                            -{formatCurrency(lacking, donor.currency)} (Lacking)
                          </Text>
                        )}
                      </Table.Td>

                      {/* Status */}
                      <Table.Td>{getStatusBadge(donor)}</Table.Td>

                      {/* Proof */}
                      <Table.Td>
                        {donor.paymentProofUrl ? (
                          <Button
                            size="compact-xs"
                            variant="light"
                            color="blue"
                            leftSection={<IconFileInvoice size={12} />}
                            onClick={() => setPreviewProofUrl(donor.paymentProofUrl)}
                          >
                            View Snap
                          </Button>
                        ) : (
                          <Text size="xs" c="dimmed">
                            No proof
                          </Text>
                        )}
                      </Table.Td>

                      {/* Remarks / Channel */}
                      <Table.Td>
                        <Group gap={4}>
                          {donor.paymentMethod === "WHATSAPP" && (
                            <Badge size="xs" color="green" variant="outline">
                              WhatsApp
                            </Badge>
                          )}
                          <Text size="xs" lineClamp={1}>
                            {donor.comments || "—"}
                          </Text>
                        </Group>
                      </Table.Td>

                      {/* Super User Action: Mark Payment */}
                      {isSuperUser && (
                        <Table.Td>
                          <Button
                            size="compact-xs"
                            color="teal"
                            variant="light"
                            onClick={() => onMarkPayment && onMarkPayment(donor)}
                          >
                            Mark Payment
                          </Button>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Paper p="xl" bg="gray.0" radius="md" ta="center">
            <Text c="dimmed">No donor pledges found matching your criteria.</Text>
          </Paper>
        )}
      </Paper>

      {/* Snapshot Preview Modal */}
      {previewProofUrl && (
        <Modal
          opened={!!previewProofUrl}
          onClose={() => setPreviewProofUrl(null)}
          title="Payment Invoice / Proof Snapshot"
          size="md"
          centered
        >
          <Image src={previewProofUrl} radius="md" />
        </Modal>
      )}
    </Stack>
  );
}
