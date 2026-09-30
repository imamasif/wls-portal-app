import React from "react";
import { Text, SimpleGrid, Card, Anchor, Button, Title } from "@mantine/core";
import {
  IconExternalLink,
  IconBrandApple,
  IconBrandGooglePlay,
  IconBrandApplePodcast,
} from "@tabler/icons-react";

export function ImportantLinksSection() {
  return (
    <>
      <Text size="sm" c="dimmed" mb="lg">
        Assalam o Aalaikum Brothers & Sisters — Easy access links to online
        learning tools, catalogues, books, and apps.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="lg">
        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="blue.8" mb={6}>
            English E - Catalogue
          </Text>
          <Anchor
            href="https://muhammadshaikh.com/E-CatalogueENG.pdf"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="light"
              color="blue"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              Open PDF
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="sky.8" mb={6}>
            Urdu E - Catalogue
          </Text>
          <Anchor
            href="https://muhammadshaikh.com/E-CatalogueUrdu.pdf"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="light"
              color="sky"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              Open PDF
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="teal.8" mb={6}>
            Color Coded Quran
          </Text>
          <Anchor
            href="http://www.iipccanada.com/Color_Coded_Quran.pdf"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="light"
              color="teal"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              Download Quran
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="indigo.8" mb={6}>
            English Booklets
          </Text>
          <Anchor
            href="https://iipctvstream.com/iipctv/english-books/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="subtle"
              color="indigo"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              iipctvstream.com
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="indigo.8" mb={6}>
            Urdu Booklets
          </Text>
          <Anchor
            href="https://iipctvstream.com/iipctv/urdu-books/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="subtle"
              color="indigo"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              iipctvstream.com
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="indigo.8" mb={6}>
            Hindi Booklets
          </Text>
          <Anchor
            href="https://iipccanada.com/download-pdf-booklets/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="subtle"
              color="indigo"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              iipccanada.com
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="grape.8" mb={6}>
            IIPC Canada Brochure 2023
          </Text>
          <Anchor
            href="https://iipccanada.com/Brochure2023.pdf"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="outline"
              color="grape"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              Brochure2023.pdf
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="green.8" mb={6}>
            Registration & Course
          </Text>
          <Anchor
            href="https://www.iipccanada.com/registration-2/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="outline"
              color="green"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              Registration Portal
            </Button>
          </Anchor>
        </Card>

        <Card withBorder padding="sm" radius="md" shadow="xs">
          <Text fw={700} size="xs" c="orange.8" mb={6}>
            Consultation Portal
          </Text>
          <Anchor
            href="https://muhammadshaikh.com/consultation/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              variant="outline"
              color="orange"
              size="xs"
              fullWidth
              rightSection={<IconExternalLink size={14} />}
            >
              MS Consultation
            </Button>
          </Anchor>
        </Card>
      </SimpleGrid>

      <Title order={5} c="dark.8" mb="xs">
        Mobile & TV Apps
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        <Anchor
          href="https://apps.apple.com/in/app/iipc-tv/id6733225034"
          target="_blank"
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="filled"
            color="dark"
            size="xs"
            fullWidth
            leftSection={<IconBrandApple size={16} />}
          >
            iOS / Apple Vision App
          </Button>
        </Anchor>
        <Anchor
          href="https://play.google.com/store/apps/details?id=com.iipccanada.iipctvott"
          target="_blank"
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="filled"
            color="teal"
            size="xs"
            fullWidth
            leftSection={<IconBrandGooglePlay size={16} />}
          >
            Google TV / Android App
          </Button>
        </Anchor>
        <Anchor
          href="https://podcasts.apple.com/au/podcast/iipc-podcast-podcast-feed/id463286262"
          target="_blank"
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="filled"
            color="indigo"
            size="xs"
            fullWidth
            leftSection={<IconBrandApplePodcast size={16} />}
          >
            Apple Podcasts
          </Button>
        </Anchor>
      </SimpleGrid>
    </>
  );
}
