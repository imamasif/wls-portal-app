// src/components/layout/Footer.jsx
import React from "react";
import { Group, Text, Box } from "@mantine/core";

export function Footer() {
  return (
    <Box
      component="footer"
      px={{ base: "xs", sm: "md", md: "xl" }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        boxSizing: "border-box",
        height: "38px",
        backgroundColor: "var(--mantine-color-white)",
        borderTop: "1px solid var(--mantine-color-gray-2)",
        flexWrap: "nowrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          color: "var(--mantine-color-dimmed)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <span
          style={{
            color: "var(--mantine-color-teal-7)",
            fontWeight: 900,
            fontSize: "24px",
            lineHeight: "1",
            display: "inline-block",
            transform: "translateY(1px)",
          }}
        >
          &copy;
        </span>
        <span style={{ fontWeight: 400 }}>{new Date().getFullYear()} IIPC</span>
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            margin: "0 2px",
            fontWeight: 400,
            color: "var(--mantine-color-dimmed)",
          }}
        >
          CANADA
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 900 450"
            style={{
              width: "14px",
              height: "9px",
              position: "absolute",
              top: "-7px",
              right: "-12px",
              borderRadius: "1px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            <rect width="900" height="450" fill="#fff" />
            <rect width="225" height="450" fill="#ff0000" />
            <rect x="675" width="225" height="450" fill="#ff0000" />
            <path
              fill="#ff0000"
              d="M450,75 l20,55 l45,-20 l-10,45 l40,15 l-30,30 l25,35 l-45,-5 l-15,40 l-30,-35 l-30,35 l-15,-40 l-45,5 l25,-35 l-30,-30 l40,-15 l-10,-45 l45,20 z"
            />
          </svg>
        </span>
        <span style={{ fontWeight: 400 }}>
          Learning Portal
        </span>
      </div>

      <Group gap="xs" align="center" visibleFrom="xs" wrap="nowrap">
        <Text size="xs" c="dimmed" fw={600}>
          Canada
        </Text>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 900 450"
          style={{
            width: "32px",
            height: "19px",
            borderRadius: "2px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            display: "block",
          }}
        >
          <rect width="900" height="450" fill="#fff" />
          <rect width="225" height="450" fill="#ff0000" />
          <rect x="675" width="225" height="450" fill="#ff0000" />
          <path
            fill="#ff0000"
            d="M450,75 l20,55 l45,-20 l-10,45 l40,15 l-30,30 l25,35 l-45,-5 l-15,40 l-30,-35 l-30,35 l-15,-40 l-45,5 l25,-35 l-30,-30 l40,-15 l-10,-45 l45,20 z"
          />
        </svg>
      </Group>
    </Box>
  );
}

export default Footer;
