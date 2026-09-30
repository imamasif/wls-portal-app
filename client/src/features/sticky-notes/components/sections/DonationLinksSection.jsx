import React from "react";
import {
  Stack,
  Alert,
  SimpleGrid,
  Card,
  Group,
  Text,
  Divider,
  Anchor,
  Button,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBuildingBank,
  IconCurrencyDollar,
  IconExternalLink,
} from "@tabler/icons-react";

export function DonationLinksSection() {
  return (
    <Stack gap="md" mb="lg">
      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Registered Non-Profit Charity"
        color="blue"
        radius="md"
      >
        IIPC Canada is a registered not-for-profit charitable organization based
        in Canada (CRA Number: 806548632RR0001) involved in promoting Quranic
        lectures of Mohammad Shaikh and continuous charity work.
      </Alert>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
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
          <Group gap="xs" mb="xs">
            <IconBuildingBank size={20} color="#2563eb" />
            <Text fw={700} size="sm" c="blue.9">
              Bank Wire Transfer (TD Canada Trust)
            </Text>
          </Group>
          <Stack gap={4}>
            <Text size="xs">
              <b>Account Name:</b> International Islamic Propagation Centre
              Canada
            </Text>
            <Text size="xs">
              <b>Bank:</b> TD Canada Trust Bank
            </Text>
            <Text size="xs">
              <b>Acc No:</b> 5235155 | <b>Transit No:</b> 02219
            </Text>
            <Text size="xs">
              <b>Swift Code:</b> TDOMCATTTOR | <b>Inst No:</b> 004 |{" "}
              <b>Branch No:</b> 221
            </Text>
            <Text size="xs">
              <b>Canada IBAN:</b> 026009593
            </Text>
            <Text size="xs">
              <b>USA Donor ABA:</b> 026009593
            </Text>
            <Divider my={4} />
            <Text size="xs" c="dimmed">
              <b>Branch Address:</b> 5001 19th Street, Unit 500, Red Deer, AB
              T4R 3R1, CANADA
            </Text>
          </Stack>
        </Card>

        <Card
          withBorder
          padding="md"
          radius="lg"
          shadow="sm"
          style={{
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #059669",
          }}
        >
          <Group gap="xs" mb="xs">
            <IconCurrencyDollar size={20} color="#059669" />
            <Text fw={700} size="sm" c="teal.9">
              Online & PayPal Giving Fund
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb={12}>
            Donate online directly through secure online portals or via PayPal
            Giving Fund Canada.
          </Text>
          <Stack gap={8}>
            <Anchor
              href="https://iipccanada.com/donate/"
              target="_blank"
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="filled"
                color="teal"
                size="xs"
                fullWidth
                rightSection={<IconExternalLink size={14} />}
              >
                Official Online Donation Link
              </Button>
            </Anchor>
            <Anchor
              href="https://www.paypal.com/ca/fundraiser/charity/3971665"
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
                PayPal Giving Fund Canada
              </Button>
            </Anchor>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
