import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Tabs,
  FileInput,
  ColorInput,
  Slider,
  Paper,
  Box,
  SegmentedControl,
  Divider,
} from '@mantine/core';
import {
  IconWriting,
  IconUpload,
  IconTrash,
  IconCheck,
  IconArrowBackUp,
} from '@tabler/icons-react';

export function SignaturePadModal({ opened, onClose, onSaveSignature }) {
  const [activeTab, setActiveTab] = useState('draw');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(2.5);
  const [strokes, setStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);

  useEffect(() => {
    if (opened && activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        redrawAll(strokes);
      }
    }
  }, [opened, activeTab]);

  const redrawAll = (strokeList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw baseline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 35);
    ctx.lineTo(canvas.width - 20, canvas.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw strokes
    for (const stroke of strokeList) {
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
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    const newStroke = {
      color: penColor,
      width: penWidth,
      points: [coords],
    };
    setCurrentStroke(newStroke);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setCurrentStroke((prev) => {
      if (!prev || !prev.points) return prev;
      return {
        ...prev,
        points: [...prev.points, coords],
      };
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke && currentStroke.points && currentStroke.points.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Redraw baseline
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(20, canvas.height - 35);
      ctx.lineTo(canvas.width - 20, canvas.height - 35);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    redrawAll(newStrokes);
  };

  const handleFileUpload = (file) => {
    setUploadedImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setUploadedPreview(null);
    }
  };

  const handleApply = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || strokes.length === 0) {
        alert('Please draw your signature before saving.');
        return;
      }
      // Create transparent version for export
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const oCtx = offscreen.getContext('2d');

      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        oCtx.strokeStyle = stroke.color;
        oCtx.lineWidth = stroke.width;
        oCtx.lineCap = 'round';
        oCtx.lineJoin = 'round';
        oCtx.beginPath();
        oCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          oCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        oCtx.stroke();
      }

      const dataUrl = offscreen.toDataURL('image/png');
      onSaveSignature({
        type: 'draw',
        dataUrl,
        strokes,
        width: canvas.width,
        height: canvas.height,
      });
      onClose();
    } else {
      if (!uploadedPreview) {
        alert('Please select a signature image first.');
        return;
      }
      onSaveSignature({
        type: 'upload',
        dataUrl: uploadedPreview,
        file: uploadedImage,
      });
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconWriting size={20} color="var(--mantine-color-indigo-6)" />
          <Text fw={700} size="md">Add Electronic Signature</Text>
        </Group>
      }
      size="lg"
      radius="md"
    >
      {/* University Styled Modal Tabs */}
      <style>{`
        .signature-modal-tabs {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 5px;
          border-radius: 12px;
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .signature-modal-tabs .mantine-Tabs-tab {
          font-weight: 600;
          font-size: 13.5px;
          padding: 8px 18px;
          border-radius: 9px;
          color: #475569;
          border: 1px solid transparent;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .signature-modal-tabs .mantine-Tabs-tab:hover {
          background: #e2e8f0;
          color: #1e293b;
          transform: translateY(-1px);
        }
        .signature-modal-tabs .mantine-Tabs-tab[data-active] {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 14px -2px rgba(79, 70, 229, 0.45);
          transform: translateY(-1px);
        }
        .signature-modal-tabs .mantine-Tabs-tab[data-active] svg {
          color: #ffffff !important;
        }
      `}</style>
      <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md" mb="md">
        <Tabs.List className="signature-modal-tabs" grow>
          <Tabs.Tab value="draw" leftSection={<IconWriting size={16} />}>
            Draw on Screen
          </Tabs.Tab>
          <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>
            Upload Signature Image
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="draw" pt="xs">
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <SegmentedControl
                size="xs"
                value={penColor}
                onChange={setPenColor}
                data={[
                  { label: 'Black', value: '#0f172a' },
                  { label: 'Navy Blue', value: '#1e3a8a' },
                  { label: 'Royal Blue', value: '#2563eb' },
                  { label: 'Dark Grey', value: '#334155' },
                ]}
              />

              <Group gap="xs">
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconArrowBackUp size={14} />}
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                >
                  Undo
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </Group>
            </Group>

            <Box
              style={{
                border: '2px dashed #94a3b8',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#ffffff',
                touchAction: 'none',
              }}
            >
              <canvas
                ref={canvasRef}
                width={560}
                height={200}
                style={{ width: '100%', height: '200px', cursor: 'crosshair', display: 'block' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </Box>

            <Text size="xs" c="dimmed" ta="center">
              Sign above using your mouse, trackpad, or finger. The signature line will not appear in the final document.
            </Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="upload" pt="xs">
          <Stack gap="sm">
            <FileInput
              label="Select Transparent PNG or JPG Signature"
              placeholder="Click to browse image file..."
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              leftSection={<IconUpload size={16} />}
              clearable
            />

            {uploadedPreview && (
              <Paper p="sm" withBorder style={{ textAlign: 'center', background: '#f8fafc' }}>
                <Text size="xs" fw={500} mb="xs" c="dimmed">
                  Signature Preview:
                </Text>
                <img
                  src={uploadedPreview}
                  alt="Uploaded signature"
                  style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }}
                />
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Divider my="sm" />

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="indigo"
          leftSection={<IconCheck size={16} />}
          onClick={handleApply}
        >
          Apply Signature
        </Button>
      </Group>
    </Modal>
  );
}

export default SignaturePadModal;
