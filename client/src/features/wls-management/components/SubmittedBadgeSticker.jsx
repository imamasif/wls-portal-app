import React from "react";
import { Box, Text } from "@mantine/core";

export function SubmittedBadgeSticker({
  text = "SUBMITTED",
  isCompleted = false,
  isUnderReview = false,
}) {
  const isReview =
    isUnderReview || text === "UNDER REVIEW" || text === "UNDER_REVIEW";
  const badgeColor = isCompleted
    ? "#2b8a3e"
    : isReview
      ? "#e67700"
      : "#1c7ed6";
  const badgeGradient = isCompleted
    ? "linear-gradient(135deg, #40c057 0%, #2b8a3e 100%)"
    : isReview
      ? "linear-gradient(135deg, #f59f00 0%, #d9480f 100%)"
      : "linear-gradient(135deg, #339af0 0%, #1c7ed6 100%)";

  return (
    <Box
      style={{
        position: "relative",
        width: "95px",
        height: "95px",
        background: "#343a40",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "0 6px 16px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.2)",
        border: "3px dashed #495057",
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          position: "absolute",
          top: "6px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#ced4da",
          fontSize: "11px",
        }}
      >
        ★
      </Text>
      <Text
        style={{
          position: "absolute",
          bottom: "6px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#ced4da",
          fontSize: "11px",
        }}
      >
        ★
      </Text>
      <Box
        style={{
          position: "absolute",
          width: "115px",
          height: "32px",
          background: badgeGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: "11px",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          zIndex: 2,
        }}
      >
        {text}
      </Box>
      <Box
        style={{
          position: "absolute",
          left: "-10px",
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: "16px solid transparent",
          borderBottom: "16px solid transparent",
          borderRight: `12px solid ${badgeColor}`,
          zIndex: 1,
        }}
      />
      <Box
        style={{
          position: "absolute",
          right: "-10px",
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: "16px solid transparent",
          borderBottom: "16px solid transparent",
          borderLeft: `12px solid ${badgeColor}`,
          zIndex: 1,
        }}
      />
    </Box>
  );
}
