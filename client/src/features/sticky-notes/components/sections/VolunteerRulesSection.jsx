// src/features/sticky-notes/components/sections/VolunteerRulesSection.jsx

import React from "react";
import {
  Stack,
  SimpleGrid,
  Card,
  Group,
  Text,
  Badge,
  Button,
  Anchor,
  Paper,
} from "@mantine/core";
import {
  IconForms,
  IconBrandYoutube,
  IconExternalLink,
  IconChecklist,
} from "@tabler/icons-react";

export function VolunteerRulesSection({ searchQuery = "" }) {
  const query = searchQuery.toLowerCase().trim();

  const wlsRules = [
    "a. Apne time zone mein milte julte events organize karein.",
    "b. Record ki hui session IIPC Canada Management ko email karein.",
    "c1. Speaker ko apni baat ke topics ka ek mukhtasar khulasa se shuruat karni chahiye.",
    "c2. Surah ka number aur woh Ayat jo aap parhenge wazeh taur par batayen.",
    "c3. Puri Arabic Ayat tilawat karein aur uske baad mukammal tarjuma dein.",
    "c4. Us Ayat ka woh khaas hissa padhein jo topic se mutaliq ho taake nuqta-e-nazar par zor diya ja sake.",
    "c5. Wazeh karein ke aapne apni zindagi mein kaunsa rawayya ya soch tabdeel kiya.",
    "c6. Agar tabdeeli abhi amal mein nahin ayi to apna action plan aur shuru karne ki tareekh bayan karein.",
    "c7. Khulaasa aur rawani barqarar rakhein; lecture ke topic ko puri takreer mein jorra rakhein.",
    "c8. Aakhri speaker ko tamam lecture ka khulasa karke khatam karna chahiye.",
    "c9. WLS Admins ko Ayats ki zaati tashrih dene se parheiz karna chahiye.",
    "c10. Agar jawab maloom na ho to sawal video submission mein shamil karein.",
    "c11. Admins ke rawaiye ki sakhti aur professional tor par monitoring ki jayegi.",
    "c12-13. Kisi Admin ko funds jama karne ki ijazat nahin. Saari donations authorized online channels se bhejain.",
  ];

  const filteredRules = wlsRules.filter((rule) =>
    rule.toLowerCase().includes(query),
  );

  return (
    <Stack gap="md" mb="lg">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            borderLeft: "5px solid #2563eb",
            backgroundColor: "#ffffff",
          }}
        >
          <Group justify="space-between" mb={6}>
            <Text fw={700} size="sm" c="blue.9">
              1. Register as a Volunteer
            </Text>
            <Badge color="blue" variant="light" size="xs">
              Step 1
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mb={12}>
            Fill out the official volunteer registration form and watch the
            booklet guidance video.
          </Text>
          <Stack gap={6}>
            <Anchor
              href="https://forms.gle/CcYLx8WC5yVdoXQ28"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="light"
                color="blue"
                size="xs"
                fullWidth
                leftSection={<IconForms size={14} />}
              >
                Registration Form
              </Button>
            </Anchor>
            <Anchor
              href="https://youtu.be/qBWev01Vi14?si=hcLLL5BcvNmIXJeJ"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="subtle"
                color="red"
                size="xs"
                fullWidth
                leftSection={<IconBrandYoutube size={14} />}
              >
                Watch Download Tutorial (4/7)
              </Button>
            </Anchor>
          </Stack>
        </Card>

        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            borderLeft: "5px solid #0284c7",
            backgroundColor: "#ffffff",
          }}
        >
          <Group justify="space-between" mb={6}>
            <Text fw={700} size="sm" c="sky.9">
              2. Introductory Video
            </Text>
            <Badge color="sky" variant="light" size="xs">
              Step 2
            </Badge>
          </Group>
          <Text size="xs" c="dark.7" style={{ lineHeight: 1.5 }}>
            Aapke video mein aapka mazhabi, taleemi aur professional background
            shamil hona chahiye, aur yeh ke aapko Br. Muhammad Shaikh se kaise
            milaaya gaya.
          </Text>
        </Card>
      </SimpleGrid>

      <Card
        withBorder
        padding="md"
        radius="lg"
        shadow="sm"
        style={{ borderLeft: "5px solid #0d9488", backgroundColor: "#ffffff" }}
      >
        <Group justify="space-between" mb={6}>
          <Text fw={700} size="sm" c="teal.9">
            3. Website & Online Course Registration Requirement
          </Text>
          <Badge color="teal" variant="light" size="xs">
            Step 3
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" mb={8}>
          Aapko IIPC Canada website par register hona zaroori hai aur online
          course par enroll hona chahiye:
        </Text>
        <Anchor
          href="https://iipccanada.com/onlinecourse"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="light"
            color="teal"
            size="xs"
            rightSection={<IconExternalLink size={14} />}
          >
            https://iipccanada.com/onlinecourse
          </Button>
        </Anchor>
      </Card>

      <Card
        withBorder
        padding="md"
        radius="lg"
        shadow="sm"
        style={{ borderLeft: "5px solid #4f46e5", backgroundColor: "#ffffff" }}
      >
        <Group gap="xs" mb="xs">
          <IconChecklist color="#4f46e5" size={20} />
          <Text fw={700} size="sm" c="indigo.9">
            4. Participation in Weekly Learning Session (WLS) - Mandatory Rules
          </Text>
        </Group>

        {filteredRules.length === 0 ? (
          <Text size="xs" c="dimmed" fs="italic">
            No WLS rules found matching "{searchQuery}"
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {filteredRules.map((rule, i) => (
              <Paper
                key={i}
                p="xs"
                radius="md"
                withBorder
                style={{
                  backgroundColor:
                    query && rule.toLowerCase().includes(query)
                      ? "#fef08a"
                      : "#f8fafc",
                }}
              >
                <Text size="xs" c="dark.8">
                  {rule}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Card>
    </Stack>
  );
}
