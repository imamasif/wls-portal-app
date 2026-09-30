import React from "react";
import { Box } from "@mantine/core";

export function NotebookSpine() {
  return (
    <Box
      style={{
        width: 60,
        background: "linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)",
        borderRight: "1px solid #64748b",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "20px 0",
        boxShadow: "inset -5px 0 10px rgba(0,0,0,0.12)",
        zIndex: 10,
      }}
    >
      {[...Array(9)].map((_, i) => (
        <Box
          key={i}
          style={{
            width: 32,
            height: 14,
            background:
              "linear-gradient(180deg, #e2e8f0 0%, #ffffff 50%, #64748b 100%)",
            borderRadius: 8,
            boxShadow:
              "2px 3px 5px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255,255,255,0.9)",
            border: "1px solid #475569",
          }}
        />
      ))}
    </Box>
  );
}
