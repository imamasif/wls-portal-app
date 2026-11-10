import React, { useState, useRef } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  Grid,
  Card,
  Image,
  ActionIcon,
  Tooltip,
  Switch,
  TextInput,
  FileInput,
  Modal,
  Alert,
  Menu,
  Box,
  Divider,
  Progress,
  ThemeIcon,
} from '@mantine/core';
import {
  IconFileTypePdf,
  IconPlus,
  IconUpload,
  IconPhoto,
  IconFileText,
  IconFileWord,
  IconTrash,
  IconArrowLeft,
  IconArrowRight,
  IconArrowDown,
  IconPencil,
  IconRotate,
  IconDownload,
  IconSparkles,
  IconCheck,
  IconAlertCircle,
  IconLayersSubtract,
  IconFolderPlus,
  IconWand,
  IconAdjustmentsHorizontal,
} from '@tabler/icons-react';
import {
  extractPagesFromPdf,
  convertImageToPage,
  createBlankPage,
  convertTextToPages,
  convertDocxToPages,
  compilePdfDocument,
  triggerFileDownload,
} from '../utils/pdfMakerEngine';
import { PdfAnnotatorModal } from './PdfAnnotatorModal';

export function PdfMakerCard({ userRole }) {
  // Master Pages List
  const [pages, setPages] = useState([]);
  const [docTitle, setDocTitle] = useState('Compiled_Document');
  const [optimizeSize, setOptimizeSize] = useState(true);

  // Loading & Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Hidden File Inputs
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const docxInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Quick Word/Text Converter State
  const [quickFile, setQuickFile] = useState(null);
  const [quickConverting, setQuickConverting] = useState(false);

  // Annotator Modal State
  const [activeAnnotatingPage, setActiveAnnotatingPage] = useState(null);
  const [annotatorOpened, setAnnotatorOpened] = useState(false);

  // --- FILE INGESTION HANDLERS ---
  // 1. Upload & Extract multiple PDFs
  const handlePdfUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let addedPagesCount = 0;
      for (const file of files) {
        setProcessingMsg(`Extracting pages from ${file.name}...`);
        const extracted = await extractPagesFromPdf(file);
        setPages((prev) => [...prev, ...extracted]);
        addedPagesCount += extracted.length;
      }
      setSuccessMessage(`Successfully added ${addedPagesCount} page(s) from ${files.length} PDF file(s).`);
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setErrorMessage(`Failed to read PDF: ${err.message || 'Corrupted or password-protected PDF.'}`);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  // 2. Upload Snaps / Images & convert to PDF pages
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const newPages = [];
      for (const file of files) {
        setProcessingMsg(`Converting snap ${file.name} to Adobe PDF page...`);
        const imgPage = await convertImageToPage(file);
        newPages.push(imgPage);
      }
      setPages((prev) => [...prev, ...newPages]);
      setSuccessMessage(`Added ${newPages.length} snap / image page(s).`);
    } catch (err) {
      console.error('Image page conversion error:', err);
      setErrorMessage(`Failed to convert image to PDF page: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // 3. Convert Word (.docx) to PDF pages
  const handleDocxUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingMsg(`Converting Word doc ${file.name} to PDF pages...`);

    try {
      const docxPages = await convertDocxToPages(file);
      setPages((prev) => [...prev, ...docxPages]);
      setSuccessMessage(`Converted Word doc into ${docxPages.length} PDF page(s).`);
    } catch (err) {
      console.error('Word conversion error:', err);
      setErrorMessage(`Failed to convert Word file: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
      if (docxInputRef.current) docxInputRef.current.value = '';
    }
  };

  // 4. Convert Text (.txt) to PDF pages
  const handleTextUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingMsg(`Converting text file ${file.name}...`);

    try {
      const text = await file.text();
      const txtPages = await convertTextToPages(text, file.name);
      setPages((prev) => [...prev, ...txtPages]);
      setSuccessMessage(`Converted text file into ${txtPages.length} PDF page(s).`);
    } catch (err) {
      console.error('Text file conversion error:', err);
      setErrorMessage(`Failed to convert text file: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
      if (textInputRef.current) textInputRef.current.value = '';
    }
  };

  // 5. Add Blank Page
  const handleAddBlankPage = (insertIndex = null) => {
    const blank = createBlankPage('portrait');
    if (insertIndex === null || insertIndex === undefined) {
      setPages((prev) => [...prev, blank]);
      setSuccessMessage('Blank page added at the end.');
    } else {
      setPages((prev) => {
        const copy = [...prev];
        copy.splice(insertIndex + 1, 0, blank);
        return copy;
      });
      setSuccessMessage(`Blank page inserted at position ${insertIndex + 2}.`);
    }
  };

  // Quick 1-Click Word/Text to PDF Converter and Downloader
  const handleQuickConvertAndDownload = async () => {
    if (!quickFile) return;
    setQuickConverting(true);
    setErrorMessage(null);

    try {
      const isDocx = quickFile.name.toLowerCase().endsWith('.docx');
      let convertedPages = [];
      if (isDocx) {
        convertedPages = await convertDocxToPages(quickFile);
      } else {
        const text = await quickFile.text();
        convertedPages = await convertTextToPages(text, quickFile.name);
      }

      // Compile directly to PDF
      const result = await compilePdfDocument(convertedPages, {
        optimize: optimizeSize,
        documentTitle: quickFile.name.replace(/\.[^/.]+$/, ''),
      });

      const outName = `${quickFile.name.replace(/\.[^/.]+$/, '')}.pdf`;
      triggerFileDownload(result.downloadUrl, outName);
      setSuccessMessage(`Downloaded PDF for ${quickFile.name} successfully!`);
    } catch (err) {
      console.error('Quick conversion error:', err);
      setErrorMessage(`Failed to convert and download: ${err.message}`);
    } finally {
      setQuickConverting(false);
    }
  };

  // --- PAGE REORDERING & MANAGEMENT ---
  // Move page left (earlier)
  const movePageLeft = (index) => {
    if (index <= 0) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  // Move page right / Push down (later)
  const movePageRight = (index) => {
    if (index >= pages.length - 1) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  // Delete / Subtract page
  const deletePage = (index) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Rotate page 90 degrees
  const rotatePage = (index) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p))
    );
  };

  // Open Annotator for Page
  const openAnnotator = (pageItem) => {
    setActiveAnnotatingPage(pageItem);
    setAnnotatorOpened(true);
  };

  // Save updated page from Annotator
  const handleSaveAnnotatedPage = (updatedPage) => {
    setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
    setSuccessMessage(`Annotations applied to Page ${updatedPage.pageNumber}.`);
  };

  // Download Single Page as PDF
  const downloadSinglePage = async (pageItem) => {
    setIsProcessing(true);
    setProcessingMsg(`Generating single page PDF...`);
    try {
      const result = await compilePdfDocument([pageItem], {
        optimize: optimizeSize,
        documentTitle: `Page_${pageItem.pageNumber}`,
      });
      triggerFileDownload(result.downloadUrl, `Page_${pageItem.pageNumber}.pdf`);
    } catch (err) {
      setErrorMessage(`Failed to download page: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  // --- COMPILE & DOWNLOAD MASTER PDF ---
  const handleCompileMasterPdf = async () => {
    if (pages.length === 0) {
      setErrorMessage('Please add at least one page before compiling.');
      return;
    }

    setIsProcessing(true);
    setProcessingMsg(`Compiling ${pages.length} pages into official PDF...`);
    setErrorMessage(null);

    try {
      const result = await compilePdfDocument(pages, {
        optimize: optimizeSize,
        documentTitle: docTitle || 'Compiled_Document',
      });

      const finalFileName = `${(docTitle || 'Compiled_Document').replace(/\.pdf$/i, '')}.pdf`;
      triggerFileDownload(result.downloadUrl, finalFileName);

      const sizeKb = Math.round(result.sizeBytes / 1024);
      setSuccessMessage(
        `🎉 Successfully compiled and downloaded "${finalFileName}" (${pages.length} pages, ${sizeKb} KB)!`
      );
    } catch (err) {
      console.error('Master compilation error:', err);
      setErrorMessage(`Compilation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ background: '#ffffff' }}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={pdfInputRef}
        accept="application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={handlePdfUpload}
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <input
        type="file"
        ref={docxInputRef}
        accept=".docx"
        style={{ display: 'none' }}
        onChange={handleDocxUpload}
      />
      <input
        type="file"
        ref={textInputRef}
        accept=".txt,text/plain"
        style={{ display: 'none' }}
        onChange={handleTextUpload}
      />

      <Stack gap="md">
        {/* HEADER HERO BANNER */}
        <Paper
          p="md"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            color: '#ffffff',
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
            <div>
              <Group gap="xs" mb={4}>
                <ThemeIcon size="lg" radius="md" color="indigo" variant="filled">
                  <IconFileTypePdf size={22} />
                </ThemeIcon>
                <Title order={2} style={{ color: '#ffffff', fontWeight: 800 }}>
                  PDF Maker &amp; Studio
                </Title>
              </Group>
              <Text size="sm" style={{ color: '#c7d2fe', maxWidth: '820px' }}>
                Merge multiple PDFs into one, turn snaps and photos into Adobe pages, reorder/subtract/insert pages anywhere, optimize file size without losing image quality, convert Word (.docx) or Text (.txt) files to PDF, and annotate pages with signatures, calendar dates, checkboxes, arrows, tables, and freehand pen drawings.
              </Text>
            </div>

            <Group gap="xs">
              <Badge color="cyan" variant="filled" size="md">
                Multi-PDF Merger
              </Badge>
              <Badge color="teal" variant="light" size="md">
                Interactive Page Sorter
              </Badge>
              <Badge color="pink" variant="light" size="md">
                Markup &amp; Pen Studio
              </Badge>
            </Group>
          </Group>
        </Paper>

        {/* ALERTS */}
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Notice"
            color="red"
            variant="filled"
            withCloseButton
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert
            icon={<IconCheck size={16} />}
            title="Success"
            color="teal"
            variant="filled"
            withCloseButton
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {isProcessing && (
          <Paper p="sm" withBorder radius="md" style={{ background: '#f8fafc' }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" fw={700} c="indigo">
                {processingMsg || 'Processing document...'}
              </Text>
              <Badge size="xs" color="indigo" variant="light">
                Working...
              </Badge>
            </Group>
            <Progress value={100} animated color="indigo" size="sm" radius="xl" />
          </Paper>
        )}

        {/* PRIMARY ACTION BAR */}
        <Paper p="sm" withBorder radius="md" style={{ background: '#f8fafc' }}>
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group gap="xs" wrap="wrap">
              <Button
                color="indigo"
                size="sm"
                leftSection={<IconFileTypePdf size={17} />}
                onClick={() => pdfInputRef.current?.click()}
              >
                + Browse PDF(s) to Merge
              </Button>

              <Button
                color="teal"
                variant="light"
                size="sm"
                leftSection={<IconPhoto size={17} />}
                onClick={() => imageInputRef.current?.click()}
              >
                + Browse Snaps / Images
              </Button>

              <Menu shadow="md" width={220}>
                <Menu.Target>
                  <Button
                    color="blue"
                    variant="light"
                    size="sm"
                    leftSection={<IconFileWord size={17} />}
                  >
                    + Add Word / Text Doc
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconFileWord size={16} color="#2563eb" />}
                    onClick={() => docxInputRef.current?.click()}
                  >
                    Upload Word (.docx)
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileText size={16} color="#475569" />}
                    onClick={() => textInputRef.current?.click()}
                  >
                    Upload Text (.txt)
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              <Button
                color="gray"
                variant="subtle"
                size="sm"
                leftSection={<IconPlus size={16} />}
                onClick={() => handleAddBlankPage(null)}
              >
                + Add Blank Page
              </Button>
            </Group>

            <Group gap="sm" wrap="wrap">
              <Switch
                label="Optimize / Reduce File Size"
                checked={optimizeSize}
                onChange={(e) => setOptimizeSize(e.currentTarget.checked)}
                size="sm"
                color="indigo"
              />

              {pages.length > 0 && (
                <Button
                  color="red"
                  variant="subtle"
                  size="xs"
                  leftSection={<IconTrash size={15} />}
                  onClick={() => setPages([])}
                >
                  Clear All ({pages.length})
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        {/* QUICK WORD / TEXT CONVERTER ACCELERATOR */}
        <Paper
          p="sm"
          radius="md"
          withBorder
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #86efac',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <div>
              <Group gap="xs">
                <ThemeIcon size="md" radius="md" color="teal" variant="filled">
                  <IconWand size={18} />
                </ThemeIcon>
                <Text size="sm" fw={700} style={{ color: '#166534' }}>
                  Quick Word &amp; Text to PDF Converter &amp; Downloader
                </Text>
              </Group>
              <Text size="xs" style={{ color: '#15803d' }}>
                Drop any Word (.docx) or Text (.txt) file to convert and download as an Adobe PDF with a single click.
              </Text>
            </div>

            <Group gap="xs" wrap="wrap">
              <FileInput
                placeholder="Choose Word (.docx) or Text (.txt)"
                accept=".docx,.txt"
                size="xs"
                value={quickFile}
                onChange={setQuickFile}
                style={{ width: '250px' }}
                clearable
              />
              <Button
                color="teal"
                size="xs"
                disabled={!quickFile}
                loading={quickConverting}
                leftSection={<IconDownload size={15} />}
                onClick={handleQuickConvertAndDownload}
              >
                Convert &amp; Download PDF
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* DOCUMENT METADATA & COMPILATION SUMMARY */}
        <Paper p="sm" withBorder radius="md" style={{ background: '#ffffff' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="md">
              <TextInput
                label="Compiled File Name"
                placeholder="Compiled_Document"
                size="xs"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                rightSection={<Text size="xs" c="dimmed">.pdf</Text>}
                style={{ minWidth: '240px' }}
              />

              <div>
                <Text size="xs" c="dimmed" fw={600}>
                  Total Document Pages
                </Text>
                <Badge size="lg" color={pages.length > 0 ? 'indigo' : 'gray'} variant="filled">
                  {pages.length} Page{pages.length === 1 ? '' : 's'}
                </Badge>
              </div>
            </Group>

            <Button
              color="indigo"
              size="md"
              disabled={pages.length === 0}
              loading={isProcessing}
              leftSection={<IconDownload size={18} />}
              onClick={handleCompileMasterPdf}
              style={{
                boxShadow: pages.length > 0 ? '0 4px 16px rgba(79, 70, 229, 0.35)' : 'none',
              }}
            >
              Compile &amp; Download PDF ({pages.length})
            </Button>
          </Group>
        </Paper>

        {/* VISUAL PAGE ORGANIZER (REARRANGE, ADD, SUBTRACT, PUSH DOWN, ANNOTATE) */}
        <div>
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <Title order={4} style={{ color: '#0f172a', fontWeight: 700 }}>
                Visual Page Sorter &amp; Manager
              </Title>
              <Badge color="gray" variant="light" size="sm">
                {pages.length} in Sequence
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Use arrows to push down / reorder pages, rotate, subtract, or open the interactive annotator.
            </Text>
          </Group>

          {pages.length === 0 ? (
            <Paper
              p="xl"
              radius="md"
              withBorder
              style={{
                textAlign: 'center',
                background: '#f8fafc',
                borderStyle: 'dashed',
                borderWidth: '2px',
                borderColor: '#cbd5e1',
              }}
            >
              <ThemeIcon size={52} radius="xl" color="indigo" variant="light" mb="sm">
                <IconFolderPlus size={30} />
              </ThemeIcon>
              <Title order={4} style={{ color: '#334155' }}>
                No Pages Loaded Yet
              </Title>
              <Text size="sm" c="dimmed" style={{ maxWidth: '480px', margin: '6px auto 16px auto' }}>
                Click <strong>+ Browse PDF(s) to Merge</strong>, add <strong>Snaps / Images</strong>, or upload a <strong>Word / Text document</strong> to begin assembling your PDF.
              </Text>
              <Group justify="center" gap="sm">
                <Button
                  color="indigo"
                  size="sm"
                  leftSection={<IconFileTypePdf size={16} />}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  Browse PDF Files
                </Button>
                <Button
                  color="teal"
                  variant="light"
                  size="sm"
                  leftSection={<IconPhoto size={16} />}
                  onClick={() => imageInputRef.current?.click()}
                >
                  Browse Snaps / Images
                </Button>
              </Group>
            </Paper>
          ) : (
            <Grid gutter="md">
              {pages.map((p, idx) => {
                const hasAnnotations = (p.annotations && p.annotations.length > 0) || p.penDrawingDataUrl;
                return (
                  <Grid.Col key={p.id} span={{ base: 12, xs: 6, sm: 4, md: 3, lg: 2.4 }}>
                    <Card
                      shadow="xs"
                      padding="xs"
                      radius="md"
                      withBorder
                      style={{
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        border: hasAnnotations ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                      }}
                    >
                      {/* Top Header Row */}
                      <Group justify="space-between" mb={4}>
                        <Badge size="sm" color="indigo" variant="filled">
                          Page {idx + 1}
                        </Badge>
                        <Group gap={4}>
                          {hasAnnotations && (
                            <Tooltip label="Annotated" position="top">
                              <Badge size="xs" color="violet" variant="light">
                                ✍️ Edit
                              </Badge>
                            </Tooltip>
                          )}
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() => deletePage(idx)}
                            title="Subtract / Remove this page"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>

                      {/* Thumbnail Container */}
                      <div
                        style={{
                          height: '180px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          transform: `rotate(${p.rotation || 0}deg)`,
                          transition: 'transform 0.2s ease',
                        }}
                        onClick={() => openAnnotator(p)}
                        title="Click to annotate this page"
                      >
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={`Page ${idx + 1}`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                            }}
                          />
                        ) : (
                          <Text size="xs" c="dimmed">
                            (Page {idx + 1})
                          </Text>
                        )}
                      </div>

                      {/* Origin Info */}
                      <Text
                        size="xs"
                        c="dimmed"
                        truncate
                        title={p.fileName}
                        style={{ fontSize: '11px', marginBottom: '6px' }}
                      >
                        {p.sourceType === 'image'
                          ? `Snap: ${p.fileName}`
                          : p.sourceType === 'blank'
                          ? 'Blank Page'
                          : p.fileName}
                      </Text>

                      {/* Page Actions Toolbar */}
                      <Group justify="space-between" gap={4}>
                        <Group gap={2}>
                          {/* Move Left / Earlier */}
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="gray"
                            disabled={idx === 0}
                            onClick={() => movePageLeft(idx)}
                            title="Move earlier (Left)"
                          >
                            <IconArrowLeft size={14} />
                          </ActionIcon>

                          {/* Move Right / Push Down */}
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="gray"
                            disabled={idx === pages.length - 1}
                            onClick={() => movePageRight(idx)}
                            title="Push down / Move later (Right)"
                          >
                            <IconArrowRight size={14} />
                          </ActionIcon>

                          {/* Rotate 90 deg */}
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={() => rotatePage(idx)}
                            title="Rotate 90° clockwise"
                          >
                            <IconRotate size={14} />
                          </ActionIcon>
                        </Group>

                        <Group gap={2}>
                          {/* Annotate Button */}
                          <ActionIcon
                            size="sm"
                            variant="filled"
                            color="violet"
                            onClick={() => openAnnotator(p)}
                            title="Annotate & Draw on Page"
                          >
                            <IconPencil size={14} />
                          </ActionIcon>

                          {/* Insert in Middle Menu */}
                          <Menu shadow="sm" width={170}>
                            <Menu.Target>
                              <ActionIcon
                                size="sm"
                                variant="light"
                                color="indigo"
                                title="Insert page right after this page"
                              >
                                <IconPlus size={14} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Label>Insert After Page {idx + 1}</Menu.Label>
                              <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => handleAddBlankPage(idx)}
                              >
                                Blank Page
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconPhoto size={14} />}
                                onClick={() => imageInputRef.current?.click()}
                              >
                                Image / Snap Page
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>

                          {/* Download Page */}
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="teal"
                            onClick={() => downloadSinglePage(p)}
                            title="Download single page as PDF"
                          >
                            <IconDownload size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          )}
        </div>
      </Stack>

      {/* ANNOTATOR STUDIO MODAL */}
      <PdfAnnotatorModal
        opened={annotatorOpened}
        onClose={() => setAnnotatorOpened(false)}
        page={activeAnnotatingPage}
        onSavePage={handleSaveAnnotatedPage}
      />
    </Card>
  );
}

export default PdfMakerCard;
