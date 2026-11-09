import React, { useState } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  FileInput,
  Button,
  Switch,
  TextInput,
  Paper,
  Alert,
  Modal,
  LoadingOverlay,
  ThemeIcon,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconFileDescription,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconDownload,
  IconEye,
  IconCheck,
  IconAlertCircle,
  IconUpload,
  IconSparkles,
} from '@tabler/icons-react';
import { letterheadApi } from '../api/letterheadApi';

export function LetterheadGeneratorCard({
  templateKey = 'iipc',
  title,
  badgeLabel,
  badgeColor = 'teal',
  subtitle,
  headerImg,
  footerImg,
  watermarkImg,
  bismillahImg,
  defaultBismillah = true,
  defaultWatermark = true,
  userRole = 'SUPER_USER',
}) {
  const [file, setFile] = useState(null);
  const [includeBismillah, setIncludeBismillah] = useState(defaultBismillah);
  const [includeWatermark, setIncludeWatermark] = useState(defaultWatermark);
  const [customDate, setCustomDate] = useState(
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleGenerate = async () => {
    if (!file) {
      setError('Please select a Word document (.docx) first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const data = await letterheadApi.generateLetterhead({
        file,
        template: templateKey,
        includeBismillah,
        includeWatermark,
        customDate,
        userRole,
      });

      setResult(data);
    } catch (err) {
      console.error('Letterhead generation failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to attach letterhead.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type) => {
    if (!result) return;
    const url = type === 'docx' ? result.docxUrl : result.pdfUrl;
    const name = type === 'docx' ? result.docxName : result.pdfName;
    const downloadLink = letterheadApi.getDownloadUrl(result.docId, type, name);

    const a = document.createElement('a');
    a.href = downloadLink;
    a.download = name;
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
            <ThemeIcon color={badgeColor} size="lg" radius="md" variant="light">
              <IconFileDescription size={22} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md" c="dark.8">
                {title}
              </Text>
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            </div>
          </Group>
          <Badge color={badgeColor} variant="light" size="sm">
            {badgeLabel}
          </Badge>
        </Group>

        {/* Visual Letterhead Template Mini-Preview */}
        <Paper
          p="xs"
          withBorder
          radius="sm"
          style={{
            background: '#f8fafc',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Box style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <img
              src={headerImg}
              alt="Letterhead Header"
              style={{ width: '100%', display: 'block', maxHeight: '42px', objectFit: 'cover' }}
            />
          </Box>

          <Box
            p="xs"
            style={{
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '4px',
              border: '1px dashed #cbd5e1',
            }}
          >
            {bismillahImg && includeBismillah && (
              <img
                src={bismillahImg}
                alt="Bismillah"
                style={{ maxHeight: '24px', display: 'inline-block', marginBottom: '4px' }}
              />
            )}
            <Text size="11px" c="dimmed" fs="italic">
              Document content, paragraphs, tables, and signatures render here
            </Text>
          </Box>

          <Box style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <img
              src={footerImg}
              alt="Letterhead Footer"
              style={{ width: '100%', display: 'block', maxHeight: '34px', objectFit: 'cover' }}
            />
          </Box>
        </Paper>

        {/* File Input */}
        <FileInput
          label="Upload Word Document (.docx)"
          description="Select any letter, agreement, memo, or invoice"
          placeholder="Click to browse or drop file..."
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          value={file}
          onChange={setFile}
          leftSection={<IconUpload size={16} />}
          clearable
          required
        />

        {/* Configuration Options */}
        <Stack gap="xs">
          {templateKey === 'iipc' && (
            <Switch
              label="Include Bismillah Calligraphy (بسم الله الرحمن الرحيم)"
              checked={includeBismillah}
              onChange={(e) => setIncludeBismillah(e.currentTarget.checked)}
              color="teal"
              size="xs"
            />
          )}

          {templateKey === 'bp' && (
            <Switch
              label="Include Central Watermark (Blessed Properties)"
              checked={includeWatermark}
              onChange={(e) => setIncludeWatermark(e.currentTarget.checked)}
              color="red"
              size="xs"
            />
          )}

          <TextInput
            label="Document Date"
            size="xs"
            value={customDate}
            onChange={(e) => setCustomDate(e.currentTarget.value)}
            placeholder="e.g. November 9, 2026"
          />
        </Stack>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error" radius="sm">
            {error}
          </Alert>
        )}

        {/* Action Button */}
        <Button
          fullWidth
          color={badgeColor}
          leftSection={<IconSparkles size={18} />}
          onClick={handleGenerate}
          disabled={!file || loading}
        >
          {loading ? 'Processing Document...' : `Generate ${badgeLabel} Letterhead`}
        </Button>

        {/* Results Box */}
        {result && (
          <Paper p="sm" withBorder radius="md" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <ThemeIcon color="green" size="sm" radius="xl">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text fw={600} size="xs" c="green.9">
                  Letterhead Attached Successfully!
                </Text>
              </Group>
              <Button
                size="compact-xs"
                variant="light"
                color="green"
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
            <IconEye size={18} color="var(--mantine-color-blue-6)" />
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
              title="PDF Preview"
            />
          </Box>
        )}
      </Modal>
    </Card>
  );
}
