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
  IconUsersGroup,
  IconFileTypePdf,
} from '@tabler/icons-react';
import { LetterheadGeneratorCard } from './components/LetterheadGeneratorCard';
import { DocumentCustomizerCard } from './components/DocumentCustomizerCard';
import { UniversalMergerCard } from './components/UniversalMergerCard';
import { BoardMeetingMinutesCard } from './components/BoardMeetingMinutesCard';
import { PdfMakerCard } from './components/PdfMakerCard';

export function LetterheadStudio({ user, isSuperAdmin, isWlsAdmin }) {
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('sub');
      if (tabParam === 'board-minutes' || tabParam === 'board_minutes' || tabParam === 'meeting-minutes') {
        return 'board-minutes';
      }
      if (tabParam === 'iipc' || tabParam === 'bp' || tabParam === 'universal' || tabParam === 'customizer' || tabParam === 'pdf-maker' || tabParam === 'pdf_maker' || tabParam === 'pdfmaker') {
        return tabParam;
      }
    } catch {}
    return 'all';
  };

  const [activeStudioTab, setActiveStudioTab] = useState(getInitialTab);
  const userRole = (user?.role || 'SUPER_USER').toUpperCase();
  const hasSuperAccess =
    isSuperAdmin ||
    isWlsAdmin ||
    userRole === 'SUPER_USER' ||
    userRole === 'UNIVERSITY_SUPER_USER' ||
    userRole.includes('SUPER') ||
    userRole === 'WLS_ADMIN';

  // If user is not an administrator, show only Board Meeting Minutes view
  if (!hasSuperAccess) {
    return (
      <Container size="xl" py="lg">
        <Stack gap="lg">
          <Paper
            p="lg"
            radius="md"
            style={{
              background: 'linear-gradient(135deg, #042f2e 0%, #064e3b 50%, #0f766e 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
              <div>
                <Group gap="xs" mb={6}>
                  <ThemeIcon size="lg" radius="md" color="teal" variant="filled">
                    <IconUsersGroup size={22} />
                  </ThemeIcon>
                  <Title order={2} style={{ color: '#ffffff', fontWeight: 800 }}>
                    IIPC Canada — Board Meeting Minutes Sign-off Portal
                  </Title>
                </Group>
                <Text size="sm" style={{ color: '#ccfbf1', maxWidth: '820px' }}>
                  Welcome, <strong>{user?.name || user?.email}</strong>. Please review the official Board Meeting Minutes below and apply your digital signature in your assigned box.
                </Text>
              </div>

              <Badge color="teal" variant="filled" size="md">
                Signatory Sign-off Mode
              </Badge>
            </Group>
          </Paper>

          <BoardMeetingMinutesCard user={user} userRole={userRole} />
        </Stack>
      </Container>
    );
  }

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
                  Official Letterhead &amp; Document Studio
                </Title>
              </Group>
              <Text size="sm" style={{ color: '#cbd5e1', maxWidth: '820px' }}>
                Generate official institutional letterheads for <strong>IIPC Canada</strong> and{' '}
                <strong>Blessed Properties (BP)</strong>, manage <strong>Board Meeting Minutes</strong> multi-director sign-offs with auto-dispatch to info@ and accounts@, merge custom templates, or use the interactive canvas studio.
              </Text>
            </div>

            <Group gap="xs">
              <Badge color="red" variant="filled" size="md" leftSection={<IconShieldLock size={14} />}>
                Super User Only
              </Badge>
              <Badge color="teal" variant="light" size="md" leftSection={<IconSparkles size={14} />}>
                Word (.docx) &amp; PDF (.pdf)
              </Badge>
            </Group>
          </Group>
        </Paper>

        {/* Main Tabs Navigation (Exact University Mantine Tabs Style) */}
        <style>{`
          .letterhead-tabs-bar {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 6px;
            border-radius: 14px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03);
            margin-bottom: 20px;
          }
          .letterhead-tabs-bar .mantine-Tabs-tab {
            font-weight: 600;
            font-size: 13.5px;
            padding: 9px 18px;
            border-radius: 10px;
            color: #475569;
            border: 1px solid transparent;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .letterhead-tabs-bar .mantine-Tabs-tab:hover {
            background: #f1f5f9;
            color: #1e293b;
            transform: translateY(-1px);
          }
          .letterhead-tabs-bar .mantine-Tabs-tab[data-active] {
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%) !important;
            color: #ffffff !important;
            box-shadow: 0 6px 18px -2px rgba(79, 70, 229, 0.45);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
          }
          .letterhead-tabs-bar .mantine-Tabs-tab[data-active] svg {
            color: #ffffff !important;
          }
        `}</style>
        <Tabs value={activeStudioTab} onChange={setActiveStudioTab} variant="pills" radius="md">
          <Tabs.List className="letterhead-tabs-bar">
            <Tabs.Tab value="all" leftSection={<IconFileCertificate size={18} />}>
              All Studio Cards
            </Tabs.Tab>
            <Tabs.Tab value="board-minutes" leftSection={<IconUsersGroup size={18} />}>
              Board Meeting Minutes
            </Tabs.Tab>
            <Tabs.Tab value="iipc" leftSection={<IconBuildingBank size={18} />}>
              IIPC Canada Letterhead
            </Tabs.Tab>
            <Tabs.Tab value="bp" leftSection={<IconBuildingSkyscraper size={18} />}>
              Blessed Properties (BP)
            </Tabs.Tab>
            <Tabs.Tab value="universal" leftSection={<IconFileStack size={18} />}>
              2-File Template Merger
            </Tabs.Tab>
            <Tabs.Tab value="pdf-maker" leftSection={<IconFileTypePdf size={18} />}>
              PDF Maker
            </Tabs.Tab>
            <Tabs.Tab value="customizer" leftSection={<IconForms size={18} />}>
              Interactive Customizer &amp; Signatures
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* CARD 5: Board Meeting Minutes & Multi-Signatory Dispatch */}
        {(activeStudioTab === 'all' || activeStudioTab === 'board-minutes') && (
          <Box mb={activeStudioTab === 'all' ? 'md' : 0}>
            <BoardMeetingMinutesCard user={user} userRole={userRole} />
          </Box>
        )}

        {/* ROW: IIPC and BP Letterhead Generators */}
        {(activeStudioTab === 'all' || activeStudioTab === 'pdf-maker') && (
          <Box mb={activeStudioTab === 'all' ? 'md' : 0}>
            <PdfMakerCard userRole={userRole} />
          </Box>
        )}
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
                  subtitle="Real Estate &amp; Brokerage Operations • Official Letterhead"
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
