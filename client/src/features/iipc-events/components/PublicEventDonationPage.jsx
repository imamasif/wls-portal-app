import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Button,
  Badge,
  Card,
  SimpleGrid,
  Image,
  Progress,
  Divider,
  Alert,
  Loader,
  FileButton,
  ActionIcon,
  Modal,
  Tooltip,
} from "@mantine/core";
import {
  IconHeartHandshake,
  IconCalendar,
  IconCoin,
  IconCheck,
  IconUpload,
  IconShare,
  IconZoomIn,
  IconMail,
  IconPhone,
  IconUser,
  IconSparkles,
  IconReceiptTax,
  IconLock,
} from "@tabler/icons-react";
import { iipcEventsApi } from "../api/iipcEventsApi";
import { CURRENCIES, getCurrencySymbol, formatCurrency } from "../currencyUtils";
import { DonationPaymentCards } from "./DonationPaymentCards";
import { ShareCampaignModal } from "./ShareCampaignModal";

export function PublicEventDonationPage({ eventId, onGoToLogin }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pledgeAmount, setPledgeAmount] = useState(100);
  const [currency, setCurrency] = useState("CAD");
  const [paymentMethod, setPaymentMethod] = useState("E_TRANSFER");
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [comments, setComments] = useState("");

  // Modals
  const [shareModalOpened, setShareModalOpened] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      if (eventId) {
        const data = await iipcEventsApi.getEventById(eventId);
        setEvent(data);
        if (data.currency) setCurrency(data.currency);
      } else {
        // Fallback: load first active event
        const events = await iipcEventsApi.getAllEvents("ACTIVE");
        if (events && events.length > 0) {
          const first = events[0];
          setEvent(first);
          if (first.currency) setCurrency(first.currency);
        }
      }
    } catch (err) {
      console.error("Failed to load public event:", err);
      setErrorMessage("Unable to load the donation appeal. It may have expired or been moved.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentProofUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter both your First Name and Last Name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!pledgeAmount || Number(pledgeAmount) <= 0) {
      setErrorMessage("Please enter a valid donation pledge amount.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await iipcEventsApi.createPublicDonation({
        eventId: event.id || event._id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        donorName: `${firstName.trim()} ${lastName.trim()}`,
        donorEmail: email.trim().toLowerCase(),
        phone: phone.trim(),
        pledgeAmount: Number(pledgeAmount),
        currency,
        paymentMethod,
        paymentProofUrl,
        comments: comments.trim(),
      });

      setSubmittedDonation(res);
      // Refresh event metrics
      fetchEventDetails();
    } catch (err) {
      console.error("Public donation error:", err);
      setErrorMessage(err.response?.data?.error || err.message || "Failed to submit pledge.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container size="md" py={80} ta="center">
        <Loader size="xl" color="teal" />
        <Text size="sm" c="dimmed" mt="md">
          Loading IIPC Canada Charitable Appeal...
        </Text>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container size="sm" py={80}>
        <Paper p="xl" withBorder radius="md" ta="center">
          <Text size="lg" fw={700} c="red">
            Appeal Not Found
          </Text>
          <Text size="sm" c="dimmed" mt="xs">
            {errorMessage || "The requested campaign could not be loaded."}
          </Text>
          {onGoToLogin && (
            <Button mt="md" variant="default" onClick={onGoToLogin}>
              Return to Portal Login
            </Button>
          )}
        </Paper>
      </Container>
    );
  }

  const summary = event.summary || {};
  const target = event.targetAmount || 0;
  const pledged = summary.totalPledged || 0;
  const received = summary.totalReceived || 0;
  const remaining = summary.remainingAmount || Math.max(0, target - received);
  const isTargetMet = summary.isTargetMet || (target > 0 && received >= target);
  const percentageReceived =
    target > 0 ? Math.min(100, Math.round((received / target) * 100)) : 0;
  const pictures = Array.isArray(event.pictures) ? event.pictures : [];

  return (
    <Box bg="gray.1" style={{ minHeight: "100vh" }} pb={60}>
      {/* Top Navigation Banner */}
      <Paper
        px="lg"
        py="xs"
        style={{
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Image src="/iipc-logo1.png" height={42} fit="contain" fallbackSrc="" />
              <div>
                <Text fw={800} size="sm" c="dark.9">
                  IIPC CANADA
                </Text>
                <Text size="11px" c="dimmed">
                  International Islamic Propagation Center Canada
                </Text>
              </div>
            </Group>

            <Group gap="xs">
              <Badge color="green" variant="light" size="sm">
                CRA # 80654 8632 RR0001
              </Badge>
              {onGoToLogin && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconLock size={14} />}
                  onClick={onGoToLogin}
                >
                  Portal Login
                </Button>
              )}
            </Group>
          </Group>
        </Container>
      </Paper>

      <Container size="lg" pt="lg">
        <Stack gap="xl">
          {/* Hero Banner */}
          <Paper
            p="xl"
            radius="lg"
            withBorder
            style={{
              background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
              color: "white",
            }}
          >
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Badge color="teal.1" c="teal.9" variant="filled" mb="xs">
                  Active Community Appeal
                </Badge>
                <Title order={1} style={{ color: "white", lineHeight: 1.2 }}>
                  {event.title}
                </Title>
                <Group gap="xs" mt="xs">
                  <IconCalendar size={16} color="#a7f3d0" />
                  <Text size="sm" c="teal.1">
                    Campaign Period: {new Date(event.startDate).toLocaleDateString()} –{" "}
                    {new Date(event.endDate).toLocaleDateString()}
                  </Text>
                </Group>
              </div>

              {/* Share Appeal Button */}
              <Button
                color="teal.1"
                c="teal.9"
                variant="filled"
                size="md"
                leftSection={<IconShare size={18} />}
                onClick={() => setShareModalOpened(true)}
              >
                Share Appeal
              </Button>
            </Group>

            {/* Campaign Metrics Bar */}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="xl">
              <Paper p="md" radius="md" bg="rgba(255, 255, 255, 0.1)">
                <Text size="11px" c="teal.1" tt="uppercase" fw={600}>
                  Campaign Target
                </Text>
                <Title order={3} c="white">
                  {formatCurrency(target, event.currency)}
                </Title>
              </Paper>
              <Paper p="md" radius="md" bg="rgba(255, 255, 255, 0.1)">
                <Text size="11px" c="teal.1" tt="uppercase" fw={600}>
                  Total Raised So Far
                </Text>
                <Title order={3} c="#6ee7b7">
                  {formatCurrency(received, event.currency)}
                </Title>
              </Paper>
              <Paper p="md" radius="md" bg="rgba(255, 255, 255, 0.1)">
                <Text size="11px" c="teal.1" tt="uppercase" fw={600}>
                  {isTargetMet ? "Target Met!" : "Remaining to Target"}
                </Text>
                <Title order={3} c={isTargetMet ? "#6ee7b7" : "white"}>
                  {isTargetMet
                    ? "Target Reached"
                    : formatCurrency(remaining, event.currency)}
                </Title>
              </Paper>
            </SimpleGrid>

            {/* Progress Gauge */}
            <Progress.Root size="xl" radius="xl" mt="md">
              <Progress.Section value={percentageReceived} color="#10b981">
                <Progress.Label>{percentageReceived}%</Progress.Label>
              </Progress.Section>
            </Progress.Root>
          </Paper>

          {/* Description & Photo Gallery */}
          <Card shadow="sm" p="xl" radius="md" withBorder bg="white">
            <Title order={3} mb="sm" c="dark.9">
              About This Project
            </Title>
            <Text size="md" c="gray.8" style={{ lineHeight: 1.7 }} mb="md">
              {event.description}
            </Text>

            {event.comments && (
              <Paper p="md" radius="md" bg="teal.0" withBorder mb="lg">
                <Text size="sm" c="teal.9">
                  📌 <b>Coordinator Remarks:</b> {event.comments}
                </Text>
              </Paper>
            )}

            {/* Photos & Snaps Gallery */}
            {pictures.length > 0 && (
              <div>
                <Text size="sm" fw={700} mb="xs" c="dark.9">
                  Project Snaps & Photos ({pictures.length})
                </Text>
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
                  {pictures.map((picUrl, idx) => (
                    <Paper
                      key={idx}
                      radius="md"
                      withBorder
                      style={{
                        overflow: "hidden",
                        position: "relative",
                        cursor: "pointer",
                      }}
                      onClick={() => setZoomPhoto(picUrl)}
                    >
                      <Image
                        src={picUrl}
                        height={140}
                        fit="cover"
                        fallbackSrc="https://placehold.co/200x140?text=Snap"
                      />
                      <ActionIcon
                        size="xs"
                        variant="filled"
                        color="dark"
                        style={{
                          position: "absolute",
                          bottom: 6,
                          right: 6,
                          opacity: 0.85,
                        }}
                      >
                        <IconZoomIn size={12} />
                      </ActionIcon>
                    </Paper>
                  ))}
                </SimpleGrid>
              </div>
            )}
          </Card>

          {/* COOL WHITE REACT MANTINE CARDS: BANKING & PAYMENT DETAILS */}
          <div>
            <Group justify="space-between" align="center" mb="sm">
              <div>
                <Title order={3} c="dark.9">
                  Ways to Send Your Donation
                </Title>
                <Text size="sm" c="dimmed">
                  Official registered accounts for International Islamic Propagation Centre Canada
                </Text>
              </div>
            </Group>

            <DonationPaymentCards />
          </div>

          {/* ONLINE PLEDGE / DONOR COMMITMENT FORM */}
          <Paper p="xl" radius="md" withBorder bg="white" shadow="sm">
            <Group justify="space-between" align="center" mb="md">
              <Group gap="xs">
                <IconHeartHandshake size={28} color="#059669" />
                <div>
                  <Title order={3}>Register Your Pledge / Notify Transfer</Title>
                  <Text size="xs" c="dimmed">
                    Enter your details so we can issue your CRA tax receipt and track your contribution
                  </Text>
                </div>
              </Group>

              <Badge color="teal" variant="light" size="lg">
                No Login Required
              </Badge>
            </Group>

            {/* Success Message After Submission */}
            {submittedDonation ? (
              <Paper
                p="xl"
                radius="md"
                withBorder
                style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  borderColor: "#10b981",
                  textAlign: "center",
                }}
              >
                <IconCheck size={48} color="#059669" style={{ margin: "0 auto" }} />
                <Title order={2} c="teal.9" mt="sm">
                  JazakAllah Khair!
                </Title>
                <Text size="md" c="gray.8" mt="xs" fw={600}>
                  Your pledge of{" "}
                  {formatCurrency(
                    submittedDonation.pledgeAmount,
                    submittedDonation.currency
                  )}{" "}
                  has been successfully recorded.
                </Text>
                <Text size="sm" c="dimmed" mt={4} style={{ maxWidth: 500, margin: "8px auto" }}>
                  A confirmation has been linked to your email (<b>{submittedDonation.donorEmail}</b>).
                  Please use the banking channels above to complete your transfer if not yet sent.
                </Text>

                <Group justify="center" mt="lg">
                  <Button
                    color="teal"
                    leftSection={<IconShare size={16} />}
                    onClick={() => setShareModalOpened(true)}
                  >
                    Share Appeal with Friends
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setSubmittedDonation(null);
                      setPledgeAmount(100);
                      setComments("");
                      setPaymentProofUrl("");
                    }}
                  >
                    Record Another Donation
                  </Button>
                </Group>
              </Paper>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack gap="md">
                  {errorMessage && (
                    <Alert color="red" withCloseButton onClose={() => setErrorMessage("")}>
                      {errorMessage}
                    </Alert>
                  )}

                  {/* Donor Name */}
                  <Group grow>
                    <TextInput
                      label="First Name"
                      placeholder="e.g. Muhammad"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.currentTarget.value)}
                    />
                    <TextInput
                      label="Last Name"
                      placeholder="e.g. Tariq"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.currentTarget.value)}
                    />
                  </Group>

                  {/* Email & Phone */}
                  <Group grow>
                    <TextInput
                      label="Email Address"
                      placeholder="e.g. yourname@example.com"
                      type="email"
                      required
                      leftSection={<IconMail size={16} />}
                      value={email}
                      onChange={(e) => setEmail(e.currentTarget.value)}
                      description="Your CRA tax receipt will be issued to this email"
                    />
                    <TextInput
                      label="Phone Number"
                      placeholder="e.g. +1 (416) 555-0199"
                      required
                      leftSection={<IconPhone size={16} />}
                      value={phone}
                      onChange={(e) => setPhone(e.currentTarget.value)}
                    />
                  </Group>

                  {/* Pledge Amount & Currency */}
                  <Group grow>
                    <NumberInput
                      label="Donation Pledge Amount"
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
                      label="Currency"
                      data={CURRENCIES}
                      value={currency}
                      onChange={(val) => setCurrency(val || "CAD")}
                      searchable
                      required
                    />
                  </Group>

                  {/* Payment Method Used / Intended */}
                  <Select
                    label="Payment Channel Used / Intended"
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val || "E_TRANSFER")}
                    data={[
                      { value: "E_TRANSFER", label: "Interac E-Transfer (accounts@iipccanada.com)" },
                      { value: "BANK_TRANSFER", label: "TD Bank Wire / Direct Bank Transfer" },
                      { value: "PAYPAL", label: "PayPal Giving Fund / Credit Card" },
                      { value: "CANADA_HELPS", label: "CanadaHelps.org" },
                      { value: "WEBSITE", label: "Official IIPC Website Donation" },
                      { value: "CASH_CHECK", label: "Cash / Bank Cheque" },
                    ]}
                  />

                  {/* Attach Invoice / Receipt snapshot */}
                  <Paper p="sm" withBorder radius="sm" bg="gray.0">
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="xs" fw={600}>
                          Optional: Attach Transfer Screenshot / Receipt Proof
                        </Text>
                        <Text size="11px" c="dimmed">
                          Upload your e-transfer or wire transfer confirmation image
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
                            variant="light"
                            color="teal"
                            leftSection={<IconUpload size={14} />}
                          >
                            Browse Receipt Snap
                          </Button>
                        )}
                      </FileButton>
                    </Group>

                    {paymentProofUrl && (
                      <Group gap="xs" mt="xs" align="center">
                        <Image
                          src={paymentProofUrl}
                          height={45}
                          width={45}
                          radius="xs"
                          fit="cover"
                        />
                        <Text size="xs" c="teal" fw={600}>
                          Proof image attached
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
                    )}
                  </Paper>

                  {/* Remarks / Comments */}
                  <Textarea
                    label="Comments / Transaction Memo"
                    placeholder="e.g. Sent via TD Bank wire transfer ref #123456, or note for general donation..."
                    minRows={2}
                    value={comments}
                    onChange={(e) => setComments(e.currentTarget.value)}
                  />

                  <Group justify="flex-end" mt="md">
                    <Button
                      type="submit"
                      color="teal"
                      size="md"
                      loading={submitting}
                      leftSection={<IconHeartHandshake size={18} />}
                    >
                      Submit Donation Pledge
                    </Button>
                  </Group>
                </Stack>
              </form>
            )}
          </Paper>
        </Stack>
      </Container>

      {/* Share Modal */}
      <ShareCampaignModal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        project={event}
      />

      {/* Photo Zoom Modal */}
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
    </Box>
  );
}
