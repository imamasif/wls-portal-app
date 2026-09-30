import React from "react";
import {
  SimpleGrid,
  Card,
  Group,
  Text,
  Stack,
  Anchor,
  Button,
} from "@mantine/core";
import {
  IconVideo,
  IconQrcode,
  IconBook,
  IconGlobe,
  IconFlag,
  IconExternalLink,
  IconBrandYoutube,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
} from "@tabler/icons-react";

export function SocialMediaSection() {
  return (
    <>
      <Text size="sm" c="dimmed" mb="lg">
        Official video catalogs, reference booklets, and official social
        channels for Team IIPC Canada & Muhammad Shaikh.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="lg">
        {/* English Video List */}
        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #2563eb",
          }}
        >
          <Group gap={8} mb={6}>
            <IconVideo size={18} color="#2563eb" />
            <Text fw={700} size="sm" tt="uppercase" c="blue.9">
              1. English Video List
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb={12}>
            Lectures & Debates (Jew / Christian / Muslims / Various Schools of
            Thought)
          </Text>
          <Stack gap={8}>
            <Anchor
              href="https://iipccanada.com/E-CatalogueENG.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="light"
                color="blue"
                size="xs"
                fullWidth
                justify="space-between"
                rightSection={<IconExternalLink size={14} />}
              >
                iipccanada.com/E-CatalogueENG.pdf
              </Button>
            </Anchor>
            <Anchor
              href="https://muhammadshaikh.com/E-CatalogueENG.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="subtle"
                color="blue"
                size="xs"
                fullWidth
                justify="space-between"
                rightSection={<IconExternalLink size={14} />}
              >
                muhammadshaikh.com/E-CatalogueENG.pdf
              </Button>
            </Anchor>
          </Stack>
        </Card>

        {/* Urdu Video List */}
        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #0284c7",
          }}
        >
          <Group gap={8} mb={6}>
            <IconVideo size={18} color="#0284c7" />
            <Text fw={700} size="sm" tt="uppercase" c="sky.9">
              2. Urdu Video List
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb={12}>
            Lectures & Debates (Jew / Christian / Muslims / Various Schools of
            Thought)
          </Text>
          <Stack gap={8}>
            <Anchor
              href="https://iipccanada.com/E-CatalogueUrdu.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="light"
                color="sky"
                size="xs"
                fullWidth
                justify="space-between"
                rightSection={<IconExternalLink size={14} />}
              >
                iipccanada.com/E-CatalogueUrdu.pdf
              </Button>
            </Anchor>
            <Anchor
              href="https://muhammadshaikh.com/E-CatalogueUrdu.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="subtle"
                color="sky"
                size="xs"
                fullWidth
                justify="space-between"
                rightSection={<IconExternalLink size={14} />}
              >
                muhammadshaikh.com/E-CatalogueUrdu.pdf
              </Button>
            </Anchor>
          </Stack>
        </Card>

        {/* Color Coded Quran */}
        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #0d9488",
          }}
        >
          <Group gap={8} mb={6}>
            <IconQrcode size={18} color="#0d9488" />
            <Text fw={700} size="sm" tt="uppercase" c="teal.9">
              3. Color Coded Quran
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb={12}>
            Arabic of Quran in different colors to easily understand Quranic
            grammar (First of its kind).
          </Text>
          <Anchor
            href="http://www.iipccanada.com/Color_Coded_Quran.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="filled"
              color="teal"
              size="xs"
              fullWidth
              justify="space-between"
              rightSection={<IconExternalLink size={14} />}
            >
              Download Color Coded Quran (PDF)
            </Button>
          </Anchor>
        </Card>

        {/* Reference Booklets */}
        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #4f46e5",
          }}
        >
          <Group gap={8} mb={6}>
            <IconBook size={18} color="#4f46e5" />
            <Text fw={700} size="sm" tt="uppercase" c="indigo.9">
              4 & 5. Reference Booklets
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb={12}>
            English & Urdu Lectures Reference Booklets by Muhammad Shaikh.
          </Text>
          <Group grow gap="xs">
            <Anchor
              href="https://www.iipccanada.com/2018/05/09/pdf-booklets-english/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button variant="light" color="indigo" size="xs" fullWidth>
                English Booklets
              </Button>
            </Anchor>
            <Anchor
              href="https://www.iipccanada.com/2018/05/09/pdf-booklets-urdu/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button variant="light" color="indigo" size="xs" fullWidth>
                Urdu Booklets
              </Button>
            </Anchor>
          </Group>
        </Card>

        {/* Muhammad Shaikh Social */}
        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #7c3aed",
          }}
        >
          <Group gap={8} mb={6}>
            <IconGlobe size={18} color="#7c3aed" />
            <Text fw={700} size="sm" tt="uppercase" c="violet.9">
              10. Muhammad Shaikh Social
            </Text>
          </Group>
          <SimpleGrid cols={2} spacing="xs">
            <Anchor
              href="https://www.muhammadshaikh.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="violet"
                size="xs"
                fullWidth
                leftSection={<IconGlobe size={14} />}
              >
                Website
              </Button>
            </Anchor>
            <Anchor
              href="https://www.youtube.com/@MUHAMMADSHAIKH"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="red"
                size="xs"
                fullWidth
                leftSection={<IconBrandYoutube size={14} />}
              >
                YouTube
              </Button>
            </Anchor>
            <Anchor
              href="https://www.facebook.com/MohammadShaikhNizamuddin"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="blue"
                size="xs"
                fullWidth
                leftSection={<IconBrandFacebook size={14} />}
              >
                Facebook
              </Button>
            </Anchor>
            <Anchor
              href="https://twitter.com/mohammadshaikh_"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="dark"
                size="xs"
                fullWidth
                leftSection={<IconBrandTwitter size={14} />}
              >
                Twitter
              </Button>
            </Anchor>
          </SimpleGrid>
        </Card>

        {/* IIPC Canada Social */}
        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #e11d48",
          }}
        >
          <Group gap={8} mb={6}>
            <IconFlag size={18} color="#e11d48" />
            <Text fw={700} size="sm" tt="uppercase" c="rose.9">
              11. IIPC Canada Social
            </Text>
          </Group>
          <SimpleGrid cols={2} spacing="xs">
            <Anchor
              href="http://www.iipccanada.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="rose"
                size="xs"
                fullWidth
                leftSection={<IconGlobe size={14} />}
              >
                iipccanada.com
              </Button>
            </Anchor>
            <Anchor
              href="https://youtube.com/@IIPCCANADA"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="red"
                size="xs"
                fullWidth
                leftSection={<IconBrandYoutube size={14} />}
              >
                YouTube
              </Button>
            </Anchor>
            <Anchor
              href="https://www.facebook.com/iipccanada"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="blue"
                size="xs"
                fullWidth
                leftSection={<IconBrandFacebook size={14} />}
              >
                Facebook
              </Button>
            </Anchor>
            <Anchor
              href="https://instagram.com/iipccanada"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outline"
                color="pink"
                size="xs"
                fullWidth
                leftSection={<IconBrandInstagram size={14} />}
              >
                Instagram
              </Button>
            </Anchor>
          </SimpleGrid>
        </Card>
      </SimpleGrid>
    </>
  );
}
