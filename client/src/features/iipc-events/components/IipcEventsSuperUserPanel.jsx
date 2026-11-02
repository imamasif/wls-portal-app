import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Button,
  Stack,
  SimpleGrid,
  Select,
  Loader,
  Alert,
  Tabs,
  Badge,
} from "@mantine/core";
import {
  IconPlus,
  IconBrandWhatsapp,
  IconChartBar,
  IconCalendarHeart,
  IconSparkles,
  IconCoin,
  IconUsers,
} from "@tabler/icons-react";
import { iipcEventsApi } from "../api/iipcEventsApi";
import { ProjectCard } from "./ProjectCard";
import { AddProjectModal } from "./AddProjectModal";
import { AddPledgeModal } from "./AddPledgeModal";
import { MarkPaymentModal } from "./MarkPaymentModal";
import { EventReportSection } from "./EventReportSection";
import { formatCurrency } from "../currencyUtils";

export function IipcEventsSuperUserPanel({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const [selectedReportEventId, setSelectedReportEventId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Modals state
  const [addProjectOpened, setAddProjectOpened] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [addPledgeOpened, setAddPledgeOpened] = useState(false);
  const [targetEventForPledge, setTargetEventForPledge] = useState(null);
  const [markPaymentOpened, setMarkPaymentOpened] = useState(false);
  const [selectedDonationForPay, setSelectedDonationForPay] = useState(null);

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await iipcEventsApi.getAllEvents("ALL");
      setEvents(data);
      if (data.length > 0 && !selectedReportEventId) {
        setSelectedReportEventId(data[0].id || data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
      setNotification({
        type: "error",
        message: "Failed to load projects: " + (err.response?.data?.error || err.message),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (eventId) => {
    if (!eventId) return;
    try {
      setLoadingReport(true);
      const data = await iipcEventsApi.getEventReport(eventId);
      setReportData(data);
    } catch (err) {
      console.error("Failed to load report:", err);
      setNotification({
        type: "error",
        message: "Failed to load report: " + (err.response?.data?.error || err.message),
      });
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedReportEventId) {
      fetchReport(selectedReportEventId);
    }
  }, [selectedReportEventId]);

  // Handle Save Project
  const handleSaveProject = async (projectData) => {
    try {
      if (editingProject) {
        await iipcEventsApi.updateEvent(editingProject.id || editingProject._id, projectData);
        setNotification({
          type: "success",
          message: `Project "${projectData.title}" updated successfully!`,
        });
      } else {
        await iipcEventsApi.createEvent({
          ...projectData,
          createdBy: user?.id || user?._id,
        });
        setNotification({
          type: "success",
          message: `Project "${projectData.title}" launched! Notifications sent to users.`,
        });
      }
      setAddProjectOpened(false);
      setEditingProject(null);
      await fetchEvents();
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.error || err.message,
      });
    }
  };

  // Handle Delete Project
  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Are you sure you want to delete project "${proj.title}" and its pledges?`)) {
      return;
    }
    try {
      await iipcEventsApi.deleteEvent(proj.id || proj._id);
      setNotification({
        type: "success",
        message: `Project "${proj.title}" removed successfully.`,
      });
      await fetchEvents();
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.error || err.message,
      });
    }
  };

  // Handle Add Pledge on Behalf
  const handleSavePledge = async (pledgeData) => {
    try {
      const result = await iipcEventsApi.createDonation({
        ...pledgeData,
        addedBy: user?.id || user?._id,
      });
      setNotification({
        type: "success",
        message: pledgeData.isNewUser
          ? `New donor "${pledgeData.donorName}" created in User Administration & pledge registered!`
          : `Pledge from "${pledgeData.donorName}" registered successfully!`,
      });
      setAddPledgeOpened(false);
      await fetchEvents();
      if (selectedReportEventId === pledgeData.eventId) {
        await fetchReport(selectedReportEventId);
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.error || err.message,
      });
    }
  };

  // Handle Mark Payment Received
  const handleSavePayment = async (payData) => {
    try {
      await iipcEventsApi.markPayment(payData.donationId, payData);
      setNotification({
        type: "success",
        message: "Payment record updated successfully!",
      });
      setMarkPaymentOpened(false);
      setSelectedDonationForPay(null);
      await fetchEvents();
      if (selectedReportEventId) {
        await fetchReport(selectedReportEventId);
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.error || err.message,
      });
    }
  };

  // Overall totals across all active events
  const totalTargetAll = events.reduce((sum, e) => sum + (e.targetAmount || 0), 0);
  const totalPledgedAll = events.reduce(
    (sum, e) => sum + (e.summary?.totalPledged || 0),
    0
  );
  const totalReceivedAll = events.reduce(
    (sum, e) => sum + (e.summary?.totalReceived || 0),
    0
  );

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Page Banner Header */}
        <Paper
          p="lg"
          radius="md"
          withBorder
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "white",
          }}
        >
          <Group justify="space-between" align="center">
            <div>
              <Group gap="xs">
                <IconCalendarHeart size={28} color="#2dd4bf" />
                <Title order={2} style={{ color: "white" }}>
                  IIPC-EVENTS
                </Title>
                <Badge color="teal" variant="filled">
                  Super User Portal
                </Badge>
              </Group>
              <Text size="sm" c="gray.4" mt={4}>
                Launch project appeals, capture WhatsApp / social donor pledges, track received funds, and generate executive reports.
              </Text>
            </div>

            <Group gap="xs">
              <Button
                color="green"
                leftSection={<IconBrandWhatsapp size={16} />}
                onClick={() => {
                  setTargetEventForPledge(null);
                  setAddPledgeOpened(true);
                }}
              >
                + Pledge on Behalf
              </Button>
              <Button
                color="teal"
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  setEditingProject(null);
                  setAddProjectOpened(true);
                }}
              >
                Launch New Project
              </Button>
            </Group>
          </Group>

          {/* Quick Metrics Bar */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mt="lg">
            <Paper p="sm" radius="sm" bg="rgba(255, 255, 255, 0.08)">
              <Text size="11px" c="gray.4" tt="uppercase" fw={600}>
                Total Target Goal (All Projects)
              </Text>
              <Text size="lg" fw={700} c="cyan.3">
                {formatCurrency(totalTargetAll, "CAD")}
              </Text>
            </Paper>
            <Paper p="sm" radius="sm" bg="rgba(255, 255, 255, 0.08)">
              <Text size="11px" c="gray.4" tt="uppercase" fw={600}>
                Total Committed / Pledged
              </Text>
              <Text size="lg" fw={700} c="indigo.2">
                {formatCurrency(totalPledgedAll, "CAD")}
              </Text>
            </Paper>
            <Paper p="sm" radius="sm" bg="rgba(255, 255, 255, 0.08)">
              <Text size="11px" c="gray.4" tt="uppercase" fw={600}>
                Total Received in Account
              </Text>
              <Text size="lg" fw={700} c="teal.3">
                {formatCurrency(totalReceivedAll, "CAD")}
              </Text>
            </Paper>
          </SimpleGrid>
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

        {/* Main Tabs Navigation */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="projects"
              leftSection={<IconCalendarHeart size={16} />}
            >
              Active Projects ({events.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="report"
              leftSection={<IconChartBar size={16} />}
            >
              Executive Report & Donor Tracker
            </Tabs.Tab>
          </Tabs.List>

          {/* Tab 1: Projects Grid */}
          <Tabs.Panel value="projects" pt="md">
            {loading ? (
              <Paper p="xl" ta="center">
                <Loader size="md" color="teal" />
                <Text size="sm" c="dimmed" mt="xs">
                  Loading IIPC Events...
                </Text>
              </Paper>
            ) : events.length > 0 ? (
              <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                {events.map((proj) => (
                  <ProjectCard
                    key={proj.id || proj._id}
                    project={proj}
                    isSuperUser={true}
                    onAddPledgeOnBehalf={(p) => {
                      setTargetEventForPledge(p.id || p._id);
                      setAddPledgeOpened(true);
                    }}
                    onViewReport={(p) => {
                      setSelectedReportEventId(p.id || p._id);
                      setActiveTab("report");
                    }}
                    onEdit={(p) => {
                      setEditingProject(p);
                      setAddProjectOpened(true);
                    }}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Paper p="xl" withBorder radius="md" ta="center">
                <Text fw={600} size="md">
                  No Project Appeals Active
                </Text>
                <Text size="sm" c="dimmed" mt={4} mb="md">
                  Get started by creating your first IIPC Event / Project appeal.
                </Text>
                <Button
                  color="teal"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    setEditingProject(null);
                    setAddProjectOpened(true);
                  }}
                >
                  Create Project Appeal
                </Button>
              </Paper>
            )}
          </Tabs.Panel>

          {/* Tab 2: Financial Report & Donors Tracking */}
          <Tabs.Panel value="report" pt="md">
            <Group justify="space-between" mb="md">
              <Select
                label="Select Project for Executive Report"
                data={events.map((e) => ({
                  value: e.id || e._id,
                  label: `${e.title} [Target: ${e.currency} ${Number(e.targetAmount || 0).toLocaleString()}]`,
                }))}
                value={selectedReportEventId}
                onChange={(val) => setSelectedReportEventId(val)}
                style={{ width: 360 }}
              />

              <Button
                color="green"
                size="sm"
                leftSection={<IconBrandWhatsapp size={16} />}
                onClick={() => {
                  setTargetEventForPledge(selectedReportEventId);
                  setAddPledgeOpened(true);
                }}
              >
                + Record Pledge on Behalf
              </Button>
            </Group>

            {loadingReport ? (
              <Paper p="xl" ta="center">
                <Loader size="md" color="teal" />
                <Text size="sm" c="dimmed" mt="xs">
                  Generating report...
                </Text>
              </Paper>
            ) : (
              <EventReportSection
                reportData={reportData}
                isSuperUser={true}
                onMarkPayment={(donation) => {
                  setSelectedDonationForPay(donation);
                  setMarkPaymentOpened(true);
                }}
              />
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Add / Edit Project Modal */}
      <AddProjectModal
        opened={addProjectOpened}
        onClose={() => {
          setAddProjectOpened(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
      />

      {/* Add Pledge on Behalf Modal */}
      <AddPledgeModal
        opened={addPledgeOpened}
        onClose={() => {
          setAddPledgeOpened(false);
          setTargetEventForPledge(null);
        }}
        onSave={handleSavePledge}
        events={events}
        selectedEventId={targetEventForPledge}
      />

      {/* Mark Payment Received Modal */}
      <MarkPaymentModal
        opened={markPaymentOpened}
        onClose={() => {
          setMarkPaymentOpened(false);
          setSelectedDonationForPay(null);
        }}
        onSave={handleSavePayment}
        donation={selectedDonationForPay}
      />
    </Container>
  );
}
