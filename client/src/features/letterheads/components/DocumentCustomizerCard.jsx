import React, { useState, useRef, useEffect } from 'react';
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
  Textarea,
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
  Loader,
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
  IconFileText,
  IconEdit,
  IconRefresh,
} from '@tabler/icons-react';
import { SignaturePadModal } from './SignaturePadModal';
import { letterheadApi } from '../api/letterheadApi';
import { parseDocxFile, escapeHtml } from '../utils/docxPreviewParser';

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

const DEFAULT_TEMPLATES = {
  iipc: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b;">
      <div style="text-align: right; font-size: 13px; color: #475569; margin-bottom: 16px;">
        <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;|&nbsp; <strong>Ref:</strong> IIPC-DOC-2025/089
      </div>
      <p style="margin-bottom: 12px; font-size: 14px;"><strong>To:</strong> All Valued Members &amp; Respected Partners<br/><strong>Organization:</strong> Islamic Information &amp; Predestination Centre (IIPC Canada)</p>
      <h2 style="font-size: 18px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 16px 0 12px 0;">Official Institutional Correspondence &amp; Agreement</h2>
      <p style="margin: 8px 0;">This official letterhead document serves as standard verified correspondence from the Islamic Information &amp; Predestination Centre (IIPC Canada). All administrative notices, authorized agreements, and executive declarations documented herein are maintained in institutional records.</p>
      <p style="margin: 8px 0;">To customize this document, you can drag and position live date fields, interactive signatures, checkboxes, approval marks, text annotations, and numeric fields anywhere on this letter. You can also browse and upload your own Word (.docx) file above to display your document text and tables directly on this page.</p>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between;">
        <div>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Prepared by:</p>
          <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 13px;">Executive Secretariat</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">Authorized Signatory Area:</p>
          <p style="margin: 4px 0 0 0; font-style: italic; color: #94a3b8; font-size: 12px;">(Drag &amp; position signature here)</p>
        </div>
      </div>
    </div>
  `,
  bp: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b;">
      <div style="text-align: right; font-size: 13px; color: #475569; margin-bottom: 16px;">
        <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &nbsp;|&nbsp; <strong>Ref:</strong> BP-PROP-2025/114
      </div>
      <p style="margin-bottom: 12px; font-size: 14px;"><strong>To:</strong> Prospective Buyer / Tenant / Client<br/><strong>Property Reference:</strong> Blessed Properties Commercial &amp; Residential Portfolio</p>
      <h2 style="font-size: 18px; font-weight: 700; color: #065f46; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 16px 0 12px 0;">Property Agreement &amp; Official Correspondence</h2>
      <p style="margin: 8px 0;">Blessed Properties hereby presents this official documentation regarding real estate transactions, management, and binding covenants. All terms, clauses, and stipulations set forth within this document are structured under standard regulatory protocols.</p>
      <p style="margin: 8px 0;">Please review the contractual terms. You may drag signature blocks, verification checkmarks, execution dates, or custom terms directly onto this agreement before exporting to official Word (.docx) or PDF format.</p>
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between;">
        <div>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Managing Director:</p>
          <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 13px;">Blessed Properties Management</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">Client Acceptance:</p>
          <p style="margin: 4px 0 0 0; font-style: italic; color: #94a3b8; font-size: 12px;">(Drag &amp; position signature here)</p>
        </div>
      </div>
    </div>
  `,
  blank: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b;">
      <div style="text-align: right; font-size: 13px; color: #475569; margin-bottom: 16px;">
        <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 16px 0 12px 0;">Standard Blank Document</h2>
      <p style="margin: 8px 0;">Upload any Word document (.docx) above to display your document text, tables, and formatting directly inside this workspace.</p>
      <p style="margin: 8px 0;">Or use the palette above to insert custom text boxes, date pickers, live signatures, checkboxes, option buttons, checkmarks, crossmarks, and numeric currency/percentage fields.</p>
    </div>
  `,
};

export function DocumentCustomizerCard({ userRole = 'SUPER_USER' }) {
  const [baseType, setBaseType] = useState('iipc'); // 'iipc' | 'bp' | 'blank'
  const [userDocx, setUserDocx] = useState(null);
  const [docHtml, setDocHtml] = useState(DEFAULT_TEMPLATES.iipc);
  const [docFileName, setDocFileName] = useState('IIPC Canada Official Letterhead Template');
  const [docStats, setDocStats] = useState(null);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [editTextModalOpen, setEditTextModalOpen] = useState(false);
  const [rawTextToEdit, setRawTextToEdit] = useState('');

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

  // Update default document preview when baseType changes (if no custom docx uploaded)
  useEffect(() => {
    if (userDocx) return; // Keep user's uploaded document

    setDocHtml(DEFAULT_TEMPLATES[baseType] || DEFAULT_TEMPLATES.iipc);
    setDocFileName(
      baseType === 'bp'
        ? 'BP Official Letterhead Template'
        : baseType === 'blank'
        ? 'Blank Page Document'
        : 'IIPC Canada Official Letterhead Template'
    );
    setDocStats(null);
  }, [baseType, userDocx]);

  // Handle uploaded document from FileInput
  const handleDocxChange = async (file) => {
    setUserDocx(file);
    if (!file) {
      setDocFileName(
        baseType === 'bp'
          ? 'BP Official Letterhead Template'
          : baseType === 'blank'
          ? 'Blank Page Document'
          : 'IIPC Canada Official Letterhead Template'
      );
      setDocHtml(DEFAULT_TEMPLATES[baseType] || DEFAULT_TEMPLATES.iipc);
      setDocStats(null);
      return;
    }

    setIsParsingDoc(true);
    setDocFileName(file.name);
    try {
      const parsed = await parseDocxFile(file);
      if (parsed.success) {
        if (!parsed.isEmpty && parsed.html) {
          setDocHtml(parsed.html);
          setDocStats({ words: parsed.wordCount, paras: parsed.paraCount });
        } else {
          setDocHtml(`
            <div style="border: 2px dashed #94a3b8; background: #f8fafc; padding: 24px; border-radius: 8px; text-align: center; color: #475569; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">Document File Loaded: ${escapeHtml(file.name)}</h3>
              <p style="margin-bottom: 8px; font-size: 13.5px;">This file was loaded successfully. It does not contain body paragraphs (e.g. it is a header/footer template or empty document).</p>
              <p style="font-size: 12px; color: #64748b;">You can drag elements from the palette above to position signatures, dates, checkmarks, and form controls anywhere on this document, or click <strong>"Edit Text"</strong> to type custom text.</p>
            </div>
          `);
          setDocStats({ words: 0, paras: 0 });
        }
      } else {
        console.warn('Docx parse warning:', parsed.error);
        setDocHtml(`<div style="color: #b91c1c; padding: 12px; background: #fef2f2; border-radius: 6px;">Notice: ${escapeHtml(parsed.error)}. Your file will be processed directly on the server upon export.</div>`);
      }
    } catch (err) {
      console.error('Failed to parse uploaded docx:', err);
      setDocHtml(`<div style="color: #b91c1c; padding: 12px; background: #fef2f2; border-radius: 6px;">Failed to read ${escapeHtml(file.name)}: ${escapeHtml(err.message)}</div>`);
    } finally {
      setIsParsingDoc(false);
    }
  };

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

  const handleSaveSignature = (sigResult) => {
    const dataUrl = typeof sigResult === 'string' ? sigResult : sigResult?.dataUrl;
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

  // Dragging Implementation
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const el = elements.find((item) => item.id === id);
    if (!el) return;

    draggingRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!draggingRef.current) return;
    const { id, startX, startY, origX, origY } = draggingRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        return {
          ...el,
          x: Math.max(10, Math.min(610, origX + deltaX)),
          y: Math.max(10, Math.min(1800, origY + deltaY)),
        };
      })
    );
  };

  const handleMouseUp = () => {
    draggingRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  // Generate customized document
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const plainText = docHtml ? docHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

      const data = await letterheadApi.customizeDocument({
        file: userDocx,
        baseType,
        elements,
        options: {
          includeBismillah: baseType === 'iipc',
          includeWatermark: baseType === 'bp',
          bodyHtml: docHtml,
          bodyText: plainText,
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
          <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="xs" align="center">
                <Text size="xs" fw={700} c="dark.7">
                  Base Template:
                </Text>
                <SegmentedControl
                  size="xs"
                  color="grape"
                  radius="md"
                  value={baseType}
                  onChange={(val) => {
                    setBaseType(val);
                    if (!userDocx) {
                      setDocHtml(DEFAULT_TEMPLATES[val] || DEFAULT_TEMPLATES.iipc);
                      setDocFileName(
                        val === 'bp'
                          ? 'BP Official Letterhead Template'
                          : val === 'blank'
                          ? 'Blank Page Document'
                          : 'IIPC Canada Official Letterhead Template'
                      );
                      setDocStats(null);
                    }
                  }}
                  data={[
                    { label: 'IIPC Letterhead', value: 'iipc' },
                    { label: 'BP Letterhead', value: 'bp' },
                    { label: 'Blank Paper', value: 'blank' },
                  ]}
                />
              </Group>

              <Group gap="xs" style={{ flex: 1, minWidth: '260px' }}>
                <FileInput
                  size="xs"
                  placeholder="Upload Word Document (.docx) to view content..."
                  accept=".docx,.doc"
                  value={userDocx}
                  onChange={handleDocxChange}
                  leftSection={<IconUpload size={14} />}
                  clearable
                  style={{ flex: 1 }}
                />
                <Button
                  size="xs"
                  variant="light"
                  color="grape"
                  leftSection={<IconEdit size={13} />}
                  onClick={() => {
                    setRawTextToEdit(docHtml ? docHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');
                    setEditTextModalOpen(true);
                  }}
                >
                  Edit Text
                </Button>
                {userDocx && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    leftSection={<IconRefresh size={13} />}
                    onClick={() => {
                      setUserDocx(null);
                      setDocFileName(
                        baseType === 'bp'
                          ? 'BP Official Letterhead Template'
                          : baseType === 'blank'
                          ? 'Blank Page Document'
                          : 'IIPC Canada Official Letterhead Template'
                      );
                      setDocHtml(DEFAULT_TEMPLATES[baseType] || DEFAULT_TEMPLATES.iipc);
                      setDocStats(null);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Group>
            </Group>

            {/* Content Status Bar */}
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="xs">
                <Badge
                  color={userDocx ? 'teal' : 'indigo'}
                  variant="light"
                  size="xs"
                  leftSection={<IconFileTypeDocx size={12} />}
                >
                  {userDocx ? `Uploaded Document: ${docFileName}` : `Active Template: ${docFileName || 'Standard Template'}`}
                </Badge>
                {docStats && (
                  <Badge color="blue" variant="dot" size="xs">
                    {docStats.words} words &bull; {docStats.paras} paragraphs
                  </Badge>
                )}
                {isParsingDoc && (
                  <Group gap={4}>
                    <Loader size={12} color="indigo" />
                    <Text size="11px" c="dimmed">Parsing document content...</Text>
                  </Group>
                )}
              </Group>
              <Text size="11px" c="dimmed">
                Drag any element over your document to place signatures, dates, and form controls.
              </Text>
            </Group>
          </Stack>
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

                {/* Specific controls according to type */}
                {selectedElement.type === 'text' && (
                  <TextInput
                    size="xs"
                    placeholder="Enter custom text..."
                    value={selectedElement.text || ''}
                    onChange={(e) => updateSelected('text', e.target.value)}
                    style={{ minWidth: '220px' }}
                  />
                )}

                {selectedElement.type === 'date' && (
                  <TextInput
                    size="xs"
                    type="date"
                    value={selectedElement.text || ''}
                    onChange={(e) => updateSelected('text', e.target.value)}
                    style={{ width: '150px' }}
                  />
                )}

                {(selectedElement.type === 'checkbox' || selectedElement.type === 'radio') && (
                  <Group gap="xs">
                    <TextInput
                      size="xs"
                      placeholder="Label text..."
                      value={selectedElement.label || ''}
                      onChange={(e) => updateSelected('label', e.target.value)}
                      style={{ width: '180px' }}
                    />
                    <Button
                      size="xs"
                      variant={selectedElement.checked ? 'filled' : 'outline'}
                      color={selectedElement.checked ? 'green' : 'gray'}
                      onClick={() => updateSelected('checked', !selectedElement.checked)}
                    >
                      {selectedElement.checked ? 'Selected (True)' : 'Unselected (False)'}
                    </Button>
                  </Group>
                )}

                {selectedElement.type === 'numeric' && (
                  <Select
                    size="xs"
                    data={NUMERIC_FORMATS}
                    value={selectedElement.format || 'currency'}
                    onChange={(val) => updateSelected('format', val)}
                    style={{ width: '180px' }}
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
            padding: '24px 16px',
            background: '#e2e8f0',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Custom Document Styles inside Editor Paper */}
          <style>{`
            .docx-canvas-content {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 13.5px;
              line-height: 1.65;
              color: #1e293b;
              user-select: none;
              pointer-events: none;
            }
            .docx-canvas-content h1 {
              font-size: 20px;
              font-weight: 700;
              margin: 14px 0 8px 0;
              color: #0f172a;
            }
            .docx-canvas-content h2 {
              font-size: 17px;
              font-weight: 700;
              margin: 12px 0 6px 0;
              color: #1e293b;
            }
            .docx-canvas-content h3 {
              font-size: 15px;
              font-weight: 600;
              margin: 10px 0 4px 0;
              color: #334155;
            }
            .docx-canvas-content p {
              margin: 6px 0;
            }
            .docx-canvas-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
            }
            .docx-canvas-content td, .docx-canvas-content th {
              border: 1px solid #cbd5e1;
              padding: 6px 10px;
              font-size: 12.5px;
            }
          `}</style>

          {/* Simulated Letter Paper (680px wide, min 880px tall) */}
          <Paper
            ref={canvasRef}
            shadow="lg"
            radius="sm"
            style={{
              width: '680px',
              minHeight: '880px',
              backgroundColor: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none',
              boxShadow: '0 12px 28px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
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
                  zIndex: 2,
                }}
              />
            )}

            {/* Base Document Content Area */}
            <Box
              p="xl"
              style={{
                minHeight: '620px',
                paddingBottom: baseType !== 'blank' ? '140px' : '40px',
                position: 'relative',
                zIndex: 5,
              }}
            >
              {baseType === 'iipc' && (
                <Box ta="center" mb="md" style={{ pointerEvents: 'none' }}>
                  <img
                    src="/letterheads/iipc_bismillah.jpg"
                    alt="Bismillah"
                    style={{ maxHeight: '38px', maxWidth: '280px', objectFit: 'contain' }}
                  />
                </Box>
              )}

              {isParsingDoc && (
                <Box ta="center" py="xl" style={{ pointerEvents: 'none' }}>
                  <Loader size="sm" color="indigo" />
                  <Text size="xs" c="dimmed" mt="xs">
                    Rendering document contents into editor...
                  </Text>
                </Box>
              )}

              {!isParsingDoc && docHtml && (
                <div
                  className="docx-canvas-content"
                  dangerouslySetInnerHTML={{ __html: docHtml }}
                />
              )}

              {!isParsingDoc && !docHtml && (
                <Stack gap="xs" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                  <Text fw={700} size="sm">
                    OFFICIAL CORRESPONDENCE / AGREEMENT DOCUMENT
                  </Text>
                  <Text size="xs">
                    This sample letter preview indicates the body text region of your document. Placed signatures, dates, checkmarks, textboxes, and numeric fields appear dynamically in real time and export directly to Word (.docx) and PDF (.pdf).
                  </Text>
                  <Text size="xs">
                    Upload your Word document above to see its exact text and drag elements precisely where needed.
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
                zIndex: isSelected ? 50 : 30,
                border: isSelected ? '2px solid #4f46e5' : '1px dashed rgba(79, 70, 229, 0.4)',
                borderRadius: '6px',
                padding: '3px 6px',
                fontFamily: `'${el.font || 'Segoe UI'}', sans-serif`,
                color: el.color || '#0f172a',
                fontSize: `${el.fontSize || 14}px`,
                backgroundColor: isSelected ? 'rgba(238, 242, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                boxShadow: isSelected ? '0 4px 14px rgba(79, 70, 229, 0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
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
                    <Box style={{ background: 'transparent' }}>
                      <img
                        src={el.dataUrl}
                        alt="Signature"
                        style={{
                          width: `${el.width || 170}px`,
                          height: `${el.height || 55}px`,
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    </Box>
                  );
                  break;

                case 'text':
                  content = (
                    <span style={{ fontWeight: 500 }}>
                      {el.text || 'Text Box'}
                    </span>
                  );
                  break;

                case 'checkbox':
                  content = (
                    <Group gap={6} wrap="nowrap">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          border: '1.5px solid #334155',
                          borderRadius: '3px',
                          background: el.checked ? '#2563eb' : '#ffffff',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {el.checked ? '✓' : ''}
                      </span>
                      <span>{el.label || 'Checkbox'}</span>
                    </Group>
                  );
                  break;

                case 'radio':
                  content = (
                    <Group gap={6} wrap="nowrap">
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          border: '1.5px solid #334155',
                          borderRadius: '50%',
                          background: '#ffffff',
                        }}
                      >
                        {el.checked && (
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#2563eb',
                              display: 'block',
                            }}
                          />
                        )}
                      </span>
                      <span>{el.label || 'Option'}</span>
                    </Group>
                  );
                  break;

                case 'checkmark':
                  content = (
                    <span style={{ color: el.color || '#16a34a', fontSize: `${el.size || 26}px`, lineHeight: 1 }}>
                      ✔
                    </span>
                  );
                  break;

                case 'crossmark':
                  content = (
                    <span style={{ color: el.color || '#dc2626', fontSize: `${el.size || 26}px`, lineHeight: 1 }}>
                      ✖
                    </span>
                  );
                  break;

                case 'numeric':
                  let formatted = String(el.value ?? 0);
                  if (el.format === 'currency') {
                    formatted = `$${Number(el.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  } else if (el.format === 'decimal') {
                    formatted = Number(el.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  } else if (el.format === 'integer') {
                    formatted = Math.round(Number(el.value || 0)).toLocaleString('en-US');
                  } else if (el.format === 'percent') {
                    formatted = `${(Number(el.value || 0) * 100).toFixed(1)}%`;
                  }
                  content = (
                    <Box style={{ background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <strong style={{ color: el.color || '#d97706' }}>{formatted}</strong>
                    </Box>
                  );
                  break;

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
              <Box style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: 10 }}>
                <img
                  src="/letterheads/iipc_footer.jpg"
                  alt="IIPC Footer"
                  style={{ width: '100%', display: 'block' }}
                />
              </Box>
            )}
            {baseType === 'bp' && (
              <Box style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: 10 }}>
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
      {/* Modal: Direct Document Text Editor */}
      <Modal
        opened={editTextModalOpen}
        onClose={() => setEditTextModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="grape" size="sm" radius="md">
              <IconEdit size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Edit Document Body Text
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Stack gap="sm">
          <Text size="xs" c="dimmed">
            Type or paste custom document text below. Clicking Apply will update the editor canvas immediately.
          </Text>
          <Textarea
            minRows={8}
            maxRows={16}
            autosize
            value={rawTextToEdit}
            onChange={(e) => setRawTextToEdit(e.target.value)}
            placeholder="Type or paste document content paragraphs here..."
          />
          <Group justify="space-between">
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => {
                const defaultHtml = DEFAULT_TEMPLATES[baseType] || DEFAULT_TEMPLATES.iipc;
                setRawTextToEdit(defaultHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
              }}
            >
              Load Default Template Text
            </Button>
            <Group gap="xs">
              <Button size="xs" variant="default" onClick={() => setEditTextModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="xs"
                color="grape"
                onClick={() => {
                  const paragraphs = rawTextToEdit
                    .split('\n')
                    .map((p) => p.trim())
                    .filter((p) => p.length > 0)
                    .map((p) => `<p style="margin: 8px 0; font-size: 13.5px; line-height: 1.65;">${escapeHtml(p)}</p>`)
                    .join('');
                  setDocHtml(paragraphs || '<p style="color: #64748b;">(Empty document)</p>');
                  setDocFileName('Custom Typed Document');
                  const words = rawTextToEdit.trim() ? rawTextToEdit.trim().split(/\s+/).length : 0;
                  const paras = rawTextToEdit.split('\n').filter((p) => p.trim()).length;
                  setDocStats({ words, paras });
                  setEditTextModalOpen(false);
                }}
              >
                Apply to Canvas
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}

export default DocumentCustomizerCard;
