// src/features/sticky-notes/components/StickyNotesPanel.jsx

import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Group,
  Card,
  ActionIcon,
  Badge,
  Box,
  Tooltip,
  useMantineColorScheme, // Add hook here
} from "@mantine/core";
import {
  IconBook,
  IconSearch,
  IconMoon,
  IconSun, // Add IconSun here
  IconPrinter,
  IconShare2,
  IconUsers,
  IconLink,
  IconCheck,
  IconHeartHandshake,
  IconBellRinging,
  IconCopy,
  IconX,
} from "@tabler/icons-react"; // Remove the second @tabler/icons-react import statement below

import { SocialMediaSection } from "./sections/SocialMediaSection";
import { VolunteerRulesSection } from "./sections/VolunteerRulesSection";
import { ImportantLinksSection } from "./sections/ImportantLinksSection";
import { DonationLinksSection } from "./sections/DonationLinksSection";
import { DonationReminderSection } from "./sections/DonationReminderSection";
import { NotebookSpine } from "./NotebookSpine";
import { SideRibbons } from "./SideRibbons";
import { fetchStickyNotesData } from "../api/stickyNotesApi";

export function StickyNotesPanel() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    fetchStickyNotesData().catch((err) => console.log("API load log:", err));
  }, []);

  const handleTabChange = (index) => {
    if (index === activeTab) return;
    setIsFlipping(true);
    setTimeout(() => {
      setActiveTab(index);
      setIsFlipping(false);
    }, 200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabsInfo = [
    { title: "01. Social Media Links", icon: <IconShare2 size={16} /> },
    { title: "02. Volunteer Rules", icon: <IconUsers size={16} /> },
    { title: "03. Important Links", icon: <IconLink size={16} /> },
    { title: "04. Donation Links", icon: <IconHeartHandshake size={16} /> },
    { title: "05. Donation Reminder", icon: <IconBellRinging size={16} /> },
  ];

  return (
    <Container size="xl" py="md">
      {/* Top Header */}
      <Group justify="space-between" mb="lg" px="xs">
        <Group gap="md">
          <Box
            style={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            <IconBook size={26} />
          </Box>
          <div>
            <Title order={2} c="dark.8" style={{ fontWeight: 800 }}>
              Instructions & Quick Notes Notebook
            </Title>
            <Text size="sm" c="dimmed">
              Click binder tabs or side ribbons to navigate notice cards.
            </Text>
          </div>
        </Group>

        <Group gap="sm">
          <TextInput
            placeholder="Search instructions..."
            leftSection={
              <IconSearch size={16} color="var(--mantine-color-dimmed)" />
            }
            rightSection={
              searchQuery ? (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setSearchQuery("")}
                >
                  <IconX size={12} />
                </ActionIcon>
              ) : null
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 280 }}
            radius="xl"
            variant="filled"
          />

          {/* Theme Toggle Button */}
          <ActionIcon
            variant="default"
            radius="xl"
            size={38}
            onClick={() => toggleColorScheme()}
            title="Toggle theme"
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>

          <ActionIcon
            variant="default"
            radius="xl"
            size={38}
            onClick={() => window.print()}
          >
            <IconPrinter size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Main Notebook */}
      <Card
        padding={0}
        radius="xl"
        withBorder
        shadow="xl"
        style={{
          backgroundColor: isDark ? "var(--mantine-color-dark-7)" : "#f8fafc",
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          minHeight: 650,
          border: isDark
            ? "1px solid var(--mantine-color-dark-4)"
            : "1px solid #e2e8f0",
          perspective: "1200px",
        }}
      >
        <NotebookSpine />

        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: isDark ? "var(--mantine-color-dark-6)" : "#ffffff",
          }}
        >
          {/* Top Tabs */}
          <Group
            justify="space-between"
            px="lg"
            py="xs"
            style={{
              borderBottom: isDark
                ? "1px solid var(--mantine-color-dark-4)"
                : "1px solid #f1f5f9",
              background: isDark ? "var(--mantine-color-dark-8)" : "#f8fafc",
            }}
          >
            <Group gap="xs" style={{ flexWrap: "wrap" }}>
              {tabsInfo.map((tab, idx) => (
                <Button
                  key={idx}
                  variant={activeTab === idx ? "filled" : "subtle"}
                  color={activeTab === idx ? "indigo" : "gray"}
                  leftSection={tab.icon}
                  onClick={() => handleTabChange(idx)}
                  radius="xl"
                  size="xs"
                  style={{ fontWeight: 700 }}
                >
                  {tab.title}
                </Button>
              ))}
            </Group>

            <Text size="xs" c="dimmed" fs="italic">
              Page{" "}
              <Text span fw={800} c="indigo.7" size="sm">
                0{activeTab + 1} / 05
              </Text>
            </Text>
          </Group>

          {/* Content Area */}
          <Box
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "row",
              position: "relative",
            }}
          >
            <Box
              style={{
                flex: 1,
                padding: "24px 28px",
                maxHeight: 570,
                overflowY: "auto",
                transformOrigin: "left center",
                transition:
                  "transform 0.22s ease-in-out, opacity 0.18s ease-in-out",
                transform: isFlipping
                  ? "rotateY(-10deg) scale(0.98)"
                  : "rotateY(0deg) scale(1)",
                opacity: isFlipping ? 0.3 : 1,
              }}
            >
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <Badge color="red" size="lg" radius="xl" variant="filled">
                    IMPORTANT NOTICE
                  </Badge>
                  <Title
                    order={3}
                    c={isDark ? "gray.1" : "dark.9"}
                    style={{ fontWeight: 800 }}
                  >
                    {activeTab === 0 &&
                      "1. Social Media Links & Official Catalogs"}
                    {activeTab === 1 && "2. Volunteer Rules for IIPC Canada"}
                    {activeTab === 2 && "3. Important Easy Access Links"}
                    {activeTab === 3 && "4. Donation & Banking Details"}
                    {activeTab === 4 && "5. Monthly Donation & Sadqa Reminder"}
                  </Title>
                </Group>
                <Tooltip label={copied ? "Copied!" : "Copy Page Link"}>
                  <Button
                    variant="light"
                    color={copied ? "teal" : "indigo"}
                    leftSection={
                      copied ? <IconCheck size={16} /> : <IconCopy size={16} />
                    }
                    onClick={handleCopy}
                    size="xs"
                    radius="md"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </Tooltip>
              </Group>

              {activeTab === 0 && (
                <SocialMediaSection searchQuery={searchQuery} />
              )}
              {activeTab === 1 && (
                <VolunteerRulesSection searchQuery={searchQuery} />
              )}
              {activeTab === 2 && (
                <ImportantLinksSection searchQuery={searchQuery} />
              )}
              {activeTab === 3 && (
                <DonationLinksSection searchQuery={searchQuery} />
              )}
              {activeTab === 4 && (
                <DonationReminderSection searchQuery={searchQuery} />
              )}

              <Box
                p="md"
                mt="md"
                style={{
                  backgroundColor: isDark
                    ? "var(--mantine-color-red-9)"
                    : "#fff1f2",
                  border: isDark
                    ? "1px solid var(--mantine-color-red-8)"
                    : "1px solid #fecdd3",
                  borderRadius: 14,
                  color: isDark ? "#ffe4e6" : "#9f1239",
                  fontSize: 13,
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                Circulate in your environment in all Social Media & get
                Multifold Reward from Allah The Almighty.
                <br />
                <Text span fw={800} c={isDark ? "white" : "rose.9"}>
                  TEAM IIPCCANADA ADMIN
                </Text>{" "}
                • MuhammadShaikh.Com | iipcCanada.Com
              </Box>
            </Box>

            <SideRibbons activeTab={activeTab} onTabChange={handleTabChange} />
          </Box>

          {/* Footer Bar */}
          <Group
            justify="space-between"
            px="xl"
            py="xs"
            style={{
              borderTop: isDark
                ? "1px solid var(--mantine-color-dark-4)"
                : "1px solid #f1f5f9",
              background: isDark ? "var(--mantine-color-dark-8)" : "#f8fafc",
            }}
          >
            <Group gap="xs">
              <Box
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "#10b981",
                  borderRadius: "50%",
                }}
              />
              <Text size="xs" c={isDark ? "gray.3" : "dark.6"} fw={600}>
                Ready • Active Section {activeTab + 1}:{" "}
                {tabsInfo[activeTab].title}
              </Text>
            </Group>
            <Text size="xs" c="dimmed" fw={500}>
              Interactive Mantine Note UI
            </Text>
          </Group>
        </Box>
      </Card>
    </Container>
  );
}
