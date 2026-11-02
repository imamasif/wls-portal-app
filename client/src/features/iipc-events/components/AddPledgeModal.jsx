import React, { useState, useEffect } from "react";
import {
  Modal,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
  SegmentedControl,
  Center,
  Divider,
  Alert,
} from "@mantine/core";
import {
  IconHeartHandshake,
  IconBrandWhatsapp,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconCoin,
  IconMail,
  IconPhone,
  IconSparkles,
} from "@tabler/icons-react";
import { CURRENCIES, getCurrencySymbol, formatCurrency } from "../currencyUtils";
import { iipcEventsApi } from "../api/iipcEventsApi";

export function AddPledgeModal({
  opened,
  onClose,
  onSave,
  events = [],
  selectedEventId = null,
  loading = false,
}) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form Mode: "existing" or "new"
  const [donorMode, setDonorMode] = useState("existing");

  // Project Selection
  const [eventId, setEventId] = useState("");

  // Existing User Selection
  const [userId, setUserId] = useState("");

  // New User Creation Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Pledge Fields
  const [pledgeAmount, setPledgeAmount] = useState(100);
  const [currency, setCurrency] = useState("CAD");
  const [paymentMethod, setPaymentMethod] = useState("WHATSAPP");
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [comments, setComments] = useState("");

  // Error validation message
  const [formError, setFormError] = useState("");

  // RESET FORM COMPLETELY ON EVERY OPEN
  useEffect(() => {
    if (opened) {
      setDonorMode("existing");
      setUserId("");
      setFirstName("");
      setLastName("");
      setDonorEmail("");
      setPhone("");
      setPledgeAmount(100);
      setCurrency("CAD");
      setPaymentMethod("WHATSAPP");
      setReceivedAmount(0);
      setComments("");
      setFormError("");

      if (selectedEventId) {
        setEventId(selectedEventId);
      } else if (events.length > 0) {
        setEventId(events[0].id || events[0]._id);
      }

      fetchUsers();
    }
  }, [opened, selectedEventId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await iipcEventsApi.getAllUsers();
      const sorted = (Array.isArray(data) ? data : []).sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setUsers(sorted);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const selectedEvent = events.find((e) => (e.id || e._id) === eventId);
  const selectedUser = users.find((u) => (u.id || u._id) === userId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!eventId) {
      setFormError("Please select a target project/event.");
      return;
    }
    if (!pledgeAmount || Number(pledgeAmount) <= 0) {
      setFormError("Please enter a valid pledge amount.");
      return;
    }

    if (donorMode === "existing") {
      if (!userId) {
        setFormError("Please select a donor from the user list.");
        return;
      }
      onSave({
        eventId,
        userId,
        donorName: selectedUser?.name || "",
        donorEmail: selectedUser?.email || "",
        isNewUser: false,
        pledgeAmount: Number(pledgeAmount),
        currency,
        receivedAmount: Number(receivedAmount) || 0,
        receivedCurrency: currency,
        paymentMethod,
        comments: comments.trim(),
      });
    } else {
      // New User Mode
      if (!firstName.trim() || !lastName.trim()) {
        setFormError("First Name and Last Name are required for new donor.");
        return;
      }
      if (!donorEmail.trim()) {
        setFormError("Email address is required for new donor.");
        return;
      }
      if (!phone.trim()) {
        setFormError("Phone number is required for new donor.");
        return;
      }

      const composedName = `${firstName.trim()} ${lastName.trim()}`;

      onSave({
        eventId,
        isNewUser: true,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        donorName: composedName,
        donorEmail: donorEmail.trim().toLowerCase(),
        phone: phone.trim(),
        pledgeAmount: Number(pledgeAmount),
        currency,
        receivedAmount: Number(receivedAmount) || 0,
        receivedCurrency: currency,
        paymentMethod,
        comments: comments.trim(),
      });
    }
  };

  // User select options
  const userSelectData = users.map((u) => ({
    value: u.id || u._id,
    label: `${u.name} (${u.email})${u.phone ? ` - ${u.phone}` : ""}`,
  }));

  // Event select options
  const eventSelectData = events.map((e) => ({
    value: e.id || e._id,
    label: `${e.title} [Target: ${e.currency} ${Number(e.targetAmount || 0).toLocaleString()}]`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconBrandWhatsapp size={22} color="var(--mantine-color-green-6)" />
          <Text fw={700} size="lg">
            Record Donor Pledge (WhatsApp / Social Media)
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {formError && (
            <Alert color="red" withCloseButton onClose={() => setFormError("")}>
              {formError}
            </Alert>
          )}

          {/* Project Selection */}
          <Select
            label="Target Project / Event"
            placeholder="Select Project"
            required
            data={eventSelectData}
            value={eventId}
            onChange={(val) => setEventId(val)}
            searchable
          />

          {/* Mode Switcher: Existing User vs Add New User */}
          <div>
            <Text size="sm" fw={600} mb={6}>
              Donor Identification
            </Text>
            <SegmentedControl
              value={donorMode}
              onChange={(val) => {
                setDonorMode(val);
                setFormError("");
              }}
              data={[
                {
                  label: (
                    <Center style={{ gap: 6 }}>
                      <IconUserCheck size={16} />
                      <span>Select Existing User</span>
                    </Center>
                  ),
                  value: "existing",
                },
                {
                  label: (
                    <Center style={{ gap: 6 }}>
                      <IconUserPlus size={16} />
                      <span>+ Add New Donor / User</span>
                    </Center>
                  ),
                  value: "new",
                },
              ]}
              fullWidth
              color="teal"
            />
          </div>

          {/* MODE 1: SELECT EXISTING USER */}
          {donorMode === "existing" ? (
            <Paper p="sm" withBorder radius="sm" bg="gray.0">
              <Select
                label="Select Donor from User Administration"
                placeholder={
                  loadingUsers
                    ? "Loading users..."
                    : "Search registered user by name, email, or phone"
                }
                required
                data={userSelectData}
                value={userId}
                onChange={(val) => setUserId(val)}
                searchable
                nothingFoundMessage="No user found"
                leftSection={<IconUser size={16} />}
                disabled={loadingUsers}
              />
              <Group justify="space-between" align="center" mt="xs">
                <Text size="xs" c="dimmed">
                  User not in the list?
                </Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="teal"
                  leftSection={<IconUserPlus size={12} />}
                  onClick={() => setDonorMode("new")}
                >
                  Click to Add New User & Record Pledge
                </Button>
              </Group>
            </Paper>
          ) : (
            /* MODE 2: ADD NEW USER (First Name, Last Name, Phone, Email) */
            <Paper p="md" withBorder radius="md" bg="teal.0">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Group gap={6}>
                    <IconSparkles size={16} color="var(--mantine-color-teal-7)" />
                    <Text size="sm" fw={700} c="teal.9">
                      New Donor Registration
                    </Text>
                  </Group>
                  <Badge color="teal" variant="filled">
                    Will auto-add to User Administration
                  </Badge>
                </Group>

                <Text size="xs" c="dimmed">
                  This donor will be created in the User system database and linked to this pledge automatically.
                </Text>

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

                <Group grow>
                  <TextInput
                    label="Email Address"
                    placeholder="e.g. mtariq@example.com"
                    type="email"
                    required
                    leftSection={<IconMail size={16} />}
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.currentTarget.value)}
                  />
                  <TextInput
                    label="Phone Number"
                    placeholder="e.g. +1 416-555-0199"
                    required
                    leftSection={<IconPhone size={16} />}
                    value={phone}
                    onChange={(e) => setPhone(e.currentTarget.value)}
                  />
                </Group>
              </Stack>
            </Paper>
          )}

          <Divider label="Pledge Details" labelPosition="center" />

          {/* Pledge Money & Currency */}
          <Group grow>
            <NumberInput
              label="Pledge Money"
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
              label="Chosen Currency"
              data={CURRENCIES}
              value={currency}
              onChange={(val) => setCurrency(val || "CAD")}
              searchable
              required
            />
          </Group>

          {/* Channel & Received Amount */}
          <Group grow>
            <Select
              label="Pledge Channel / Source"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val || "WHATSAPP")}
              data={[
                { value: "WHATSAPP", label: "WhatsApp Message / Group" },
                { value: "PHONE", label: "Phone Call / Direct Verbal" },
                { value: "TELEGRAM", label: "Telegram" },
                { value: "E_TRANSFER", label: "Interac / E-Transfer Notice" },
                { value: "IN_PERSON", label: "In Person Commitment" },
                { value: "OTHER", label: "Other Social Media / Channel" },
              ]}
            />

            <NumberInput
              label="Initial Money Received (Optional)"
              description="Leave 0 if not yet sent"
              min={0}
              value={receivedAmount}
              onChange={(val) => setReceivedAmount(val || 0)}
              leftSection={<IconCoin size={16} />}
            />
          </Group>

          {/* Quick Preview Card */}
          {pledgeAmount > 0 && (
            <Paper p="xs" withBorder radius="sm" bg="teal.0">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed">
                    Summary Commitment:
                  </Text>
                  <Text size="sm" fw={700} c="teal.9">
                    {formatCurrency(pledgeAmount, currency)}
                  </Text>
                </div>
                <Badge
                  color={
                    receivedAmount >= pledgeAmount
                      ? "green"
                      : receivedAmount > 0
                      ? "orange"
                      : "blue"
                  }
                  variant="filled"
                >
                  {receivedAmount >= pledgeAmount
                    ? "Fully Paid"
                    : receivedAmount > 0
                    ? "Partially Paid"
                    : "Pledged (Pending Payment)"}
                </Badge>
              </Group>
            </Paper>
          )}

          <Textarea
            label="Comments & Remarks"
            placeholder="e.g. Committed via WhatsApp group #2, will send e-transfer by Friday..."
            minRows={2}
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="teal" loading={loading}>
              {donorMode === "new"
                ? "Register User & Save Pledge"
                : "Save Donor Pledge"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
