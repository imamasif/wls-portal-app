import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Grid,
  Paper,
  Tabs,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconFileCertificate,
  IconBuildingBank,
  IconBuildingSkyscraper,
  IconForms,
  IconShieldLock,
  IconSparkles,
  IconFileStack,
} from '@tabler/icons-react';
import { LetterheadGeneratorCard } from './components/LetterheadGeneratorCard';
import { DocumentCustomizerCard } from './components/DocumentCustomizerCard';
import { UniversalMergerCard } from './components/UniversalMergerCard';

export function LetterheadStudio({ user }) {
  const [activeStudioTab, setActiveStudioTab] = useState('all');
  const userRole = (user?.role || 'SUPER_USER').toUpperCase();

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        {/* Top Hero Banner */}
        <Paper
          p="lg"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <div>
              <Group gap="xs" mb={6}>
                <ThemeIcon size="lg" radius="md" color="teal" variant="filled">
                  <IconFileCertificate size={22} />
                </ThemeIcon>
                <Title order={2} style={{ color: '#ffffff', fontWeight: 800 }}>
                  Official Letterhead & Document Studio
                </Title>
              </Group>
              <Text size="sm" style={{ color: '#cbd5e1', maxWidth: '820px' }}>
                Generate official institutional letterheads for <strong>IIPC Canada</strong> and{' '}
                <strong>Blessed Properties (BP)</strong>, merge any custom template header/footer with content files, or use the interactive canvas studio to place live signatures, dates, checkboxes, and form fields.
              </Text>
            </div>

            <Group gap="xs">
              <Badge color="red" variant="filled" size="md" leftSection={<IconShieldLock size={14} />}>
                Super User Only
              </Badge>
              <Badge color="teal" variant="light" size="md" leftSection={<IconSparkles size={14} />}>
                Word (.docx) & PDF (.pdf)
              </Badge>
            </Group>
          </Group>
        </Paper>

        {/* View Mode Navigation Tabs */}
        <Tabs value={activeStudioTab} onChange={setActiveStudioTab} variant="pills" color="teal">
          <Tabs.List>
            <Tabs.Tab value="all" leftSection={<IconFileCertificate size={16} />}>
              All Studio Cards
            </Tabs.Tab>
            <Tabs.Tab value="iipc" leftSection={<IconBuildingBank size={16} />}>
              IIPC Canada Letterhead
            </Tabs.Tab>
            <Tabs.Tab value="bp" leftSection={<IconBuildingSkyscraper size={16} />}>
              Blessed Properties (BP)
            </Tabs.Tab>
            <Tabs.Tab value="universal" leftSection={<IconFileStack size={16} />}>
              2-File Template Merger
            </Tabs.Tab>
            <Tabs.Tab value="customizer" leftSection={<IconForms size={16} />}>
              Interactive Customizer & Signatures
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* TOP ROW: IIPC and BP Letterhead Generators */}
        {(activeStudioTab === 'all' || activeStudioTab === 'iipc' || activeStudioTab === 'bp') && (
          <Grid gutter="lg">
            {/* CARD 1: IIPC Canada Letterhead */}
            {(activeStudioTab === 'all' || activeStudioTab === 'iipc') && (
              <Grid.Col span={{ base: 12, md: activeStudioTab === 'all' ? 6 : 12 }}>
                <LetterheadGeneratorCard
                  templateKey="iipc"
                  title="IIPC Canada Letterhead Generator"
                  badgeLabel="IIPC Canada"
                  badgeColor="teal"
                  subtitle="Not-for-profit Charitable Organization • Official Letterhead"
                  headerImg="/letterheads/iipc_header.jpg"
                  footerImg="/letterheads/iipc_footer.jpg"
                  bismillahImg="/letterheads/iipc_bismillah.jpg"
                  defaultBismillah={true}
                  defaultWatermark={false}
                  userRole={userRole}
                />
              </Grid.Col>
            )}

            {/* CARD 2: BP (Blessed Properties) Letterhead */}
            {(activeStudioTab === 'all' || activeStudioTab === 'bp') && (
              <Grid.Col span={{ base: 12, md: activeStudioTab === 'all' ? 6 : 12 }}>
                <LetterheadGeneratorCard
                  templateKey="bp"
                  title="Blessed Properties (BP) Letterhead Generator"
                  badgeLabel="Blessed Properties"
                  badgeColor="red"
                  subtitle="Real Estate & Brokerage Operations • Official Letterhead"
                  headerImg="/letterheads/bp_header.jpeg"
                  footerImg="/letterheads/bp_footer.png"
                  watermarkImg="/letterheads/bp_watermark.png"
                  defaultBismillah={false}
                  defaultWatermark={true}
                  userRole={userRole}
                />
              </Grid.Col>
            )}
          </Grid>
        )}

        {/* CARD 4: Universal 2-File Template & Content Merger */}
        {(activeStudioTab === 'all' || activeStudioTab === 'universal') && (
          <Box mt={activeStudioTab === 'all' ? 'xs' : 0}>
            <UniversalMergerCard userRole={userRole} />
          </Box>
        )}

        {/* CARD 3: Advanced Document Customizer & E-Signature Studio */}
        {(activeStudioTab === 'all' || activeStudioTab === 'customizer') && (
          <Box mt={activeStudioTab === 'all' ? 'md' : 0}>
            <DocumentCustomizerCard userRole={userRole} />
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default LetterheadStudio;
