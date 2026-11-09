import React, { useState, useRef } from 'react';
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  FileInput,
  Button,
  Select,
  ColorInput,
  NumberInput,
  TextInput,
  Paper,
  Alert,
  Modal,
  LoadingOverlay,
  ThemeIcon,
  Box,
  Divider,
  SegmentedControl,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconWriting,
  IconCalendar,
  IconTypography,
  IconCheckbox,
  IconCircleDot,
  IconCheck,
  IconX,
  IconNumbers,
  IconPhoto,
  IconTrash,
  IconDownload,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconEye,
  IconSparkles,
  IconAlertCircle,
  IconUpload,
  IconPlus,
  IconCursorText,
  IconForms,
} from '@tabler/icons-react';
import { SignaturePadModal } from './SignaturePadModal';
import { letterheadApi } from '../api/letterheadApi';

const FONT_OPTIONS = [
  { value: 'Segoe UI', label: 'Segoe UI (Modern)' },
  { value: 'Arial', label: 'Arial (Clean)' },
  { value: 'Times New Roman', label: 'Times New Roman (Formal)' },
  { value: 'Georgia', label: 'Georgia (Editorial)' },
  { value: 'Calibri', label: 'Calibri (Standard Office)' },
  { value: 'Courier New', label: 'Courier New (Monospace)' },
];

const NUMERIC_FORMATS = [
  { value: 'currency', label: 'Currency ($#,##0.00)' },
  { value: 'decimal', label: 'Decimal (#,##0.00)' },
  { value: 'integer', label: 'Integer (#,##0)' },
  { value: 'percent', label: 'Percentage (#0.0%)' },
];

