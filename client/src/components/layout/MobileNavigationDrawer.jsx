import React from "react";
import {
  Drawer,
  Box,
  Text,
  Group,
  Avatar,
  Badge,
  Divider,
  ScrollArea,
  NavLink,
  ActionIcon,
} from "@mantine/core";
import { AppTab, UserRole } from "@/types/user";
import {
  IconLayoutDashboard,
  IconUsers,
  IconShieldCheck,
  IconSchool,
  IconChartBar,
  IconBrandWhatsapp,
  IconBrandTeams,
  IconBuildingBank,
  IconTools,
  IconClipboardCheck,
  IconPencilPlus,
  IconListDetails,
  IconNotes,
  IconFingerprint,
  IconBook,
  IconSitemap,
  IconCircleCheck,
  IconDatabase,
  IconSparkles,
  IconNotebook,
  IconCalendarHeart,
  IconCategory,
  IconHeartHandshake,
  IconPencil,
  IconLogout,
  IconX,
  IconBell,
  IconChecklist,
} from "@tabler/icons-react";

export function MobileNavigationDrawer({
  opened,
  onClose,
  user,
  activeTab,
  setActiveTab,
  logout,
  notificationCount = 0,
}) {
  const activeRole = (user?.role || "").toUpperCase();
  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  const handleNav = (tab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="left"
      size="310px"
      padding={0}
      zIndex={1000}
      withCloseButton={false}
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
    >
      {/* Branded Drawer Header */}
      <Box
        p="md"
        style={{
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          backgroundColor: "var(--mantine-color-white)",
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" align="center" wrap="nowrap">
            <Box
              style={{
                height: "38px",
                width: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid var(--mantine-color-gray-2)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                flexShrink: 0,
                padding: "2px",
              }}
            >
              <img
                src="/iipc-logo1.png"
                alt="IIPC Logo"
                style={{
                  height: "100%",
                  width: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Box>
            <div>
              <Group gap={4} align="center">
                <Text fw={700} size="sm" c="dark.9">
                  IIPC CANADA
                </Text>
              </Group>
              <Text
                size="10px"
                fw={600}
                style={{
                  background: "linear-gradient(45deg, #12b886, #228be6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Learning Portal
              </Text>
            </div>
          </Group>

          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={onClose}
            aria-label="Close menu"
          >
            <IconX size={20} />
          </ActionIcon>
        </Group>

        {/* User Card */}
        {user && (
          <Box
            mt="sm"
            p="xs"
            style={{
              backgroundColor: "var(--mantine-color-gray-0)",
              borderRadius: "8px",
            }}
          >
            <Group gap="xs" align="center" wrap="nowrap">
              <Avatar
                src={user?.profilePictureUrl || user?.avatarUrl}
                alt="User Avatar"
                size="md"
                radius="xl"
                color="teal"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Avatar>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text size="xs" fw={700} truncate c="dark.9">
                  {user?.name || "User"}
                </Text>
                <Text size="10px" c="dimmed" truncate>
                  {user?.email || ""}
                </Text>
                <Badge
                  color="cyan"
                  variant="light"
                  size="xs"
                  radius="sm"
                  mt={2}
                >
                  {user?.role || "USER"}
                </Badge>
              </div>
            </Group>
          </Box>
        )}
      </Box>

      {/* Scrollable Navigation List */}
      <ScrollArea style={{ flex: 1 }} p="xs">
        {/* Core: Dashboard */}
        <NavLink
          label="Dashboard"
          leftSection={<IconLayoutDashboard size={18} color="var(--mantine-color-teal-6)" />}
          active={activeTab === AppTab.DASHBOARD}
          onClick={() => handleNav(AppTab.DASHBOARD)}
          style={{ borderRadius: "6px", marginBottom: "4px" }}
        />

        {/* Notifications Shortcut */}
        <NavLink
          label="Notifications"
          leftSection={<IconBell size={18} color="var(--mantine-color-yellow-6)" />}
          rightSection={
            notificationCount > 0 ? (
              <Badge size="xs" color="red" variant="filled" circle>
                {notificationCount}
              </Badge>
            ) : null
          }
          active={activeTab === AppTab.NOTIFICATIONS}
          onClick={() => handleNav(AppTab.NOTIFICATIONS)}
          style={{ borderRadius: "6px", marginBottom: "4px" }}
        />

        {/* SUPER USER / WLS ADMIN NAVIGATION */}
        {isWlsAdmin ? (
          <>
            {/* WLS Management */}
            <NavLink
              label="WLS Management"
              leftSection={<IconSchool size={18} color="var(--mantine-color-indigo-6)" />}
              childrenOffset={20}
              defaultOpened={
                activeTab === AppTab.WLS_SESSION ||
                activeTab === AppTab.WLS_ATTENDANCE_MONITORING ||
                activeTab === AppTab.WLS_CLASS_ATTENDANCE ||
                activeTab === AppTab.WLS_MGMT ||
                activeTab === AppTab.ASSESSMENT ||
                activeTab === AppTab.ASSESSMENT_OVERVIEW ||
                activeTab === AppTab.REPORTS
              }
              style={{ borderRadius: "6px", marginBottom: "4px" }}
            >
              <NavLink
                label="My WLS Session"
                leftSection={<IconSchool size={16} color="var(--mantine-color-teal-6)" />}
                active={activeTab === AppTab.WLS_SESSION}
                onClick={() => handleNav(AppTab.WLS_SESSION)}
              />
              <NavLink
                label="Attendance Monitoring"
                leftSection={<IconUsers size={16} color="var(--mantine-color-teal-6)" />}
                active={activeTab === AppTab.WLS_ATTENDANCE_MONITORING}
                onClick={() => handleNav(AppTab.WLS_ATTENDANCE_MONITORING)}
              />
              <NavLink
                label="Class Attendance"
                leftSection={<IconFingerprint size={16} color="var(--mantine-color-red-6)" />}
                active={activeTab === AppTab.WLS_CLASS_ATTENDANCE}
                onClick={() => handleNav(AppTab.WLS_CLASS_ATTENDANCE)}
              />
              <NavLink
                label="Session Builder"
                leftSection={<IconTools size={16} color="var(--mantine-color-blue-6)" />}
                active={activeTab === AppTab.WLS_MGMT}
                onClick={() => handleNav(AppTab.WLS_MGMT)}
              />
              <NavLink
                label="Assessments & Grading"
                leftSection={<IconClipboardCheck size={16} color="var(--mantine-color-orange-6)" />}
                active={activeTab === AppTab.ASSESSMENT}
                onClick={() => handleNav(AppTab.ASSESSMENT)}
              />
              {isSuperAdmin && (
                <NavLink
                  label="Assessment Completion Portal"
                  leftSection={<IconCircleCheck size={16} color="var(--mantine-color-teal-6)" />}
                  active={activeTab === AppTab.ASSESSMENT_OVERVIEW}
                  onClick={() => handleNav(AppTab.ASSESSMENT_OVERVIEW)}
                />
              )}
              <NavLink
                label="WLS Analytics & Reports"
                leftSection={<IconChartBar size={16} color="var(--mantine-color-grape-6)" />}
                active={activeTab === AppTab.REPORTS}
                onClick={() => handleNav(AppTab.REPORTS)}
              />
            </NavLink>

            {/* Administration */}
            <NavLink
              label="Administration"
              leftSection={<IconShieldCheck size={18} color="var(--mantine-color-green-6)" />}
              childrenOffset={20}
              defaultOpened={
                activeTab === AppTab.MENU_PERMISSIONS ||
                activeTab === AppTab.WHATSAPP_GROUPS ||
                activeTab === AppTab.TEAMS_GROUPS ||
                activeTab === AppTab.UNIVERSITY_PORTAL ||
                activeTab === AppTab.USERS ||
                activeTab === AppTab.QUIZ_LIST ||
                activeTab === AppTab.QUIZ_STUDIO ||
                activeTab === AppTab.QUIZ_REPORTS ||
                activeTab === AppTab.STICKY_NOTES ||
                activeTab === AppTab.QURAN_MEMORIZER ||
                activeTab === AppTab.QURAN_EXPLORER ||
                activeTab === AppTab.QURAN_NOTEBOOK ||
                activeTab === AppTab.AYAT_MANAGER ||
                activeTab === AppTab.QURAN_TREE
              }
              style={{ borderRadius: "6px", marginBottom: "4px" }}
            >
              {isSuperAdmin && (
                <NavLink
                  label="Menu Permissions"
                  leftSection={<IconShieldCheck size={16} color="var(--mantine-color-green-6)" />}
                  active={activeTab === AppTab.MENU_PERMISSIONS}
                  onClick={() => handleNav(AppTab.MENU_PERMISSIONS)}
                />
              )}
              {isSuperAdmin && (
                <NavLink
                  label="WhatsApp Groups"
                  leftSection={<IconBrandWhatsapp size={16} color="var(--mantine-color-teal-6)" />}
                  active={activeTab === AppTab.WHATSAPP_GROUPS}
                  onClick={() => handleNav(AppTab.WHATSAPP_GROUPS)}
                />
              )}
              {isSuperAdmin && (
                <NavLink
                  label="Teams Groups"
                  leftSection={<IconBrandTeams size={16} color="var(--mantine-color-indigo-6)" />}
                  active={activeTab === AppTab.TEAMS_GROUPS}
                  onClick={() => handleNav(AppTab.TEAMS_GROUPS)}
                />
              )}
              {isSuperAdmin && (
                <NavLink
                  label="University Portal"
                  leftSection={<IconBuildingBank size={16} color="var(--mantine-color-blue-6)" />}
                  active={activeTab === AppTab.UNIVERSITY_PORTAL}
                  onClick={() => handleNav(AppTab.UNIVERSITY_PORTAL)}
                />
              )}
              {isSuperAdmin && (
                <NavLink
                  label="User Management"
                  leftSection={<IconUsers size={16} color="var(--mantine-color-cyan-6)" />}
                  active={activeTab === AppTab.USERS}
                  onClick={() => handleNav(AppTab.USERS)}
                />
              )}
              {isSuperAdmin && (
                <NavLink
                  label="Reports"
                  leftSection={<IconChartBar size={16} color="var(--mantine-color-grape-6)" />}
                  active={activeTab === AppTab.REPORTS}
                  onClick={() => handleNav(AppTab.REPORTS)}
                />
              )}
              {isSuperAdmin && (
                <>
                  <NavLink
                    label="Quiz Management"
                    leftSection={<IconListDetails size={16} color="var(--mantine-color-cyan-6)" />}
                    active={activeTab === AppTab.QUIZ_LIST}
                    onClick={() => handleNav(AppTab.QUIZ_LIST)}
                  />
                  <NavLink
                    label="Quiz Studio"
                    leftSection={<IconPencilPlus size={16} color="var(--mantine-color-pink-6)" />}
                    active={activeTab === AppTab.QUIZ_STUDIO}
                    onClick={() => handleNav(AppTab.QUIZ_STUDIO)}
                  />
                  <NavLink
                    label="Quiz Reports"
                    leftSection={<IconChartBar size={16} color="var(--mantine-color-grape-6)" />}
                    active={activeTab === AppTab.QUIZ_REPORTS}
                    onClick={() => handleNav(AppTab.QUIZ_REPORTS)}
                  />
                </>
              )}
              <NavLink
                label="Sticky Notes"
                leftSection={<IconNotes size={16} color="var(--mantine-color-yellow-6)" />}
                active={activeTab === AppTab.STICKY_NOTES}
                onClick={() => handleNav(AppTab.STICKY_NOTES)}
              />
              <NavLink
                label="Quran Reference Memorizer"
                leftSection={<IconBook size={16} color="var(--mantine-color-teal-6)" />}
                active={activeTab === AppTab.QURAN_MEMORIZER}
                onClick={() => handleNav(AppTab.QURAN_MEMORIZER)}
              />
              <NavLink
                label="Quran Sticky Notes Explorer"
                leftSection={<IconSparkles size={16} color="var(--mantine-color-grape-6)" />}
                active={activeTab === AppTab.QURAN_EXPLORER}
                onClick={() => handleNav(AppTab.QURAN_EXPLORER)}
              />
              <NavLink
                label="Quran Lecture Notebook"
                leftSection={<IconNotebook size={16} color="var(--mantine-color-indigo-6)" />}
                active={activeTab === AppTab.QURAN_NOTEBOOK}
                onClick={() => handleNav(AppTab.QURAN_NOTEBOOK)}
              />
              {isSuperAdmin && (
                <NavLink
                  label="Ayats Database Studio"
                  leftSection={<IconDatabase size={16} color="var(--mantine-color-teal-6)" />}
                  active={activeTab === AppTab.AYAT_MANAGER}
                  onClick={() => handleNav(AppTab.AYAT_MANAGER)}
                />
              )}
              <NavLink
                label="Quran Morphology Tree"
                leftSection={<IconSitemap size={16} color="var(--mantine-color-emerald-6)" />}
                active={activeTab === AppTab.QURAN_TREE}
                onClick={() => handleNav(AppTab.QURAN_TREE)}
              />
            </NavLink>

            {/* Miscellaneous */}
            <NavLink
              label="Miscellaneous"
              leftSection={<IconCategory size={18} color="var(--mantine-color-violet-6)" />}
              childrenOffset={20}
              defaultOpened={activeTab === AppTab.IIPC_EVENTS}
              style={{ borderRadius: "6px", marginBottom: "4px" }}
            >
              <NavLink
                label="IIPC-EVENTS"
                leftSection={<IconCalendarHeart size={16} color="var(--mantine-color-violet-6)" />}
                active={activeTab === AppTab.IIPC_EVENTS}
                onClick={() => handleNav(AppTab.IIPC_EVENTS)}
              />
            </NavLink>
          </>
        ) : (
          /* NORMAL USER NAVIGATION */
          <>
            {/* My Reports */}
            <NavLink
              label="My Reports"
              leftSection={<IconChartBar size={18} color="var(--mantine-color-grape-6)" />}
              active={activeTab === AppTab.REPORTS}
              onClick={() => handleNav(AppTab.REPORTS)}
              style={{ borderRadius: "6px", marginBottom: "4px" }}
            />

            {/* Assignments */}
            <NavLink
              label="Assignments"
              leftSection={<IconChecklist size={18} color="var(--mantine-color-indigo-6)" />}
              childrenOffset={20}
              defaultOpened={
                activeTab === AppTab.WLS_SESSION ||
                activeTab === AppTab.QUIZ_STUDENT ||
                activeTab === AppTab.WLS_CLASS_ATTENDANCE ||
                activeTab === AppTab.STICKY_NOTES ||
                activeTab === AppTab.QURAN_MEMORIZER ||
                activeTab === AppTab.QURAN_EXPLORER ||
                activeTab === AppTab.QURAN_NOTEBOOK ||
                activeTab === AppTab.QURAN_TREE
              }
              style={{ borderRadius: "6px", marginBottom: "4px" }}
            >
              <NavLink
                label="My WLS Session"
                leftSection={<IconSchool size={16} color="var(--mantine-color-indigo-6)" />}
                active={activeTab === AppTab.WLS_SESSION}
                onClick={() => handleNav(AppTab.WLS_SESSION)}
              />
              <NavLink
                label="My Performance Reports"
                leftSection={<IconChartBar size={16} color="var(--mantine-color-grape-6)" />}
                active={activeTab === AppTab.REPORTS}
                onClick={() => handleNav(AppTab.REPORTS)}
              />
              <NavLink
                label="Quizzes"
                leftSection={<IconClipboardCheck size={16} color="var(--mantine-color-cyan-6)" />}
                active={activeTab === AppTab.QUIZ_STUDENT}
                onClick={() => handleNav(AppTab.QUIZ_STUDENT)}
              />
              <NavLink
                label="WLS Attendance"
                leftSection={<IconFingerprint size={16} color="var(--mantine-color-red-6)" />}
                active={activeTab === AppTab.WLS_CLASS_ATTENDANCE}
                onClick={() => handleNav(AppTab.WLS_CLASS_ATTENDANCE)}
              />
              <NavLink
                label="Sticky Notes"
                leftSection={<IconNotes size={16} color="var(--mantine-color-yellow-6)" />}
                active={activeTab === AppTab.STICKY_NOTES}
                onClick={() => handleNav(AppTab.STICKY_NOTES)}
              />
              <NavLink
                label="Quran Reference Memorizer"
                leftSection={<IconBook size={16} color="var(--mantine-color-teal-6)" />}
                active={activeTab === AppTab.QURAN_MEMORIZER}
                onClick={() => handleNav(AppTab.QURAN_MEMORIZER)}
              />
              <NavLink
                label="Quran Sticky Notes Explorer"
                leftSection={<IconSparkles size={16} color="var(--mantine-color-grape-6)" />}
                active={activeTab === AppTab.QURAN_EXPLORER}
                onClick={() => handleNav(AppTab.QURAN_EXPLORER)}
              />
              <NavLink
                label="Quran Lecture Index Notebook"
                leftSection={<IconNotebook size={16} color="var(--mantine-color-indigo-6)" />}
                active={activeTab === AppTab.QURAN_NOTEBOOK}
                onClick={() => handleNav(AppTab.QURAN_NOTEBOOK)}
              />
              <NavLink
                label="Quran Morphology Tree"
                leftSection={<IconSitemap size={16} color="var(--mantine-color-emerald-6)" />}
                active={activeTab === AppTab.QURAN_TREE}
                onClick={() => handleNav(AppTab.QURAN_TREE)}
              />
            </NavLink>

            {/* Miscellaneous */}
            <NavLink
              label="Miscellaneous"
              leftSection={<IconCategory size={18} color="var(--mantine-color-violet-6)" />}
              childrenOffset={20}
              defaultOpened={activeTab === AppTab.USER_EVENTS}
              style={{ borderRadius: "6px", marginBottom: "4px" }}
            >
              <NavLink
                label="IIPC Events & Pledges"
                leftSection={<IconHeartHandshake size={16} color="var(--mantine-color-violet-6)" />}
                active={activeTab === AppTab.USER_EVENTS}
                onClick={() => handleNav(AppTab.USER_EVENTS)}
              />
            </NavLink>
          </>
        )}
      </ScrollArea>

      {/* Account Settings & Sign Out at Bottom */}
      <Box
        p="xs"
        style={{
          borderTop: "1px solid var(--mantine-color-gray-2)",
          backgroundColor: "var(--mantine-color-white)",
        }}
      >
        <NavLink
          label="Edit Profile"
          leftSection={<IconPencil size={18} color="var(--mantine-color-blue-6)" />}
          active={activeTab === AppTab.EDIT_PROFILE}
          onClick={() => handleNav(AppTab.EDIT_PROFILE)}
          style={{ borderRadius: "6px", marginBottom: "2px" }}
        />
        {logout && (
          <NavLink
            label="Sign Out"
            leftSection={<IconLogout size={18} color="var(--mantine-color-red-6)" />}
            color="red"
            onClick={() => {
              onClose();
              logout();
            }}
            style={{ borderRadius: "6px" }}
          />
        )}
      </Box>
    </Drawer>
  );
}
