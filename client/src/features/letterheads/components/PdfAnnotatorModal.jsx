import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Title,
  Paper,
  ActionIcon,
  Tooltip,
  ColorPicker,
  ColorSwatch,
  Slider,
  Select,
  NumberInput,
  TextInput,
  Tabs,
  Badge,
  Divider,
  Box,
  Switch,
  FileInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import {
  IconPencil,
  IconEraser,
  IconWriting,
  IconTypography,
  IconCalendarTime,
  IconPhoto,
  IconCheckbox,
  IconCircleDot,
  IconMinus,
  IconArrowRight,
  IconTable,
  IconLayoutNavbar,
  IconTrash,
  IconCheck,
  IconX,
  IconZoomIn,
  IconZoomOut,
  IconRotate,
  IconPlus,
} from '@tabler/icons-react';
import { renderPdfPageToDataUrl, uid } from '../utils/pdfMakerEngine';

const PRESET_COLORS = [
  '#000000',
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0d9488',
  '#475569',
];

export function PdfAnnotatorModal({ opened, onClose, page, onSavePage }) {
  if (!page) return null;

  // Active Tool
  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'text' | 'date' | 'signature' | 'image' | 'checkbox' | 'radio' | 'line' | 'arrow' | 'table' | 'headerFooter'

  // Canvas / Background
  const [bgImageUrl, setBgImageUrl] = useState(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [loadingBg, setLoadingBg] = useState(false);

  // Pen tool state
  const penCanvasRef = useRef(null);
  const [penColor, setPenColor] = useState('#dc2626');
  const [penWidth, setPenWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penStrokes, setPenStrokes] = useState([]); // Array of { points: [{x, y}], color, width }
  const [currentPenStroke, setCurrentPenStroke] = useState([]);

  // Annotations list (text, date, signature, checkbox, radio, line, arrow, table, image)
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnId, setSelectedAnnId] = useState(null);

  // Dragging state for annotations
  const [dragInfo, setDragInfo] = useState(null); // { id, startX, startY, origX, origY }

  // Tool Specific States
  // Text
  const [newText, setNewText] = useState('Sample Text');
  const [textFont, setTextFont] = useState('Helvetica');
  const [textSize, setTextSize] = useState(14);
  const [textColor, setTextColor] = useState('#0f172a');
  const [textBold, setTextBold] = useState(false);

  // Date & Time
  const [pickedDateTime, setPickedDateTime] = useState(new Date());

  // Signature
  const sigCanvasRef = useRef(null);
  const [sigPenColor, setSigPenColor] = useState('#0f172a');
  const [sigStrokes, setSigStrokes] = useState([]);
  const [isSigDrawing, setIsSigDrawing] = useState(false);
  const [curSigStroke, setCurSigStroke] = useState([]);

  // Checkbox & Radio
  const [checkLabel, setCheckLabel] = useState('Approved & Verified');
  const [checkChecked, setCheckChecked] = useState(true);
  const [radioLabel, setRadioLabel] = useState('Option A');
  const [radioChecked, setRadioChecked] = useState(true);

  // Line & Arrow
  const [lineLength, setLineLength] = useState(140);
  const [lineThickness, setLineThickness] = useState(2);
  const [lineColor, setLineColor] = useState('#0f172a');
  const [arrowDir, setArrowDir] = useState('right');
  const [arrowLength, setArrowLength] = useState(100);
  const [arrowColor, setArrowColor] = useState('#dc2626');

  // Table
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);
  const [tableBorderColor, setTableBorderColor] = useState('#cbd5e1');

  // Header & Footer
  const [pageHeader, setPageHeader] = useState('');
  const [pageFooter, setPageFooter] = useState('');

  // Load high-resolution background when modal opens
  useEffect(() => {
    if (!opened || !page) return;

    // Initialize annotations and headers from page
    setAnnotations(JSON.parse(JSON.stringify(page.annotations || [])));
    setPageHeader(page.headerText || '');
    setPageFooter(page.footerText || '');
    setSelectedAnnId(null);
    setPenStrokes([]);

    const loadBg = async () => {
      setLoadingBg(true);
      if (page.sourceType === 'pdf') {
        const url = await renderPdfPageToDataUrl(page.pdfBytes, page.originalIndex + 1, 1.4);
        setBgImageUrl(url);
      } else if (page.imageDataUrl) {
        setBgImageUrl(page.imageDataUrl);
      } else {
        setBgImageUrl(null);
      }
      setLoadingBg(false);
    };

    loadBg();
  }, [opened, page]);

  // Redraw Pen Canvas
  useEffect(() => {
    const canvas = penCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of penStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [penStrokes, zoomScale]);

  // Pen Mouse Handlers
  const handlePenMouseDown = (e) => {
    if (activeTool !== 'pen') return;
    const rect = penCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale;

    setIsDrawing(true);
    setCurrentPenStroke([{ x, y }]);
  };

  const handlePenMouseMove = (e) => {
    if (!isDrawing || activeTool !== 'pen') return;
    const rect = penCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomScale;
    const y = (e.clientY - rect.top) / zoomScale;

    const nextPoints = [...currentPenStroke, { x, y }];
    setCurrentPenStroke(nextPoints);

    // Live stroke drawing
    const ctx = penCanvasRef.current.getContext('2d');
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (nextPoints.length >= 2) {
      const p1 = nextPoints[nextPoints.length - 2];
      const p2 = nextPoints[nextPoints.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  };

  const handlePenMouseUp = () => {
    if (!isDrawing || activeTool !== 'pen') return;
    setIsDrawing(false);
    if (currentPenStroke.length > 1) {
      setPenStrokes([...penStrokes, { points: currentPenStroke, color: penColor, width: penWidth }]);
    }
    setCurrentPenStroke([]);
  };

  const clearPenStrokes = () => {
    setPenStrokes([]);
    const canvas = penCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Add Annotation Helpers
  const addTextAnnotation = () => {
    if (!newText.trim()) return;
    const ann = {
      id: uid('ann_txt'),
      type: 'text',
      content: newText,
      fontFamily: textFont,
      fontSize: textSize,
      color: textColor,
      isBold: textBold,
      x: 35, // percentage from left
      y: 35, // percentage from top
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
  };

  const addDateAnnotation = () => {
    const formatted = pickedDateTime
      ? pickedDateTime.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : new Date().toLocaleString();

    const ann = {
      id: uid('ann_dt'),
      type: 'date',
      content: formatted,
      fontSize: 11.5,
      color: '#1e3a8a',
      x: 40,
      y: 40,
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
  };

  const addCheckboxAnnotation = () => {
    const ann = {
      id: uid('ann_chk'),
      type: 'checkbox',
      checked: checkChecked,
      label: checkLabel,
      size: 15,
      color: '#0f172a',
      fontSize: 12,
      x: 30,
      y: 45,
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
  };

  const addRadioAnnotation = () => {
    const ann = {
      id: uid('ann_rad'),
      type: 'radio',
      checked: radioChecked,
      label: radioLabel,
      size: 15,
      color: '#0f172a',
      fontSize: 12,
      x: 30,
      y: 50,
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
  };

  const addLineAnnotation = () => {
    const ann = {
      id: uid('ann_ln'),
      type: 'line',
      length: lineLength,
      thickness: lineThickness,
      color: lineColor,
      x: 25,
      y: 55,
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
  };

  const addArrowAnnotation = () => {
    const ann = {
      id: uid('ann_arr'),
      type: 'arrow',
      direction: arrowDir,
      length: arrowLength,
      thickness: 2.5,
      color: arrowColor,
      x: 35,
      y: 55,
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
  };

  const addTableAnnotation = () => {
    const sampleData = [];
    for (let r = 0; r < tableRows; r++) {
      const row = [];
      for (let c = 0; c < tableCols; c++) {
        row.push(r === 0 && tableHasHeader ? `Header ${c + 1}` : `Row ${r}, Col ${c + 1}`);
      }
      sampleData.push(row);
    }

    const ann = {
      id: uid('ann_tbl'),
      type: 'table',
      rows: tableRows,
      cols: tableCols,
      cellWidth: 80,
      cellHeight: 22,
      hasHeader: tableHasHeader,
      borderColor: tableBorderColor,
      headerBg: '#f1f5f9',
      textColor: '#1e293b',
      data: sampleData,
      x: 20,
      y: 40,
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const ann = {
        id: uid('ann_img'),
        type: 'image',
        imageDataUrl: e.target.result,
        width: 120,
        height: 80,
        x: 40,
        y: 40,
      };
      setAnnotations([...annotations, ann]);
      setSelectedAnnId(ann.id);
    };
    reader.readAsDataURL(file);
  };

  // Signature Pad Handlers
  const handleSigMouseDown = (e) => {
    const rect = sigCanvasRef.current.getBoundingClientRect();
    setIsSigDrawing(true);
    setCurSigStroke([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const handleSigMouseMove = (e) => {
    if (!isSigDrawing) return;
    const rect = sigCanvasRef.current.getBoundingClientRect();
    const nextPoints = [...curSigStroke, { x: e.clientX - rect.left, y: e.clientY - rect.top }];
    setCurSigStroke(nextPoints);

    const ctx = sigCanvasRef.current.getContext('2d');
    ctx.strokeStyle = sigPenColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (nextPoints.length >= 2) {
      const p1 = nextPoints[nextPoints.length - 2];
      const p2 = nextPoints[nextPoints.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  };

  const handleSigMouseUp = () => {
    if (!isSigDrawing) return;
    setIsSigDrawing(false);
    if (curSigStroke.length > 1) {
      setSigStrokes([...sigStrokes, { points: curSigStroke, color: sigPenColor, width: 2.5 }]);
    }
    setCurSigStroke([]);
  };

  const clearSigPad = () => {
    setSigStrokes([]);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const adoptSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas || sigStrokes.length === 0) return;
    const dataUrl = canvas.toDataURL('image/png');
    const ann = {
      id: uid('ann_sig'),
      type: 'signature',
      signatureDataUrl: dataUrl,
      width: 140,
      height: 50,
      x: 40,
      y: 60,
    };
    setAnnotations([...annotations, ann]);
    setSelectedAnnId(ann.id);
    clearSigPad();
  };

  // Annotation Dragging
  const handleAnnMouseDown = (e, ann) => {
    e.stopPropagation();
    setSelectedAnnId(ann.id);
    setDragInfo({
      id: ann.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: ann.x,
      origY: ann.y,
    });
  };

  const handleContainerMouseMove = (e) => {
    if (!dragInfo) return;
    const container = document.getElementById('pdf-canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const dx = ((e.clientX - dragInfo.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragInfo.startY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(95, dragInfo.origX + dx));
    const newY = Math.max(0, Math.min(95, dragInfo.origY + dy));

    setAnnotations((prev) =>
      prev.map((a) => (a.id === dragInfo.id ? { ...a, x: newX, y: newY } : a))
    );
  };

  const handleContainerMouseUp = () => {
    setDragInfo(null);
  };

  const deleteSelectedAnnotation = () => {
    if (!selectedAnnId) return;
    setAnnotations(annotations.filter((a) => a.id !== selectedAnnId));
    setSelectedAnnId(null);
  };

  // Save All Changes to Parent Page Object
  const handleSaveAll = () => {
    // Export pen canvas to transparent PNG data URL
    let penPng = null;
    const canvas = penCanvasRef.current;
    if (canvas && penStrokes.length > 0) {
      penPng = canvas.toDataURL('image/png');
    }

    onSavePage({
      ...page,
      annotations,
      penDrawingDataUrl: penPng || page.penDrawingDataUrl,
      headerText: pageHeader,
      footerText: pageFooter,
    });
    onClose();
  };

  const pageWidth = page.width || 595;
  const pageHeight = page.height || 842;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group justify="space-between" style={{ width: '100%', paddingRight: '20px' }}>
          <div>
            <Group gap="xs">
              <Title order={4} style={{ color: '#0f172a', fontWeight: 800 }}>
                Interactive Page Annotator &amp; Markup Studio
              </Title>
              <Badge color="blue" variant="light">
                Page {page.pageNumber} ({page.orientation})
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Use the pen to write anywhere, add signatures, calendar dates, text, arrows, checkboxes &amp; tables.
            </Text>
          </div>
          <Group gap="xs">
            <Button variant="default" size="xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="teal"
              size="xs"
              leftSection={<IconCheck size={16} />}
              onClick={handleSaveAll}
            >
              Save &amp; Apply to Page
            </Button>
          </Group>
        </Group>
      }
      size="96%"
      styles={{
        body: { padding: '12px 16px', maxHeight: '88vh', overflowY: 'hidden' },
        header: { borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' },
      }}
    >
      <Group align="flex-start" gap="md" wrap="nowrap" style={{ height: '78vh' }}>
        {/* LEFT: TOOLS SIDEBAR */}
        <Paper
          p="sm"
          withBorder
          radius="md"
          style={{ width: '310px', height: '100%', overflowY: 'auto', flexShrink: 0, background: '#f8fafc' }}
        >
          <Stack gap="sm">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
              Markup &amp; Design Tools
            </Text>

            <Group gap={6} wrap="wrap">
              <Tooltip label="Freehand Pen (Draw anywhere)" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'pen' ? 'filled' : 'light'}
                  color="red"
                  leftSection={<IconPencil size={15} />}
                  onClick={() => setActiveTool('pen')}
                >
                  Pen
                </Button>
              </Tooltip>

              <Tooltip label="Text Box" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'text' ? 'filled' : 'light'}
                  color="blue"
                  leftSection={<IconTypography size={15} />}
                  onClick={() => setActiveTool('text')}
                >
                  Text
                </Button>
              </Tooltip>

              <Tooltip label="Date & Time from Calendar" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'date' ? 'filled' : 'light'}
                  color="teal"
                  leftSection={<IconCalendarTime size={15} />}
                  onClick={() => setActiveTool('date')}
                >
                  Date
                </Button>
              </Tooltip>

              <Tooltip label="Draw / Type Signature" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'signature' ? 'filled' : 'light'}
                  color="violet"
                  leftSection={<IconWriting size={15} />}
                  onClick={() => setActiveTool('signature')}
                >
                  Sign
                </Button>
              </Tooltip>

              <Tooltip label="Add Checkbox" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'checkbox' ? 'filled' : 'light'}
                  color="indigo"
                  leftSection={<IconCheckbox size={15} />}
                  onClick={() => setActiveTool('checkbox')}
                >
                  Check
                </Button>
              </Tooltip>

              <Tooltip label="Add Option Radio Button" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'radio' ? 'filled' : 'light'}
                  color="cyan"
                  leftSection={<IconCircleDot size={15} />}
                  onClick={() => setActiveTool('radio')}
                >
                  Radio
                </Button>
              </Tooltip>

              <Tooltip label="Straight Line" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'line' ? 'filled' : 'light'}
                  color="gray"
                  leftSection={<IconMinus size={15} />}
                  onClick={() => setActiveTool('line')}
                >
                  Line
                </Button>
              </Tooltip>

              <Tooltip label="Directional Arrow" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'arrow' ? 'filled' : 'light'}
                  color="orange"
                  leftSection={<IconArrowRight size={15} />}
                  onClick={() => setActiveTool('arrow')}
                >
                  Arrow
                </Button>
              </Tooltip>

              <Tooltip label="Table (Rows & Columns)" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'table' ? 'filled' : 'light'}
                  color="grape"
                  leftSection={<IconTable size={15} />}
                  onClick={() => setActiveTool('table')}
                >
                  Table
                </Button>
              </Tooltip>

              <Tooltip label="Header & Footer" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'headerFooter' ? 'filled' : 'light'}
                  color="dark"
                  leftSection={<IconLayoutNavbar size={15} />}
                  onClick={() => setActiveTool('headerFooter')}
                >
                  Hdr/Ftr
                </Button>
              </Tooltip>

              <Tooltip label="Snap / Image Stamp" position="bottom">
                <Button
                  size="xs"
                  variant={activeTool === 'image' ? 'filled' : 'light'}
                  color="teal"
                  leftSection={<IconPhoto size={15} />}
                  onClick={() => setActiveTool('image')}
                >
                  Snap
                </Button>
              </Tooltip>
            </Group>

            <Divider my="xs" />

            {/* ACTIVE TOOL CONTROLS */}
            {/* 1. PEN TOOL */}
            {activeTool === 'pen' && (
              <Stack gap="xs">
                <Text size="xs" fw={700}>
                  Pen Color:
                </Text>
                <Group gap={6}>
                  {PRESET_COLORS.map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      size={22}
                      style={{ cursor: 'pointer', border: penColor === c ? '2px solid #000' : 'none' }}
                      onClick={() => setPenColor(c)}
                    />
                  ))}
                </Group>
                <Text size="xs" fw={700} mt="xs">
                  Stroke Width: {penWidth}px
                </Text>
                <Slider
                  value={penWidth}
                  onChange={setPenWidth}
                  min={1}
                  max={16}
                  step={1}
                  size="sm"
                />
                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  leftSection={<IconEraser size={14} />}
                  onClick={clearPenStrokes}
                  mt="xs"
                >
                  Clear Freehand Drawings
                </Button>
              </Stack>
            )}

            {/* 2. TEXT TOOL */}
            {activeTool === 'text' && (
              <Stack gap="xs">
                <TextInput
                  label="Text Content"
                  size="xs"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
                <Select
                  label="Font Family"
                  size="xs"
                  value={textFont}
                  onChange={setTextFont}
                  data={[
                    { value: 'Helvetica', label: 'Helvetica / Sans-Serif' },
                    { value: 'Times', label: 'Times Roman / Serif' },
                    { value: 'Courier', label: 'Courier / Monospace' },
                  ]}
                />
                <NumberInput
                  label="Font Size (pt)"
                  size="xs"
                  value={textSize}
                  onChange={setTextSize}
                  min={8}
                  max={48}
                />
                <Switch
                  label="Bold Weight"
                  size="xs"
                  checked={textBold}
                  onChange={(e) => setTextBold(e.currentTarget.checked)}
                />
                <Text size="xs" fw={700}>
                  Text Color:
                </Text>
                <Group gap={6}>
                  {PRESET_COLORS.map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      size={20}
                      style={{ cursor: 'pointer', border: textColor === c ? '2px solid #000' : 'none' }}
                      onClick={() => setTextColor(c)}
                    />
                  ))}
                </Group>
                <Button
                  variant="filled"
                  color="blue"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addTextAnnotation}
                  mt="xs"
                >
                  Add Text to Page
                </Button>
              </Stack>
            )}

            {/* 3. DATE & TIME TOOL */}
            {activeTool === 'date' && (
              <Stack gap="xs">
                <DateTimePicker
                  label="Choose Date & Time"
                  placeholder="Pick date & time"
                  size="xs"
                  value={pickedDateTime}
                  onChange={setPickedDateTime}
                />
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => setPickedDateTime(new Date())}
                >
                  Set to Today &amp; Current Time
                </Button>
                <Button
                  variant="filled"
                  color="teal"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addDateAnnotation}
                  mt="xs"
                >
                  Stamp Date &amp; Time
                </Button>
              </Stack>
            )}

            {/* 4. SIGNATURE TOOL */}
            {activeTool === 'signature' && (
              <Stack gap="xs">
                <Text size="xs" fw={700}>
                  Draw Your Signature Below:
                </Text>
                <Paper withBorder radius="sm" p={4} style={{ background: '#ffffff' }}>
                  <canvas
                    ref={sigCanvasRef}
                    width={260}
                    height={110}
                    style={{ cursor: 'crosshair', display: 'block', width: '100%', height: '110px' }}
                    onMouseDown={handleSigMouseDown}
                    onMouseMove={handleSigMouseMove}
                    onMouseUp={handleSigMouseUp}
                  />
                </Paper>
                <Group justify="space-between">
                  <Button variant="subtle" color="red" size="xs" onClick={clearSigPad}>
                    Clear
                  </Button>
                  <Button
                    variant="filled"
                    color="violet"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={adoptSignature}
                  >
                    Place Signature
                  </Button>
                </Group>
              </Stack>
            )}

            {/* 5. CHECKBOX TOOL */}
            {activeTool === 'checkbox' && (
              <Stack gap="xs">
                <TextInput
                  label="Label Text"
                  size="xs"
                  value={checkLabel}
                  onChange={(e) => setCheckLabel(e.target.value)}
                />
                <Switch
                  label="Checked State"
                  size="xs"
                  checked={checkChecked}
                  onChange={(e) => setCheckChecked(e.currentTarget.checked)}
                />
                <Button
                  variant="filled"
                  color="indigo"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addCheckboxAnnotation}
                  mt="xs"
                >
                  Add Checkbox
                </Button>
              </Stack>
            )}

            {/* 6. RADIO TOOL */}
            {activeTool === 'radio' && (
              <Stack gap="xs">
                <TextInput
                  label="Option Label"
                  size="xs"
                  value={radioLabel}
                  onChange={(e) => setRadioLabel(e.target.value)}
                />
                <Switch
                  label="Selected State"
                  size="xs"
                  checked={radioChecked}
                  onChange={(e) => setRadioChecked(e.currentTarget.checked)}
                />
                <Button
                  variant="filled"
                  color="cyan"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addRadioAnnotation}
                  mt="xs"
                >
                  Add Option Button
                </Button>
              </Stack>
            )}

            {/* 7. LINE TOOL */}
            {activeTool === 'line' && (
              <Stack gap="xs">
                <NumberInput
                  label="Line Length (pt)"
                  size="xs"
                  value={lineLength}
                  onChange={setLineLength}
                  min={20}
                  max={500}
                />
                <NumberInput
                  label="Thickness (pt)"
                  size="xs"
                  value={lineThickness}
                  onChange={setLineThickness}
                  min={1}
                  max={12}
                />
                <Text size="xs" fw={700}>
                  Line Color:
                </Text>
                <Group gap={6}>
                  {PRESET_COLORS.map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      size={20}
                      style={{ cursor: 'pointer', border: lineColor === c ? '2px solid #000' : 'none' }}
                      onClick={() => setLineColor(c)}
                    />
                  ))}
                </Group>
                <Button
                  variant="filled"
                  color="gray"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addLineAnnotation}
                  mt="xs"
                >
                  Add Line
                </Button>
              </Stack>
            )}

            {/* 8. ARROW TOOL */}
            {activeTool === 'arrow' && (
              <Stack gap="xs">
                <Select
                  label="Direction"
                  size="xs"
                  value={arrowDir}
                  onChange={setArrowDir}
                  data={[
                    { value: 'right', label: 'Right ➔' },
                    { value: 'left', label: 'Left ⬅' },
                    { value: 'up', label: 'Up ⬆' },
                    { value: 'down', label: 'Down ⬇' },
                  ]}
                />
                <NumberInput
                  label="Length"
                  size="xs"
                  value={arrowLength}
                  onChange={setArrowLength}
                  min={30}
                  max={400}
                />
                <Text size="xs" fw={700}>
                  Arrow Color:
                </Text>
                <Group gap={6}>
                  {PRESET_COLORS.map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      size={20}
                      style={{ cursor: 'pointer', border: arrowColor === c ? '2px solid #000' : 'none' }}
                      onClick={() => setArrowColor(c)}
                    />
                  ))}
                </Group>
                <Button
                  variant="filled"
                  color="orange"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addArrowAnnotation}
                  mt="xs"
                >
                  Add Arrow
                </Button>
              </Stack>
            )}

            {/* 9. TABLE TOOL */}
            {activeTool === 'table' && (
              <Stack gap="xs">
                <Group grow>
                  <NumberInput
                    label="Rows"
                    size="xs"
                    value={tableRows}
                    onChange={setTableRows}
                    min={1}
                    max={10}
                  />
                  <NumberInput
                    label="Columns"
                    size="xs"
                    value={tableCols}
                    onChange={setTableCols}
                    min={1}
                    max={6}
                  />
                </Group>
                <Switch
                  label="Top Header Row"
                  size="xs"
                  checked={tableHasHeader}
                  onChange={(e) => setTableHasHeader(e.currentTarget.checked)}
                />
                <Button
                  variant="filled"
                  color="grape"
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addTableAnnotation}
                  mt="xs"
                >
                  Insert Table
                </Button>
              </Stack>
            )}

            {/* 10. HEADER & FOOTER TOOL */}
            {activeTool === 'headerFooter' && (
              <Stack gap="xs">
                <TextInput
                  label="Page Header"
                  placeholder="e.g. IIPC Canada • Confidential"
                  size="xs"
                  value={pageHeader}
                  onChange={(e) => setPageHeader(e.target.value)}
                />
                <TextInput
                  label="Page Footer"
                  placeholder="e.g. Page {page} of {total}"
                  size="xs"
                  value={pageFooter}
                  onChange={(e) => setPageFooter(e.target.value)}
                />
                <Text size="xs" c="dimmed">
                  Headers and footers will be drawn with subtle divider rules on this page.
                </Text>
              </Stack>
            )}

            {/* 11. IMAGE / SNAP TOOL */}
            {activeTool === 'image' && (
              <Stack gap="xs">
                <FileInput
                  label="Select Image / Stamp / Snap"
                  placeholder="Browse photo (PNG, JPG)"
                  size="xs"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Stack>
            )}

            {/* SELECTED ELEMENT ACTIONS */}
            {selectedAnnId && (
              <Paper p="xs" withBorder radius="sm" style={{ background: '#fef2f2', borderColor: '#fca5a5' }} mt="md">
                <Group justify="space-between">
                  <Text size="xs" fw={700} c="red">
                    Item Selected
                  </Text>
                  <ActionIcon color="red" size="sm" variant="subtle" onClick={deleteSelectedAnnotation}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <Text size="xs" c="dimmed" mt={3}>
                  Drag item on page to reposition.
                </Text>
              </Paper>
            )}
          </Stack>
        </Paper>

        {/* RIGHT: INTERACTIVE CANVAS CONTAINER */}
        <Box
          style={{
            flex: 1,
            height: '100%',
            overflow: 'auto',
            background: '#e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px',
            position: 'relative',
          }}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
        >
          {/* Zoom Controls Bar */}
          <Paper
            p={6}
            radius="md"
            withBorder
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 30,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              marginBottom: '12px',
            }}
          >
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.15))}
              >
                <IconZoomOut size={16} />
              </ActionIcon>
              <Text size="xs" fw={600} style={{ minWidth: '45px', textAlign: 'center' }}>
                {Math.round(zoomScale * 100)}%
              </Text>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setZoomScale((z) => Math.min(2.0, z + 0.15))}
              >
                <IconZoomIn size={16} />
              </ActionIcon>
              <Button size="compact-xs" variant="default" onClick={() => setZoomScale(1.0)}>
                Reset
              </Button>
            </Group>
          </Paper>

          {/* Page Canvas Container with Actual Aspect Ratio */}
          <div
            id="pdf-canvas-container"
            style={{
              width: `${pageWidth * zoomScale}px`,
              height: `${pageHeight * zoomScale}px`,
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              userSelect: 'none',
              transformOrigin: 'top center',
            }}
          >
            {/* Background PDF / Image layer */}
            {bgImageUrl ? (
              <img
                src={bgImageUrl}
                alt="Page Background"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '14px',
                }}
              >
                (Blank Canvas Page)
              </div>
            )}

            {/* Header Preview */}
            {pageHeader && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '40px',
                  right: '40px',
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: '4px',
                  fontSize: `${10 * zoomScale}px`,
                  color: '#475569',
                  pointerEvents: 'none',
                }}
              >
                {pageHeader}
              </div>
            )}

            {/* Footer Preview */}
            {pageFooter && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '40px',
                  right: '40px',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '4px',
                  fontSize: `${9 * zoomScale}px`,
                  color: '#475569',
                  pointerEvents: 'none',
                }}
              >
                {pageFooter.replace('{page}', String(page.pageNumber)).replace('{total}', 'Doc')}
              </div>
            )}

            {/* Interactive Annotations Overlay */}
            {annotations.map((ann) => {
              const isSelected = ann.id === selectedAnnId;
              return (
                <div
                  key={ann.id}
                  style={{
                    position: 'absolute',
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    cursor: 'move',
                    border: isSelected ? '2px dashed #2563eb' : '1px solid transparent',
                    padding: '2px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    zIndex: isSelected ? 25 : 10,
                  }}
                  onMouseDown={(e) => handleAnnMouseDown(e, ann)}
                >
                  {/* TEXT */}
                  {ann.type === 'text' && (
                    <div
                      style={{
                        fontFamily: ann.fontFamily,
                        fontSize: `${(ann.fontSize || 12) * zoomScale}px`,
                        color: ann.color,
                        fontWeight: ann.isBold ? 700 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ann.content}
                    </div>
                  )}

                  {/* DATE */}
                  {ann.type === 'date' && (
                    <div
                      style={{
                        fontSize: `${(ann.fontSize || 11) * zoomScale}px`,
                        color: ann.color || '#1e3a8a',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📅 {ann.content}
                    </div>
                  )}

                  {/* SIGNATURE */}
                  {ann.type === 'signature' && (
                    <img
                      src={ann.signatureDataUrl}
                      alt="Signature"
                      style={{
                        width: `${(ann.width || 140) * zoomScale}px`,
                        height: `${(ann.height || 50) * zoomScale}px`,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  )}

                  {/* IMAGE */}
                  {ann.type === 'image' && (
                    <img
                      src={ann.imageDataUrl}
                      alt="Snap"
                      style={{
                        width: `${(ann.width || 120) * zoomScale}px`,
                        height: `${(ann.height || 80) * zoomScale}px`,
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  )}

                  {/* CHECKBOX */}
                  {ann.type === 'checkbox' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          width: `${(ann.size || 15) * zoomScale}px`,
                          height: `${(ann.size || 15) * zoomScale}px`,
                          border: `2px solid ${ann.color || '#000'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${11 * zoomScale}px`,
                          fontWeight: 'bold',
                          color: ann.color || '#000',
                          background: ann.checked ? '#dbeafe' : '#ffffff',
                        }}
                      >
                        {ann.checked ? '✓' : ''}
                      </div>
                      {ann.label && (
                        <span style={{ fontSize: `${(ann.fontSize || 12) * zoomScale}px`, color: ann.color }}>
                          {ann.label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* RADIO BUTTON */}
                  {ann.type === 'radio' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          width: `${(ann.size || 15) * zoomScale}px`,
                          height: `${(ann.size || 15) * zoomScale}px`,
                          borderRadius: '50%',
                          border: `2px solid ${ann.color || '#000'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#ffffff',
                        }}
                      >
                        {ann.checked && (
                          <div
                            style={{
                              width: `${(ann.size || 15) * 0.55 * zoomScale}px`,
                              height: `${(ann.size || 15) * 0.55 * zoomScale}px`,
                              borderRadius: '50%',
                              backgroundColor: ann.color || '#000',
                            }}
                          />
                        )}
                      </div>
                      {ann.label && (
                        <span style={{ fontSize: `${(ann.fontSize || 12) * zoomScale}px`, color: ann.color }}>
                          {ann.label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* LINE */}
                  {ann.type === 'line' && (
                    <div
                      style={{
                        width: `${(ann.length || 140) * zoomScale}px`,
                        height: `${(ann.thickness || 2) * zoomScale}px`,
                        backgroundColor: ann.color || '#000',
                      }}
                    />
                  )}

                  {/* ARROW */}
                  {ann.type === 'arrow' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <div
                        style={{
                          width: `${(ann.length || 100) * zoomScale}px`,
                          height: `${(ann.thickness || 2) * zoomScale}px`,
                          backgroundColor: ann.color || '#dc2626',
                        }}
                      />
                      <span style={{ color: ann.color || '#dc2626', fontSize: `${16 * zoomScale}px`, lineHeight: 1 }}>
                        {ann.direction === 'left' ? '◀' : '▶'}
                      </span>
                    </div>
                  )}

                  {/* TABLE */}
                  {ann.type === 'table' && (
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        fontSize: `${9.5 * zoomScale}px`,
                        backgroundColor: '#ffffff',
                        border: `1px solid ${ann.borderColor || '#cbd5e1'}`,
                      }}
                    >
                      <tbody>
                        {(ann.data || []).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                style={{
                                  border: `1px solid ${ann.borderColor || '#cbd5e1'}`,
                                  padding: '4px 8px',
                                  backgroundColor: rIdx === 0 && ann.hasHeader ? '#f1f5f9' : '#ffffff',
                                  fontWeight: rIdx === 0 && ann.hasHeader ? 700 : 400,
                                  color: ann.textColor || '#1e293b',
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

            {/* Freehand Pen Canvas Overlay */}
            <canvas
              ref={penCanvasRef}
              width={pageWidth}
              height={pageHeight}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: activeTool === 'pen' ? 'auto' : 'none',
                cursor: activeTool === 'pen' ? 'crosshair' : 'default',
                zIndex: 20,
              }}
              onMouseDown={handlePenMouseDown}
              onMouseMove={handlePenMouseMove}
              onMouseUp={handlePenMouseUp}
            />
          </div>
        </Box>
      </Group>
    </Modal>
  );
}
