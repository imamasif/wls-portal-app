import React, { useState, useEffect } from "react";
import { Paper, Group, Text, Stack, Badge, Divider } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

/**
 * Formats live clock time into 12-hour segments using Intl.DateTimeFormat
 */
function formatDigitalTime(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const parts = formatter.formatToParts(date);
    const hours = parts.find((p) => p.type === "hour")?.value || "00";
    const minutes = parts.find((p) => p.type === "minute")?.value || "00";
    const seconds = parts.find((p) => p.type === "second")?.value || "00";
    const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value || "AM";

    return { hours, minutes, seconds, dayPeriod };
  } catch (err) {
    console.error("Invalid timeZone:", timeZone);
    return { hours: "00", minutes: "00", seconds: "00", dayPeriod: "AM" };
  }
}

/**
 * Formats a scheduled session start date in a given timeZone
 */
function formatSessionStartTime(sessionDate, timeZone) {
  if (!sessionDate) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(sessionDate));
  } catch (e) {
    return null;
  }
}

export function DualDigitalClock({ userTimeZone, sessionDate }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toronto timezone fixed for WLS HQ
  const torontoTZ = "America/Toronto";
  // User local timezone (from user profile or browser default)
  const localTZ =
    userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const torontoTime = formatDigitalTime(now, torontoTZ);
  const localTime = formatDigitalTime(now, localTZ);

  const torontoSessionStart = formatSessionStartTime(sessionDate, torontoTZ);
  const localSessionStart = formatSessionStartTime(sessionDate, localTZ);

  // Beveled & Embossed Digital Clock Container Style
  const embossedPanelStyle = {
    background: "linear-gradient(145deg, #181c24, #101218)",
    boxShadow:
      "inset 2px 2px 5px #0a0b0e, inset -2px -2px 5px #242a38, 0 4px 10px rgba(0,0,0,0.25)",
    border: "1px solid #2a3142",
    borderRadius: "10px",
  };

  const renderClockCard = (title, timeData, sessionStartStr, badgeColor) => (
    <Paper p="md" style={embossedPanelStyle} flex={1}>
      <Group justify="space-between" align="center" mb="xs">
        <Badge color={badgeColor} variant="light" size="sm" radius="xs">
          {title}
        </Badge>
        <Text size="xs" c="gray.5" fw={600}>
          {timeData.dayPeriod}
        </Text>
      </Group>

      {/* Embossed LED Digital Clock Display */}
      <Group gap={6} align="baseline" justify="center" my="xs">
        <Text
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "2.1rem",
            fontWeight: 800,
            letterSpacing: "3px",
            color: "#38d9a9",
            textShadow: "0 0 10px rgba(56, 217, 169, 0.4)",
          }}
        >
          {timeData.hours}:{timeData.minutes}:{timeData.seconds}
        </Text>
        <Badge
          color={timeData.dayPeriod === "AM" ? "yellow" : "orange"}
          variant="filled"
          size="sm"
          ml="xs"
        >
          {timeData.dayPeriod}
        </Badge>
      </Group>

      {/* Converted Session Schedule */}
      {sessionStartStr && (
        <>
          <Divider my="xs" color="gray.8" />
          <Stack gap={2} align="center">
            <Text size="10px" c="gray.4" tt="uppercase" fw={700}>
              Session Start Time
            </Text>
            <Text size="xs" fw={700} c="teal.3">
              {sessionStartStr}
            </Text>
          </Stack>
        </>
      )}
    </Paper>
  );

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      mb="md"
      bg="#0c0e12"
      style={{ borderColor: "#283244" }}
    >
      <Group gap="xs" mb="xs">
        <IconClock size={18} color="#38d9a9" />
        <Text
          size="xs"
          fw={700}
          c="gray.3"
          tt="uppercase"
          style={{ letterSpacing: "1px" }}
        >
          Timezone Sync & Session Schedule
        </Text>
      </Group>

      <Group grow align="stretch" gap="md">
        {renderClockCard(
          "Toronto Time (HQ)",
          torontoTime,
          torontoSessionStart,
          "blue",
        )}
        {renderClockCard(
          `Your End (${localTZ.split("/").pop()?.replace("_", " ")})`,
          localTime,
          localSessionStart,
          "teal",
        )}
      </Group>
    </Paper>
  );
}
