import React, { useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Button,
  Badge,
  ActionIcon,
  Tooltip,
  Divider,
  Image,
  Box,
  CopyButton,
  Alert,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconShieldCheck,
  IconInfoCircle,
  IconMail,
  IconCreditCard,
  IconBrandPaypal,
  IconReceiptTax,
} from "@tabler/icons-react";

export function DonationPaymentCards({ channels = [] }) {
  // Static institutional payment methods
  const bankDetails = {
    bankName: "TD (Toronto Dominion) Canada Trust Bank",
    accountName: "International Islamic Propagation Centre Canada",
    accountNumber: "5235155",
    swiftCode: "TDOMCATTTOR",
    iban: "026009593",
    transitNumber: "02219",
    institutionNumber: "004",
    branchNumber: "221",
    abaRouting: "026009593",
    branchAddress: "5001 19th Street, Unit 500, Red Deer, AB T4R 3R1, CANADA",
    currencies: "CAD / USD",
  };

  return (
    <Stack gap="lg">
      {/* CRA Tax Exemption Notice Card */}
      <Paper
        p="md"
        radius="md"
        withBorder
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          borderColor: "#10b981",
        }}
      >
        <Group align="flex-start" wrap="nowrap">
          <IconReceiptTax
            size={32}
            color="#059669"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <Group gap="xs" mb={4}>
              <Text fw={700} size="sm" c="teal.9">
                CRA Registered Tax-Exempt Charity
              </Text>
              <Badge color="green" variant="filled" size="sm">
                CRA # 80654 8632 RR0001
              </Badge>
            </Group>
            <Text size="xs" c="gray.8" style={{ lineHeight: 1.5 }}>
              <b>International Islamic Propagation Center Canada</b> is a
              registered, tax-exempted charity under CRA (Canada Revenue
              Agency). Your contribution is tax deductible to the full extent
              permitted by law. Please consult with your tax adviser.
            </Text>
          </div>
        </Group>
      </Paper>

      {/* Grid of Institutional Donation Channels */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* CARD 1: TD Bank Transfer */}
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          bg="white"
          style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconBuildingBank size={24} color="#008a00" />
                <div>
                  <Text fw={700} size="sm" c="dark.9">
                    Direct Bank Transfer (TD Bank)
                  </Text>
                  <Text size="11px" c="dimmed">
                    Canada & International Wire
                  </Text>
                </div>
              </Group>
              <Badge color="green" variant="light" size="xs">
                CAD & USD
              </Badge>
            </Group>

            <Divider my="xs" />

            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Account Name:
                </Text>
                <Text size="xs" fw={600} ta="right">
                  {bankDetails.accountName}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Bank Name:
                </Text>
                <Text size="xs" fw={600}>
                  {bankDetails.bankName}
                </Text>
              </Group>

              {/* Account Number with Copy */}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Account No:
                </Text>
                <Group gap={4}>
                  <Text size="xs" fw={700} c="green.9">
                    {bankDetails.accountNumber}
                  </Text>
                  <CopyButton value={bankDetails.accountNumber}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied!" : "Copy Account #"}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={copied ? "teal" : "gray"}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Group>

              {/* Swift Code with Copy */}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Swift Code:
                </Text>
                <Group gap={4}>
                  <Text size="xs" fw={700}>
                    {bankDetails.swiftCode}
                  </Text>
                  <CopyButton value={bankDetails.swiftCode}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied!" : "Copy Swift"}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={copied ? "teal" : "gray"}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Group>

              {/* Canada IBAN with Copy */}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Canada IBAN:
                </Text>
                <Group gap={4}>
                  <Text size="xs" fw={600}>
                    {bankDetails.iban}
                  </Text>
                  <CopyButton value={bankDetails.iban}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied!" : "Copy IBAN"}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={copied ? "teal" : "gray"}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Group>

              {/* Transit, Inst & Branch */}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Transit / Inst / Branch:
                </Text>
                <Text size="xs" fw={600}>
                  Transit: {bankDetails.transitNumber} | Inst:{" "}
                  {bankDetails.institutionNumber} | Branch:{" "}
                  {bankDetails.branchNumber}
                </Text>
              </Group>

              {/* USA Donors ABA */}
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  USA Donors ABA:
                </Text>
                <Group gap={4}>
                  <Text size="xs" fw={700} c="blue.7">
                    {bankDetails.abaRouting}
                  </Text>
                  <CopyButton value={bankDetails.abaRouting}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied!" : "Copy ABA"}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={copied ? "teal" : "gray"}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Group>

              <Group justify="space-between" align="flex-start">
                <Text size="xs" c="dimmed">
                  Branch Address:
                </Text>
                <Text size="xs" c="gray.7" ta="right" style={{ maxWidth: 220 }}>
                  {bankDetails.branchAddress}
                </Text>
              </Group>
            </Stack>
          </div>

          <Paper p="xs" radius="xs" bg="yellow.0" mt="sm">
            <Text size="11px" c="yellow.9">
              📌 <b>Note:</b> Kindly use 'PayPal' & 'CanadaHelps' if donating via Credit Card. For all other transfers please use Bank transfer.
            </Text>
          </Paper>
        </Card>

        {/* CARD 2: Interac E-Transfer */}
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          bg="white"
          style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconMail size={24} color="#eab308" />
                <div>
                  <Text fw={700} size="sm" c="dark.9">
                    Interac E-Transfer
                  </Text>
                  <Text size="11px" c="dimmed">
                    Direct Canadian Auto-Deposit
                  </Text>
                </div>
              </Group>
              <Badge color="yellow" variant="light" size="xs">
                Instant / CAD
              </Badge>
            </Group>

            <Divider my="xs" />

            <Paper p="md" radius="md" bg="gray.0" withBorder mb="sm" ta="center">
              <Text size="xs" c="dimmed" mb={2}>
                Send E-Transfer to:
              </Text>
              <Group justify="center" gap="xs">
                <Text fw={700} size="md" c="teal.9">
                  accounts@iipccanada.com
                </Text>
                <CopyButton value="accounts@iipccanada.com">
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied!" : "Copy Email"}>
                      <ActionIcon
                        size="sm"
                        variant="filled"
                        color={copied ? "teal" : "yellow"}
                        onClick={copy}
                      >
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Paper>

            <Stack gap={6}>
              <Text size="xs" c="gray.7">
                • <b>Auto-Deposit:</b> Direct deposit is enabled. No security question required.
              </Text>
              <Text size="xs" c="gray.7">
                • <b>Message / Memo:</b> Please include your full name and the <b>Project Name</b> in the e-transfer memo so we can link your donation.
              </Text>
              <Text size="xs" c="gray.7">
                • <b>Tax Receipt:</b> Official tax receipt will be sent to the email provided during e-transfer.
              </Text>
            </Stack>
          </div>

          <CopyButton value="accounts@iipccanada.com">
            {({ copied, copy }) => (
              <Button
                color="yellow"
                variant="light"
                fullWidth
                mt="md"
                leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                onClick={copy}
              >
                {copied ? "Email Copied to Clipboard" : "Copy E-Transfer Email"}
              </Button>
            )}
          </CopyButton>
        </Card>

        {/* CARD 3: PayPal Giving Fund */}
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          bg="white"
          style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconBrandPaypal size={24} color="#003087" />
                <div>
                  <Text fw={700} size="sm" c="dark.9">
                    PayPal Giving Fund & Credit Card
                  </Text>
                  <Text size="11px" c="dimmed">
                    0% Transaction Fees
                  </Text>
                </div>
              </Group>
              <Badge color="blue" variant="light" size="xs">
                Credit / Debit
              </Badge>
            </Group>

            <Divider my="xs" />

            <Text size="xs" c="gray.7" mb="sm" style={{ lineHeight: 1.5 }}>
              Donate to <b>International Islamic Propagation Centre Canada</b> via PayPal Giving Fund.
              If you don't have a PayPal account, you can still donate directly with any Credit Card.
            </Text>

            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                • <b>CRA Number:</b> 806548632RR0001
              </Text>
              <Text size="xs" c="dimmed">
                • <b>Location:</b> Rockwood, ON, Canada
              </Text>
              <Text size="xs" c="dimmed">
                • 100% of donation delivered to charity with zero fees.
              </Text>
            </Stack>
          </div>

          <Button
            component="a"
            href="https://www.paypal.com/CA/fundraiser/charity/3971665"
            target="_blank"
            color="blue"
            fullWidth
            mt="md"
            leftSection={<IconBrandPaypal size={16} />}
            rightSection={<IconExternalLink size={14} />}
          >
            Donate via PayPal / Credit Card
          </Button>
        </Card>

        {/* CARD 4: CanadaHelps.org */}
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          bg="white"
          style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <IconCreditCard size={24} color="#c2410c" />
                <div>
                  <Text fw={700} size="sm" c="dark.9">
                    CanadaHelps.org
                  </Text>
                  <Text size="11px" c="dimmed">
                    Instant Tax Receipt
                  </Text>
                </div>
              </Group>
              <Badge color="orange" variant="light" size="xs">
                Instant CRA Receipt
              </Badge>
            </Group>

            <Divider my="xs" />

            <Text size="xs" c="gray.7" mb="sm" style={{ lineHeight: 1.5 }}>
              Donate securely through Canada's trusted charitable giving platform. Accepts Visa, MasterCard, Amex, PayPal, and Google Pay.
            </Text>

            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                • Instant downloadable CRA tax receipt emailed immediately.
              </Text>
              <Text size="xs" c="dimmed">
                • Direct disbursement to IIPC Canada charitable operations.
              </Text>
            </Stack>
          </div>

          <Button
            component="a"
            href="https://www.canadahelps.org/en/dn/29287"
            target="_blank"
            color="orange"
            fullWidth
            mt="md"
            leftSection={<IconCreditCard size={16} />}
            rightSection={<IconExternalLink size={14} />}
          >
            Donate via CanadaHelps.org
          </Button>
        </Card>
      </SimpleGrid>

      {/* Official Website Banner */}
      <Paper p="sm" radius="md" withBorder bg="gray.0">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="xs" fw={600}>
              Visit IIPC Official Donation Portal:
            </Text>
            <Text size="xs" c="dimmed">
              https://iipccanada.com/donate/
            </Text>
          </Group>
          <Button
            component="a"
            href="https://iipccanada.com/donate/"
            target="_blank"
            size="xs"
            variant="default"
            rightSection={<IconExternalLink size={12} />}
          >
            Open Website
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
