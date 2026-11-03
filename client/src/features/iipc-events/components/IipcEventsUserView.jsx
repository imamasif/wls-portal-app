import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Select,
  NumberInput,
  Textarea,
  Button,
  Badge,
  SimpleGrid,
  Image,
  Progress,
  Modal,
  Alert,
  Loader,
  Card,
  Table,
  Tooltip,
} from "@mantine/core";
import {
  IconHeartHandshake,
  IconCalendar,
  IconCoin,
  IconCheck,
  IconUpload,
  IconFileInvoice,
  IconZoomIn,
  IconInfoCircle,
  IconSparkles,
  IconClock,
  IconUsers,
  IconShare,
} from "@tabler/icons-react";
import { iipcEventsApi } from "../api/iipcEventsApi";
import { CURRENCIES, getCurrencySymbol, formatCurrency } from "../currencyUtils";
import { SubmitProofModal } from "./SubmitProofModal";
import { DonationPaymentCards } from "./DonationPaymentCards";
import { ShareCampaignModal } from "./ShareCampaignModal";

export function IipcEventsUserView({ user }) {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingPledge, setSubmittingPledge] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form state for pledge
  const [pledgeAmount, setPledgeAmount] = useState(100);
  const [currency, setCurrency] = useState("CAD");
  const [comments, setComments] = useState("");

  // User's own donations
  const [userDonations, setUserDonations] = useState([]);
  const [projectDonations, setProjectDonations] = useState([]);

  // Modals
  const [proofModalOpened, setProofModalOpened] = useState(false);
  const [selectedDonationForProof, setSelectedDonationForProof] = useState(null);
  const [shareModalOpened, setShareModalOpened] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const eventsData = await iipcEventsApi.getAllEvents("ACTIVE");
      setEvents(eventsData);

      if (eventsData.length > 0) {
        setSelectedEventId(eventsData[0].id || eventsData[0]._id);
      }

      const uId = user?.id || user?._id;
      if (uId) {
        const myDonations = await iipcEventsApi.getUserDonations(uId);
        setUserDonations(myDonations);
      }
    } catch (err) {
      console.error("Failed to load user events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (eventId) => {
    if (!eventId) return;
    try {
      const donations = await iipcEventsApi.getEventDonations(eventId);
      setProjectDonations(donations);
    } catch (err) {
      console.error("Failed to fetch project donations:", err);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchProjectDetails(selectedEventId);
    }
  }, [selectedEventId]);

  const selectedEvent = events.find(
    (e) => (e.id || e._id) === selectedEventId
  );

  // Find if user already pledged for this project
  const uId = user?.id || user?._id;
  const myPledgeForThisProject = userDonations.find(
    (d) =>
      d.eventId === selectedEventId ||
      d.eventId?._id === selectedEventId ||
      d.eventId?.id === selectedEventId
  );

  // Handle Submit Pledge
  const handlePledgeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !pledgeAmount) return;

    try {
      setSubmittingPledge(true);
      await iipcEventsApi.createDonation({
        eventId: selectedEventId,
        userId: user?.id || user?._id,
        donorName: user?.name || "Community Member",
        donorEmail: user?.email || "",
        pledgeAmount: Number(pledgeAmount),
        currency,
        comments: comments.trim(),
        paymentMethod: "ONLINE_PORTAL",
      });

      setNotification({
        type: "success",
        message: `JazakAllah Khair! Your pledge of ${formatCurrency(
          pledgeAmount,
          currency
        )} has been registered. You can upload invoice proof once sent.`,
      });

      // Refresh data
      const eventsData = await iipcEventsApi.getAllEvents("ACTIVE");
      setEvents(eventsData);
      const myDonations = await iipcEventsApi.getUserDonations(user?.id || user?._id);
      setUserDonations(myDonations);
      await fetchProjectDetails(selectedEventId);

      setComments("");
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.error || err.message,
      });
    } finally {
      setSubmittingPledge(false);
    }
  };

  // Handle Save Proof
  const handleSaveProof = async (proofData) => {
    try {
      await iipcEventsApi.submitProof(proofData.donationId, proofData);
      setNotification({
        type: "success",
        message: "Payment proof and remarks submitted successfully!",
      });
      setProofModalOpened(false);
      setSelectedDonationForProof(null);

      const myDonations = await iipcEventsApi.getUserDonations(user?.id || user?._id);
      setUserDonations(myDonations);
      await fetchProjectDetails(selectedEventId);
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.error || err.message,
      });
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl" ta="center">
        <Loader size="lg" color="teal" />
        <Text size="sm" c="dimmed" mt="md">
          Loading IIPC Events & Donation Appeals...
        </Text>
      </Container>
    );
  }

  const summary = selectedEvent?.summary || {};
  const target = selectedEvent?.targetAmount || 0;
  const pledged = summary.totalPledged || 0;
  const received = summary.totalReceived || 0;
  const remaining = summary.remainingAmount || Math.max(0, target - received);
  const isTargetMet = summary.isTargetMet || (target > 0 && received >= target);
  const surplus = summary.surplusAmount || Math.max(0, received - target);
  const percentageReceived =
    target > 0 ? Math.min(100, Math.round((received / target) * 100)) : 0;
  const percentagePledged =
    target > 0 ? Math.min(100, Math.round((pledged / target) * 100)) : 0;
  const pictures = Array.isArray(selectedEvent?.pictures)
    ? selectedEvent.pictures
    : [];

  return (
    <Container size="lg" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Paper
          p="lg"
          radius="md"
          withBorder
          style={{
            background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
            color: "white",
          }}
        >
          <Group justify="space-between" align="center">
            <div>
              <Group gap="xs">
                <IconHeartHandshake size={28} color="#a7f3d0" />
                <Title order={2} style={{ color: "white" }}>
                  IIPC Events & Donation Appeals
                </Title>
              </Group>
              <Text size="sm" c="teal.1" mt={4}>
                Support charitable causes, lodge your pledge commitment, and submit transfer proofs.
              </Text>
            </div>
            <Group gap="xs">
              <Badge size="lg" color="teal.1" c="teal.9" variant="filled">
                {events.length} Active Campaigns
              </Badge>
              {selectedEvent && (
                <Button
                  color="teal.1"
                  c="teal.9"
                  size="xs"
                  leftSection={<IconShare size={14} />}
                  onClick={() => setShareModalOpened(true)}
                >
                  Share Appeal
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        {/* Notification Toast */}
        {notification && (
          <Alert
            color={notification.type === "success" ? "teal" : "red"}
            withCloseButton
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        )}

        {/* Project Selector Dropdown */}
        <Paper p="md" radius="md" withBorder bg="gray.0">
          <Select
            label="Choose Project / Event Appeal"
            description="Select an active campaign to view project details, pictures, and pledge your contribution"
            placeholder="Select a project"
            size="md"
            data={events.map((e) => ({
              value: e.id || e._id,
              label: `${e.title} [Target: ${e.currency} ${Number(
                e.targetAmount || 0
              ).toLocaleString()}]`,
            }))}
            value={selectedEventId}
            onChange={(val) => setSelectedEventId(val)}
            searchable
          />
        </Paper>

        {selectedEvent ? (
          <>
            {/* Project Details Card */}
            <Card shadow="sm" p="xl" radius="md" withBorder>
              <Group justify="space-between" align="flex-start" mb="sm">
                <div>
                  <Title order={2} c="teal.9">
                    {selectedEvent.title}
                  </Title>
                  <Group gap="xs" mt={4}>
                    <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
                    <Text size="xs" c="dimmed">
                      {new Date(selectedEvent.startDate).toLocaleDateString()} –{" "}
                      {new Date(selectedEvent.endDate).toLocaleDateString()}
                    </Text>
                  </Group>
                </div>
                <Group gap="xs">
                  <Badge size="lg" color="teal" variant="filled">
                    {selectedEvent.status}
                  </Badge>
                  <Button
                    size="xs"
                    color="teal"
                    variant="light"
                    leftSection={<IconShare size={14} />}
                    onClick={() => setShareModalOpened(true)}
                  >
                    Share Appeal Link
                  </Button>
                </Group>
              </Group>

              {/* Description */}
              <Text size="md" c="gray.8" mt="xs" mb="md" style={{ lineHeight: 1.6 }}>
                {selectedEvent.description}
              </Text>

              {/* Instructions / Comments if any */}
              {selectedEvent.comments && (
                <Paper p="sm" radius="md" bg="blue.0" mb="md">
                  <Group gap="xs">
                    <IconInfoCircle size={18} color="var(--mantine-color-blue-6)" />
                    <Text size="sm" c="blue.9">
                      <b>Instructions / Coordinator Note:</b> {selectedEvent.comments}
                    </Text>
                  </Group>
                </Paper>
              )}

              {/* Picture Snaps Gallery */}
              {pictures.length > 0 && (
                <Paper p="md" withBorder radius="md" bg="gray.0" mb="lg">
                  <Text size="sm" fw={700} mb="xs">
                    Project Photos & Snaps ({pictures.length})
                  </Text>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs">
                    {pictures.map((picUrl, idx) => (
                      <Paper
                        key={idx}
                        radius="sm"
                        style={{
                          overflow: "hidden",
                          position: "relative",
                          cursor: "pointer",
                        }}
                        onClick={() => setZoomPhoto(picUrl)}
                      >
                        <Image
                          src={picUrl}
                          height={120}
                          fit="cover"
                          fallbackSrc="https://placehold.co/200x120?text=Snap"
                        />
                        <ActionIcon
                          size="xs"
                          variant="filled"
                          color="dark"
                          style={{
                            position: "absolute",
                            bottom: 6,
                            right: 6,
                            opacity: 0.8,
                          }}
                        >
                          <IconZoomIn size={12} />
                        </ActionIcon>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Paper>
              )}

              {/* Expectation, Pledged, Received, Left / Target Met with Color Combinations */}
              <Paper p="md" radius="md" withBorder bg="gray.0">
                <Text size="sm" fw={700} mb="xs" c="gray.8">
                  Funding Progress & Targets
                </Text>

                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" mb="md">
                  {/* Expectation */}
                  <Paper p="sm" radius="md" bg="blue.1" withBorder>
                    <Text size="11px" fw={700} c="blue.9" tt="uppercase">
                      Expectation (Target)
                    </Text>
                    <Text size="lg" fw={700} c="blue.9">
                      {formatCurrency(target, selectedEvent.currency)}
                    </Text>
                  </Paper>

                  {/* Pledged */}
                  <Paper p="sm" radius="md" bg="grape.1" withBorder>
                    <Text size="11px" fw={700} c="grape.9" tt="uppercase">
                      Committed / Pledged
                    </Text>
                    <Text size="lg" fw={700} c="grape.9">
                      {formatCurrency(pledged, selectedEvent.currency)}
                    </Text>
                  </Paper>

                  {/* Received */}
                  <Paper p="sm" radius="md" bg="teal.1" withBorder>
                    <Text size="11px" fw={700} c="teal.9" tt="uppercase">
                      Received So Far
                    </Text>
                    <Text size="lg" fw={700} c="teal.9">
                      {formatCurrency(received, selectedEvent.currency)}
                    </Text>
                  </Paper>

                  {/* What is Left / Target Met */}
                  <Paper
                    p="sm"
                    radius="md"
                    bg={isTargetMet ? "green.1" : "orange.1"}
                    withBorder
                  >
                    <Text
                      size="11px"
                      fw={700}
                      c={isTargetMet ? "green.9" : "orange.9"}
                      tt="uppercase"
                    >
                      {isTargetMet ? "Target Met! (Surplus)" : "What is Left"}
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      c={isTargetMet ? "green.9" : "orange.9"}
                    >
                      {isTargetMet
                        ? `+ ${formatCurrency(surplus, selectedEvent.currency)}`
                        : formatCurrency(remaining, selectedEvent.currency)}
                    </Text>
                  </Paper>
                </SimpleGrid>

                {/* Progress bar */}
                <Progress.Root size="xl" radius="xl">
                  <Tooltip label={`Received: ${formatCurrency(received, selectedEvent.currency)} (${percentageReceived}%)`}>
                    <Progress.Section
                      value={percentageReceived}
                      color={isTargetMet ? "green" : "teal"}
                    >
                      <Progress.Label>{percentageReceived}%</Progress.Label>
                    </Progress.Section>
                  </Tooltip>
                  {pledged > received && (
                    <Tooltip label={`Pledged pending: ${formatCurrency(pledged - received, selectedEvent.currency)}`}>
                      <Progress.Section
                        value={Math.min(
                          100 - percentageReceived,
                          percentagePledged - percentageReceived
                        )}
                        color="indigo"
                      />
                    </Tooltip>
                  )}
                </Progress.Root>
              </Paper>
            </Card>

            {/* My Active Pledge & Upload Proof Card */}
            {myPledgeForThisProject && (
              <Paper
                p="lg"
                radius="md"
                withBorder
                style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  borderColor: "var(--mantine-color-teal-4)",
                }}
              >
                <Group justify="space-between" align="center">
                  <div>
                    <Group gap="xs">
                      <IconCheck size={20} color="var(--mantine-color-teal-7)" />
                      <Text fw={700} size="md" c="teal.9">
                        Your Registered Pledge for this Campaign
                      </Text>
                    </Group>
                    <Text size="sm" c="gray.7" mt={4}>
                      Pledged:{" "}
                      <b>
                        {formatCurrency(
                          myPledgeForThisProject.pledgeAmount,
                          myPledgeForThisProject.currency
                        )}
                      </b>{" "}
                      | Received:{" "}
                      <b>
                        {formatCurrency(
                          myPledgeForThisProject.receivedAmount,
                          myPledgeForThisProject.receivedCurrency
                        )}
                      </b>
                    </Text>
                    {myPledgeForThisProject.comments && (
                      <Text size="xs" c="dimmed" mt={2}>
                        Remarks: {myPledgeForThisProject.comments}
                      </Text>
                    )}
                  </div>

                  <Group gap="xs">
                    <Badge
                      size="lg"
                      color={
                        myPledgeForThisProject.status === "RECEIVED" ||
                        myPledgeForThisProject.isFullyPaid
                          ? "green"
                          : myPledgeForThisProject.status === "PARTIALLY_RECEIVED"
                          ? "orange"
                          : "blue"
                      }
                      variant="filled"
                    >
                      {myPledgeForThisProject.status}
                    </Badge>

                    <Button
                      color="teal"
                      variant="light"
                      leftSection={<IconUpload size={14} />}
                      onClick={() => {
                        setSelectedDonationForProof(myPledgeForThisProject);
                        setProofModalOpened(true);
                      }}
                    >
                      {myPledgeForThisProject.paymentProofUrl
                        ? "Update Payment Proof / Remarks"
                        : "Upload Payment Proof / Invoice Snap"}
                    </Button>
                  </Group>
                </Group>
              </Paper>
            )}

            {/* Pledge Submission Form */}
            <Paper p="xl" radius="md" withBorder>
              <Group gap="xs" mb="md">
                <IconHeartHandshake size={24} color="var(--mantine-color-teal-6)" />
                <Title order={3}>
                  {myPledgeForThisProject
                    ? "Add Additional Pledge Commitment"
                    : "Make Your Pledge Commitment"}
                </Title>
              </Group>

              <form onSubmit={handlePledgeSubmit}>
                <Stack gap="md">
                  <Group grow>
                    <NumberInput
                      label="Your Pledge Money"
                      placeholder="e.g. 500"
                      required
                      min={1}
                      value={pledgeAmount}
                      onChange={(val) => setPledgeAmount(val)}
                      leftSection={
                        <Text size="sm" fw={700} c="teal">
                          {getCurrencySymbol(currency)}
                        </Text>
                      }
                    />

                    <Select
                      label="Currency Symbol / Type"
                      description="Default CAD, or choose your currency"
                      data={CURRENCIES}
                      value={currency}
                      onChange={(val) => setCurrency(val || "CAD")}
                      searchable
                      required
                    />
                  </Group>

                  <Textarea
                    label="Comments & Remarks"
                    placeholder="Type your remarks, e-transfer date, or note to organizers..."
                    minRows={2}
                    value={comments}
                    onChange={(e) => setComments(e.currentTarget.value)}
                  />

                  <Group justify="flex-end">
                    <Button
                      type="submit"
                      color="teal"
                      size="md"
                      loading={submittingPledge}
                      leftSection={<IconHeartHandshake size={18} />}
                    >
                      Submit My Pledge
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Paper>

            {/* COOL WHITE REACT MANTINE CARDS: BANKING & PAYMENT DETAILS */}
            <div>
              <Group justify="space-between" align="center" mb="sm">
                <div>
                  <Title order={3} c="dark.9">
                    Ways to Send Your Donation
                  </Title>
                  <Text size="sm" c="dimmed">
                    Official banking accounts & online donation channels for International Islamic Propagation Centre Canada
                  </Text>
                </div>
              </Group>

              <DonationPaymentCards />
            </div>

            {/* Community Donors Sequence Table */}
            {projectDonations.length > 0 && (
              <Paper p="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={4}>Community Commitments</Title>
                    <Text size="xs" c="dimmed">
                      {projectDonations.length} donor(s) committed so far (sorted alphabetically in order)
                    </Text>
                  </div>
                  <Badge color="teal" size="lg" variant="light">
                    {projectDonations.length} Commits
                  </Badge>
                </Group>

                <Table.ScrollContainer minWidth={600}>
                  <Table striped highlightOnHover withTableBorder verticalSpacing="xs">
                    <Table.Thead bg="gray.1">
                      <Table.Tr>
                        <Table.Th style={{ width: 48, textAlign: "center" }}>#</Table.Th>
                        <Table.Th>Donor Name</Table.Th>
                        <Table.Th>Pledge Amount</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {projectDonations.map((d, idx) => (
                        <Table.Tr key={d.id || d._id || idx}>
                          <Table.Td style={{ textAlign: "center", fontWeight: 700 }}>
                            <Badge size="xs" variant="default">
                              {d.sequenceNumber || idx + 1}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600} size="sm">
                              {d.donorName}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={700} size="sm" c="teal.8">
                              {formatCurrency(d.pledgeAmount, d.currency)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="sm"
                              color={
                                d.status === "RECEIVED" || d.isFullyPaid
                                  ? "green"
                                  : d.status === "PARTIALLY_RECEIVED"
                                  ? "orange"
                                  : "blue"
                              }
                            >
                              {d.status === "RECEIVED" ? "Paid" : d.status}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            )}
          </>
        ) : (
          <Paper p="xl" withBorder radius="md" ta="center">
            <Text c="dimmed">No active project appeals available currently.</Text>
          </Paper>
        )}
      </Stack>

      {/* Proof Submission Modal */}
      <SubmitProofModal
        opened={proofModalOpened}
        onClose={() => {
          setProofModalOpened(false);
          setSelectedDonationForProof(null);
        }}
        onSave={handleSaveProof}
        donation={selectedDonationForProof}
      />

      {/* Share Campaign Modal */}
      <ShareCampaignModal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        project={selectedEvent}
      />

      {/* Snap Zoom Modal */}
      {zoomPhoto && (
        <Modal
          opened={!!zoomPhoto}
          onClose={() => setZoomPhoto(null)}
          title="Project Snap"
          size="lg"
          centered
        >
          <Image src={zoomPhoto} radius="md" />
        </Modal>
      )}
    </Container>
  );
}
