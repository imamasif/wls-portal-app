// src/features/sticky-notes/components/SideRibbons.jsx

import React from "react";
import { Box, Text } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";

export function SideRibbons({ activeTab, onTabChange }) {
  const ribbons = [
    { label: "Social Media Links", bg: "#3b82f6", activeBg: "#1d4ed8" },
    { label: "Volunteer Rules", bg: "#10b981", activeBg: "#047857" },
    { label: "Important Links", bg: "#6366f1", activeBg: "#4338ca" },
    { label: "Donation Links", bg: "#f59e0b", activeBg: "#b45309" },
    { label: "Donation Reminder", bg: "#ef4444", activeBg: "#b91c1c" },
    { label: "Lecture Library", bg: "#8b5cf6", activeBg: "#6d28d9" },
  ];

  return (
    <Box
      style={{
        width: 210,
        borderLeft: "1px solid #f1f5f9",
        padding: "24px 0px 24px 10px",
        background: "#fafafa",
        minHeight: 520,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Text
        size="xs"
        fw={800}
        c="dimmed"
        tt="uppercase"
        px="xs"
        style={{ letterSpacing: 1 }}
      >
        Notice Tags
      </Text>

      {ribbons.map((ribbon, idx) => (
        <Box
          key={idx}
          onClick={() => onTabChange(idx)}
          style={{
            position: "relative",
            backgroundColor: activeTab === idx ? ribbon.activeBg : ribbon.bg,
            color: "white",
            padding: "9px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            clipPath:
              "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 6px 50%)",
            filter:
              activeTab === idx
                ? "drop-shadow(2px 3px 5px rgba(0,0,0,0.22))"
                : "none",
            transform: activeTab === idx ? "translateX(-6px)" : "none",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{ribbon.label}</span>
          <IconChevronRight size={13} style={{ marginRight: 8 }} />
        </Box>
      ))}
    </Box>
  );
}