export function DocumentCustomizerCard({ userRole = 'SUPER_USER' }) {
  const [baseType, setBaseType] = useState('iipc'); // 'iipc' | 'bp' | 'blank'
  const [userDocx, setUserDocx] = useState(null);
  const [elements, setElements] = useState([
    {
      id: 'date-1',
      type: 'date',
      text: new Date().toISOString().split('T')[0],
      x: 440,
      y: 110,
      font: 'Segoe UI',
      color: '#334155',
      fontSize: 13,
    },
  ]);
  const [selectedId, setSelectedId] = useState('date-1');
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [imageUploadPending, setImageUploadPending] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const canvasRef = useRef(null);
  const draggingRef = useRef(null);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // Update selected element property
  const updateSelected = (key, val) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, [key]: val } : el))
    );
  };

  // Add Element Helpers
  const addElement = (type, extra = {}) => {
    const id = `el_${type}_${Date.now()}`;
    const newEl = {
      id,
      type,
      x: 60 + Math.floor(Math.random() * 80),
      y: 160 + (elements.length * 40) % 360,
      font: selectedElement?.font || 'Segoe UI',
      color: selectedElement?.color || '#0f172a',
      fontSize: 14,
      ...extra,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(id);
  };

  const handleAddSignature = () => {
    setSigModalOpen(true);
  };

  const handleSaveSignature = (dataUrl) => {
    addElement('signature', {
      dataUrl,
      width: 170,
      height: 55,
      y: 520,
      x: 380,
    });
  };

  const handleImageFileChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      addElement('image', {
        dataUrl: e.target.result,
        width: 110,
        height: 110,
        x: 420,
        y: 480,
      });
    };
    reader.readAsDataURL(file);
    setImageUploadPending(false);
  };

  const deleteElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Dragging logic
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    const el = elements.find((x) => x.id === id);
    if (!el) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = el.x;
    const initialY = el.y;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setElements((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                x: Math.max(10, Math.min(580, initialX + dx)),
                y: Math.max(10, Math.min(740, initialY + dy)),
              }
            : item
        )
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Generate customized document
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const data = await letterheadApi.customizeDocument({
        file: userDocx,
        baseType,
        elements,
        options: {
          includeBismillah: baseType === 'iipc',
          includeWatermark: baseType === 'bp',
        },
        userRole,
      });

      setResult(data);
    } catch (err) {
      console.error('Customizer error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to export document');
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
    <Card shadow="md" padding="lg" radius="md" withBorder style={{ background: '#ffffff' }}>
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'md', blur: 2 }} />

      <Stack gap="md">
        {/* Card Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <ThemeIcon color="grape" size="lg" radius="md" variant="light">
              <IconForms size={22} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md" c="dark.8">
                Interactive Document Customizer & E-Signature Studio
              </Text>
              <Text size="xs" c="dimmed">
                Add datefields, live signatures, customizable text, checkboxes, option buttons, marks, numeric formats, fonts & images.
              </Text>
            </div>
          </Group>
          <Badge color="grape" variant="light" size="sm">
            Interactive Form Builder
          </Badge>
        </Group>

        {/* Base Template & Upload Selection */}
        <Paper p="sm" withBorder radius="md" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="xs" align="center">
              <Text size="xs" fw={600} c="dark.7">
                Base Template:
              </Text>
              <SegmentedControl
                size="xs"
                value={baseType}
                onChange={setBaseType}
                data={[
                  { label: 'IIPC Letterhead', value: 'iipc' },
                  { label: 'BP Letterhead', value: 'bp' },
                  { label: 'Blank Paper', value: 'blank' },
                ]}
              />
            </Group>

            <Group gap="xs" style={{ flex: 1, minWidth: '240px' }}>
              <FileInput
                size="xs"
                placeholder="Upload Optional Base .docx..."
                accept=".docx,.doc"
                value={userDocx}
                onChange={setUserDocx}
                leftSection={<IconUpload size={14} />}
                clearable
                style={{ flex: 1 }}
              />
            </Group>
          </Group>
        </Paper>

        {/* Toolbar: Element Palette */}
        <Paper p="xs" withBorder radius="md" style={{ background: '#f8fafc' }}>
          <Text size="xs" fw={600} mb="xs" c="dimmed">
            INSERT FORM & ANNOTATION ELEMENTS (CLICK TO ADD ON CANVAS):
          </Text>
          <Group gap="xs" wrap="wrap">
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconCalendar size={14} />}
              onClick={() =>
                addElement('date', {
                  text: new Date().toISOString().split('T')[0],
                })
              }
            >
              Date Field
            </Button>

            <Button
              size="xs"
              variant="light"
              color="indigo"
              leftSection={<IconWriting size={14} />}
              onClick={handleAddSignature}
            >
              Signatures Field
            </Button>

            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconTypography size={14} />}
              onClick={() =>
                addElement('text', {
                  text: 'Double-click or edit this custom text box...',
                })
              }
            >
              Text Box
            </Button>

            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconCheckbox size={14} />}
              onClick={() =>
                addElement('checkbox', {
                  label: 'Approved & Verified',
                  checked: true,
                })
              }
            >
              Checkbox
            </Button>

            <Button
              size="xs"
              variant="light"
              color="cyan"
              leftSection={<IconCircleDot size={14} />}
              onClick={() =>
                addElement('radio', {
                  label: 'Option A (Selected)',
                  checked: true,
                })
              }
            >
              Option Button
            </Button>

            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconCheck size={14} />}
              onClick={() => addElement('checkmark', { size: 26, color: '#16a34a' })}
            >
              Check Mark (✔)
            </Button>

            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconX size={14} />}
              onClick={() => addElement('crossmark', { size: 26, color: '#dc2626' })}
            >
              Cross Mark (✖)
            </Button>

            <Button
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconNumbers size={14} />}
              onClick={() =>
                addElement('numeric', {
                  value: 2500,
                  format: 'currency',
                })
              }
            >
              Numeric Field
            </Button>

            <FileInput
              style={{ display: 'inline-block' }}
              accept="image/*"
              onChange={handleImageFileChange}
              size="xs"
              placeholder="+ Add Image"
              leftSection={<IconPhoto size={14} />}
            />
          </Group>
        </Paper>

        {/* Selected Element Property Inspector */}
        {selectedElement && (
          <Paper p="sm" withBorder radius="md" style={{ background: '#f1f5f9' }}>
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="xs" wrap="wrap">
                <Badge size="sm" variant="filled" color="dark">
                  Editing: {selectedElement.type.toUpperCase()}
                </Badge>

                {/* Font Selector */}
                <Select
                  size="xs"
                  data={FONT_OPTIONS}
                  value={selectedElement.font || 'Segoe UI'}
                  onChange={(val) => updateSelected('font', val)}
                  style={{ width: '170px' }}
                />

                {/* Color Selector */}
                <ColorInput
                  size="xs"
                  value={selectedElement.color || '#0f172a'}
                  onChange={(val) => updateSelected('color', val)}
                  swatches={['#0f172a', '#1e3a8a', '#2563eb', '#16a34a', '#dc2626', '#d97706']}
                  style={{ width: '130px' }}
                />

                {/* Font Size */}
                <Select
                  size="xs"
                  data={[
                    { value: '11', label: '11px' },
                    { value: '12', label: '12px' },
                    { value: '14', label: '14px' },
                    { value: '16', label: '16px' },
                    { value: '18', label: '18px' },
                    { value: '22', label: '22px' },
                    { value: '26', label: '26px' },
                  ]}
                  value={String(selectedElement.fontSize || 14)}
                  onChange={(val) => updateSelected('fontSize', Number(val))}
                  style={{ width: '90px' }}
                />

                {/* Checkbox / Radio state toggle */}
                {(selectedElement.type === 'checkbox' || selectedElement.type === 'radio') && (
                  <Button
                    size="xs"
                    variant="light"
                    color={selectedElement.checked ? 'green' : 'gray'}
                    onClick={() => updateSelected('checked', !selectedElement.checked)}
                  >
                    Status: {selectedElement.checked ? 'Selected' : 'Unselected'}
                  </Button>
                )}

                {/* Numeric format selector */}
                {selectedElement.type === 'numeric' && (
                  <Select
                    size="xs"
                    data={NUMERIC_FORMATS}
                    value={selectedElement.format || 'currency'}
                    onChange={(val) => updateSelected('format', val)}
                    style={{ width: '180px' }}
                  />
                )}
              </Group>

              {/* Text / Label editor */}
              <Group gap="xs">
                {(selectedElement.type === 'text' ||
                  selectedElement.type === 'date' ||
                  selectedElement.type === 'checkbox' ||
                  selectedElement.type === 'radio') && (
                  <TextInput
                    size="xs"
                    placeholder="Content / Label text..."
                    value={selectedElement.text ?? selectedElement.label ?? ''}
                    onChange={(e) => {
                      if (selectedElement.type === 'checkbox' || selectedElement.type === 'radio') {
                        updateSelected('label', e.target.value);
                      } else {
                        updateSelected('text', e.target.value);
                      }
                    }}
                    style={{ minWidth: '180px' }}
                  />
                )}

                {selectedElement.type === 'numeric' && (
                  <NumberInput
                    size="xs"
                    placeholder="Enter number..."
                    value={selectedElement.value ?? 0}
                    onChange={(val) => updateSelected('value', val)}
                    style={{ width: '130px' }}
                  />
                )}

                <Tooltip label="Delete element">
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => deleteElement(selectedElement.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Paper>
        )}

        {/* Interactive Visual Canvas Container */}
        <Box
          style={{
            overflowX: 'auto',
            padding: '16px',
            background: '#e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Simulated Letter Paper (660px wide, ~850px tall) */}
          <Paper
            ref={canvasRef}
            shadow="lg"
            radius="sm"
            style={{
              width: '660px',
              minHeight: '850px',
              backgroundColor: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            }}
            onClick={() => setSelectedId(null)}
          >
            {/* Template Header Banner */}
            {baseType === 'iipc' && (
              <img
                src="/letterheads/iipc_header.jpg"
                alt="IIPC Header"
                style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
              />
            )}
            {baseType === 'bp' && (
              <img
                src="/letterheads/bp_header.jpeg"
                alt="BP Header"
                style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
              />
            )}

            {/* Template Watermark */}
            {baseType === 'bp' && (
              <img
                src="/letterheads/bp_watermark.png"
                alt="BP Watermark"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60%',
                  opacity: 0.12,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Base Document Content Area */}
            <Box p="lg" style={{ minHeight: '520px', pointerEvents: 'none' }}>
              {baseType === 'iipc' && (
                <Box ta="center" mb="sm">
                  <img
                    src="/letterheads/iipc_bismillah.jpg"
                    alt="Bismillah"
                    style={{ maxHeight: '36px' }}
                  />
                </Box>
              )}

              {userDocx ? (
                <Paper p="sm" withBorder style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                  <Text size="xs" fw={600} c="dimmed">
                    [Base Document: {userDocx.name}]
                  </Text>
                  <Text size="xs" c="dimmed">
                    The text, headings, and formatting from your uploaded Word document will render here.
                  </Text>
                </Paper>
              ) : (
                <Stack gap="xs" style={{ opacity: 0.35 }}>
                  <Text fw={700} size="sm">
                    OFFICIAL CORRESPONDENCE / AGREEMENT DOCUMENT
                  </Text>
                  <Text size="xs">
                    This sample letter preview indicates the body text region of your document. Placed signatures, dates, checkmarks, textboxes, and numeric fields appear dynamically in real time and export directly to Word (.docx) and PDF (.pdf).
                  </Text>
                  <Text size="xs">
                    Drag elements anywhere on this page to position them precisely.
                  </Text>
                </Stack>
              )}
            </Box>

            {/* Placed Interactive Elements */}
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              const style = {
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                cursor: 'move',
                zIndex: isSelected ? 40 : 20,
                border: isSelected ? '2px solid #2563eb' : '1px dashed transparent',
                borderRadius: '4px',
                padding: '2px 4px',
                fontFamily: `'${el.font || 'Segoe UI'}', sans-serif`,
                color: el.color || '#0f172a',
                fontSize: `${el.fontSize || 14}px`,
                backgroundColor: isSelected ? 'rgba(219, 234, 254, 0.4)' : 'transparent',
                transition: 'border 0.1s ease',
              };

              let content = null;
              switch (el.type) {
                case 'date':
                  content = (
                    <Box style={{ background: '#ffffff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <strong>Date:</strong> {el.text}
                    </Box>
                  );
                  break;

                case 'signature':
                  content = (
                    <Box style={{ textAlign: 'center' }}>
                      <img
                        src={el.dataUrl}
                        alt="Signature"
                        style={{ width: `${el.width || 170}px`, height: `${el.height || 55}px`, objectFit: 'contain', display: 'block' }}
                      />
                      <Box style={{ borderTop: '1px solid #334155', fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                        Authorized Signature
                      </Box>
                    </Box>
                  );
                  break;

                case 'text':
                  content = (
                    <Box style={{ background: 'rgba(255,255,255,0.92)', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', maxWidth: '300px' }}>
                      {el.text}
                    </Box>
                  );
                  break;

                case 'checkbox':
                  content = (
                    <Group gap={6} align="center" style={{ background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: '4px' }}>
                      <Text fw={700} size="md" c={el.checked ? 'green.6' : 'gray.5'}>
                        {el.checked ? '☑' : '☐'}
                      </Text>
                      <Text size="xs" fw={500}>
                        {el.label || el.text}
                      </Text>
                    </Group>
                  );
                  break;

                case 'radio':
                  content = (
                    <Group gap={6} align="center" style={{ background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: '4px' }}>
                      <Text fw={700} size="md" c={el.checked ? 'blue.6' : 'gray.5'}>
                        {el.checked ? '🔘' : '⚪'}
                      </Text>
                      <Text size="xs" fw={500}>
                        {el.label || el.text}
                      </Text>
                    </Group>
                  );
                  break;

                case 'checkmark':
                  content = (
                    <Text fw={900} style={{ fontSize: `${el.size || 24}px`, color: el.color || '#16a34a' }}>
                      ✔
                    </Text>
                  );
                  break;

                case 'crossmark':
                  content = (
                    <Text fw={900} style={{ fontSize: `${el.size || 24}px`, color: el.color || '#dc2626' }}>
                      ✖
                    </Text>
                  );
                  break;

                case 'numeric': {
                  let formatted = el.value ?? 0;
                  if (el.format === 'currency') formatted = `$${Number(formatted).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                  else if (el.format === 'percent') formatted = `${Number(formatted).toFixed(1)}%`;
                  else formatted = Number(formatted).toLocaleString('en-US');

                  content = (
                    <Box style={{ background: '#ffffff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                      {formatted}
                    </Box>
                  );
                  break;
                }

                case 'image':
                  content = (
                    <img
                      src={el.dataUrl}
                      alt="Stamp"
                      style={{ width: `${el.width || 110}px`, height: `${el.height || 110}px`, objectFit: 'contain', display: 'block' }}
                    />
                  );
                  break;
              }

              return (
                <div
                  key={el.id}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {content}
                </div>
              );
            })}

            {/* Template Footer Banner */}
            {baseType === 'iipc' && (
              <Box style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
                <img
                  src="/letterheads/iipc_footer.jpg"
                  alt="IIPC Footer"
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
            )}
            {baseType === 'bp' && (
              <Box style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
                <img
                  src="/letterheads/bp_footer.png"
                  alt="BP Footer"
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
            )}
          </Paper>
        </Box>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error" radius="sm">
            {error}
          </Alert>
        )}

        {/* Generate / Export Button */}
        <Button
          fullWidth
          size="md"
          color="grape"
          leftSection={<IconSparkles size={18} />}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Compiling Document & Form...' : 'Export Customized Document (Word & PDF)'}
        </Button>

        {/* Result Action Panel */}
        {result && (
          <Paper p="sm" withBorder radius="md" style={{ background: '#fdf4ff', borderColor: '#f0abfc' }}>
            <Group justify="space-between" align="center" mb="xs">
              <Group gap="xs">
                <ThemeIcon color="grape" size="sm" radius="xl">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text fw={600} size="xs" c="grape.9">
                  Customized Document Generated Successfully!
                </Text>
              </Group>
              <Button
                size="compact-xs"
                variant="light"
                color="grape"
                leftSection={<IconEye size={12} />}
                onClick={() => setPreviewOpen(true)}
              >
                Preview Document
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

      {/* Signature Pad Modal */}
      <SignaturePadModal
        opened={sigModalOpen}
        onClose={() => setSigModalOpen(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* PDF Preview Modal */}
      <Modal
        opened={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={
          <Group gap="xs">
            <IconEye size={18} color="var(--mantine-color-grape-6)" />
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
              title="Custom PDF Preview"
            />
          </Box>
        )}
      </Modal>
    </Card>
  );
}
