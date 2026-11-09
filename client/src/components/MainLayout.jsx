import React, { useState } from "react";
import { AppShell, Box } from "@mantine/core";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";

import { SuperUserMenu } from "../features/menu/components/drop-main-menu/SuperUserMenu";
import { WlsAdminMenu } from "../features/menu/components/drop-main-menu/WlsAdminMenu";
import { UserMenu } from "../features/menu/components/drop-main-menu/UserMenu";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNavigationDrawer } from "@/components/layout/MobileNavigationDrawer";

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const [mobileOpened, setMobileOpened] = useState(false);

  const roleUpper = (user?.role || "").toUpperCase();
  const rolesUpper = Array.isArray(user?.roles)
    ? user.roles.map((r) => String(r).toUpperCase())
    : [];

  const isSuperAdmin =
    roleUpper === UserRole.SUPER_USER ||
    roleUpper === "SUPER_USER" ||
    roleUpper === "UNIVERSITY_SUPER_USER" ||
    rolesUpper.includes("SUPER_USER") ||
    rolesUpper.includes("UNIVERSITY_SUPER_USER");

  const isWlsAdmin =
    isSuperAdmin ||
    roleUpper === UserRole.WLS_ADMIN ||
    roleUpper === "WLS_ADMIN" ||
    rolesUpper.includes("WLS_ADMIN");

  if (!user) {
    return <Box p="md">{children}</Box>;
  }

  return (
    <AppShell
      header={{ height: { base: 60, md: 96 } }}
      footer={{ height: 38 }}
      padding={{ base: "xs", sm: "sm" }}
    >
      {/* AppShell Header */}
      <AppShell.Header
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          maxWidth: "100vw",
        }}
      >
        <Header
          user={user}
          setActiveTab={setActiveTab}
          logout={logout}
          notificationCount={3}
          mobileOpened={mobileOpened}
          onToggleMobile={() => setMobileOpened((o) => !o)}
        />

        {/* Bottom Row: Navigation Menus (Desktop & Large Screens) */}
        <Box
          visibleFrom="md"
          style={{
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "4px",
            paddingBottom: "4px",
            overflowX: "visible",
            whiteSpace: "nowrap",
            backgroundColor: "white",
          }}
        >
          {isSuperAdmin ? (
            <SuperUserMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          ) : isWlsAdmin ? (
            <WlsAdminMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          ) : (
            <UserMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </Box>
      </AppShell.Header>

      {/* Mobile & Tablet Slide-out Drawer */}
      <MobileNavigationDrawer
        opened={mobileOpened}
        onClose={() => setMobileOpened(false)}
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logout={logout}
        notificationCount={3}
      />

      {/* Main Content Area styled for vertical equilibrium */}
      <AppShell.Main
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - var(--app-shell-header-offset, 96px) - var(--app-shell-footer-offset, 38px))",
          boxSizing: "border-box",
          maxWidth: "100vw",
          overflowX: "hidden",
          paddingBottom: "50px",
        }}
      >
        {children}
      </AppShell.Main>

      {/* Modular Footer Component */}
      <AppShell.Footer p={0}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}

export default MainLayout;
