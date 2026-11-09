import React, { useState } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  FileInput,
  Button,
  Paper,
  Alert,
  Modal,
  LoadingOverlay,
  ThemeIcon,
  Box,
  SimpleGrid,
} from '@mantine/core';
import {
  IconFileStack,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconDownload,
  IconEye,
  IconCheck,
  IconAlertCircle,
  IconUpload,
  IconSparkles,
  IconTemplate,
  IconFileText,
  IconArrowRight,
} from '@tabler/icons-react';
import { letterheadApi } from '../api/letterheadApi';

export function UniversalMergerCard({ userRole = 'SUPER_USER' }) {
  const [templateFile, setTemplateFile] = useState(null);
  const [contentFile, setContentFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleMerge = async () => {
    if (!templateFile) {
      setError('Please provide File 1: The Template Document (.docx) containing header/footer.');
      return;
    }
    if (!contentFile) {
      setError('Please provide File 2: The Content Document (.docx or .txt) containing your body text.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const data = await letterheadApi.mergeTwoFiles({
        templateFile,
        contentFile,
        userRole,
      });

      setResult(data);
    } catch (err) {
      console.error('Universal merge error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to merge documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type) => {
    if (!result) return;
    const downloadName = type === 'docx' ? result.docxName : result.pdfName;
    const link = letterheadApi.getDownloadUrl(result.docId, type, downloadName);

    const a = document.createElement('a');
    a.href = link;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        backgroundColor: '#ffffff',
      }}
    >
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'md', blur: 2 }} />

      <Stack gap="md">
        {/* Card Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <ThemeIcon color="indigo" size="lg" radius="md" variant="light">
              <IconFileStack size={22} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md" c="dark.8">
                Universal 2-File Template & Content Merger
              </Text>
              <Text size="xs" c="dimmed">
                Provide any custom template with header/footer and any content file. Merge them seamlessly into Word and PDF.
              </Text>
            </div>
          </Group>
          <Badge color="indigo" variant="light" size="sm">
            Any Template + Content
          </Badge>
        </Group>

        {/* Visual Workflow Diagram */}
        <Paper p="xs" withBorder radius="md" style={{ background: '#f8fafc', textAlign: 'center' }}>
          <Group justify="center" gap="xs" wrap="nowrap">
            <Paper p="xs" withBorder radius="sm" style={{ background: '#ffffff', minWidth: '130px' }}>
              <ThemeIcon size="sm" color="indigo" variant="light" mb={4}>
                <IconTemplate size={14} />
              </ThemeIcon>
              <Text size="11px" fw={600} c="dark.7">
                1. Template File
              </Text>
              <Text size="10px" c="dimmed">
                Headers, Footers & Margins
              </Text>
            </Paper>

            <Text size="sm" fw={700} c="indigo.6">
              +
            </Text>

            <Paper p="xs" withBorder radius="sm" style={{ background: '#ffffff', minWidth: '130px' }}>
              <ThemeIcon size="sm" color="blue" variant="light" mb={4}>
                <IconFileText size={14} />
              </ThemeIcon>
              <Text size="11px" fw={600} c="dark.7">
                2. Content File
              </Text>
              <Text size="10px" c="dimmed">
                Body Text & Paragraphs
              </Text>
            </Paper>

            <IconArrowRight size={16} color="var(--mantine-color-indigo-6)" />

            <Paper p="xs" withBorder radius="sm" style={{ background: '#e0e7ff', borderColor: '#c7d2fe', minWidth: '130px' }}>
              <ThemeIcon size="sm" color="indigo" variant="filled" mb={4}>
                <IconSparkles size={14} />
              </ThemeIcon>
              <Text size="11px" fw={700} c="indigo.9">
                Merged Result
              </Text>
              <Text size="10px" c="indigo.7">
                Word (.docx) & PDF (.pdf)
              </Text>
            </Paper>
          </Group>
        </Paper>

        {/* 2 File Inputs Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <FileInput
            label="File 1: Template Document (.docx)"
            description="Header, footer, layout & styling source"
            placeholder="Select template file..."
            accept=".docx,.doc"
            value={templateFile}
            onChange={setTemplateFile}
            leftSection={<IconTemplate size={16} />}
            clearable
            required
          />

          <FileInput
            label="File 2: Content Document (.docx or .txt)"
            description="Body text, letters, reports or memo to insert"
            placeholder="Select content file..."
            accept=".docx,.doc,.txt"
            value={contentFile}
            onChange={setContentFile}
            leftSection={<IconFileText size={16} />}
            clearable
            required
          />
        </SimpleGrid>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error" radius="sm">
            {error}
          </Alert>
        )}

        {/* Action Button */}
        <Button
          fullWidth
          color="indigo"
          leftSection={<IconSparkles size={18} />}
          onClick={handleMerge}
          disabled={!templateFile || !contentFile || loading}
        >
          {loading ? 'Fusing Documents & Converting...' : 'Merge Template & Content (Word & PDF)'}
        </Button>

        {/* Results Box */}
        {result && (
          <Paper p="sm" withBorder radius="md" style={{ background: '#eef2ff', borderColor: '#c7d2fe' }}>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <ThemeIcon color="indigo" size="sm" radius="xl">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text fw={600} size="xs" c="indigo.9">
                  Documents Successfully Merged!
                </Text>
              </Group>
              <Button
                size="compact-xs"
                variant="light"
                color="indigo"
                leftSection={<IconEye size={12} />}
                onClick={() => setPreviewOpen(true)}
              >
                Quick Preview
              </Button>
            </Group>

            <Group gap="xs" grow>
              <Button
                size="xs"
                variant="filled"
                color="blue"
                leftSection={<IconFileTypeDocx size={16} />}
                onClick={() => handleDownload('docx')}
              >
                Download Word (.docx)
              </Button>
              <Button
                size="xs"
                variant="filled"
                color="red"
                leftSection={<IconFileTypePdf size={16} />}
                onClick={() => handleDownload('pdf')}
              >
                Download PDF (.pdf)
              </Button>
            </Group>
          </Paper>
        )}
      </Stack>

      {/* PDF Preview Modal */}
      <Modal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          <Group gap="xs">
            <IconEye size={18} color="var(--mantine-color-indigo-6)" />
            <Text fw={600} size="sm">Document Preview: {result?.pdfName}</Text>
          </Group>
        }
        size="xl"
        radius="md"
      >
        {result && (
          <Box style={{ height: '70vh', width: '100%' }}>
            <iframe
              src={result.previewUrl}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '6px' }}
              title="Merged PDF Preview"
            />
          </Box>
        )}
      </Modal>
    </Card>
  );
}
