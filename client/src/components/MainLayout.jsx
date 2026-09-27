import React from "react";
import { AppShell, Box } from "@mantine/core";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";

import { SuperUserMenu } from "../features/menu/components/drop-main-menu/SuperUserMenu";
import { WlsAdminMenu } from "../features/menu/components/drop-main-menu/WlsAdminMenu";
import { UserMenu } from "../features/menu/components/drop-main-menu/UserMenu";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function MainLayout({ children, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const activeRole = (user?.role || "").toUpperCase();

  const isSuperAdmin = activeRole === UserRole.SUPER_USER;
  const isWlsAdmin = isSuperAdmin || activeRole === UserRole.WLS_ADMIN;

  if (!user) {
    return <Box p="md">{children}</Box>;
  }

  return (
    <AppShell header={{ height: 96 }} footer={{ height: 38 }} padding="md">
      {/* AppShell Header */}
      <AppShell.Header
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <Header
          user={user}
          setActiveTab={setActiveTab}
          logout={logout}
          notificationCount={3}
        />

        {/* Bottom Row: Navigation Menus without duplicate border */}
        <Box
          style={{
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingTop: "3px",
            paddingBottom: "3px",
            overflowX: "auto",
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

      <AppShell.Main>{children}</AppShell.Main>

      {/* Modular Footer Component */}
      <AppShell.Footer p={0}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}

export default MainLayout;
