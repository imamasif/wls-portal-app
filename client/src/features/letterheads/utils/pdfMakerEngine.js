import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { parseDocxFile } from './docxPreviewParser.js';

// Initialize PDF.js worker using Vite's static asset URL with CDN fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorkerUrl || 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} catch (e) {
  console.warn('PDF.js worker initialization note:', e);
}

// Standard A4 dimensions in points (72 points per inch)
export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;

/**
 * Generates a unique ID for page and annotation objects.
 */
export function uid(prefix = 'obj') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Renders a PDF page from ArrayBuffer / Uint8Array to a high-quality data URL using PDF.js.
 */
export async function renderPdfPageToDataUrl(pdfBytes, pageNumber = 1, scale = 1.0) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes),
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(pageNumber);

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (err) {
    console.error('Failed to render PDF page to Data URL:', err);
    // Fallback: white placeholder canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 560;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 400, 560);
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`PDF Page ${pageNumber}`, 200, 280);
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}

/**
 * Extracts all pages from an uploaded PDF file as independent manageable page items.
 */
export async function extractPagesFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const pages = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;

    // Render thumbnail using PDF.js
    const thumbnail = await renderPdfPageToDataUrl(pdfBytes, i + 1, 0.45);

    pages.push({
      id: uid('pg'),
      sourceType: 'pdf',
      fileId: uid('file'),
      fileName: file.name,
      originalIndex: i,
      pageNumber: i + 1,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait',
      rotation,
      thumbnail,
      pdfBytes,
      annotations: [],
      penDrawingDataUrl: null,
      headerText: '',
      footerText: '',
    });
  }

  return pages;
}

/**
 * Converts image file (JPEG, PNG, WEBP, etc.) into an A4 PDF page object.
 */
export async function convertImageToPage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          const isLandscape = img.width > img.height;
          const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
          const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

          // Render thumbnail
          const thumbCanvas = document.createElement('canvas');
          const thumbW = 200;
          const thumbH = Math.round((pageHeight / pageWidth) * thumbW);
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const ctx = thumbCanvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, thumbW, thumbH);

          // Fit image maintaining aspect ratio with margin
          const margin = 10;
          const usableW = thumbW - margin * 2;
          const usableH = thumbH - margin * 2;
          const imgAspect = img.width / img.height;
          let drawW = usableW;
          let drawH = drawW / imgAspect;
          if (drawH > usableH) {
            drawH = usableH;
            drawW = drawH * imgAspect;
          }
          const drawX = margin + (usableW - drawW) / 2;
          const drawY = margin + (usableH - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          resolve({
            id: uid('pg_img'),
            sourceType: 'image',
            fileName: file.name,
            originalIndex: 0,
            pageNumber: 1,
            width: pageWidth,
            height: pageHeight,
            orientation: isLandscape ? 'landscape' : 'portrait',
            rotation: 0,
            thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.88),
            imageDataUrl: dataUrl,
            imageWidth: img.width,
            imageHeight: img.height,
            annotations: [],
            penDrawingDataUrl: null,
            headerText: '',
            footerText: '',
          });
        };
        img.onerror = reject;
        img.src = dataUrl;
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a clean blank A4 page.
 */
export function createBlankPage(orientation = 'portrait') {
  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? A4_HEIGHT : A4_WIDTH;
  const height = isLandscape ? A4_WIDTH : A4_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = isLandscape ? 141 : 283;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  return {
    id: uid('pg_blank'),
    sourceType: 'blank',
    fileName: 'Blank Page',
    originalIndex: 0,
    pageNumber: 1,
    width,
    height,
    orientation,
    rotation: 0,
    thumbnail: canvas.toDataURL('image/jpeg', 0.8),
    annotations: [],
    penDrawingDataUrl: null,
    headerText: '',
    footerText: '',
  };
}

/**
 * Converts Plain Text (.txt) into paginated PDF pages.
 */
export async function convertTextToPages(text, fileName = 'document.txt') {
  const lines = text.split(/\r?\n/);
  const linesPerPage = 48;
  const totalPages = Math.max(1, Math.ceil(lines.length / linesPerPage));
  const pages = [];

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const pageLines = lines.slice(pIdx * linesPerPage, (pIdx + 1) * linesPerPage);

    // Create canvas representation
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 848;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 848);

    // Document Header
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText(fileName, 40, 48);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 58);
    ctx.lineTo(560, 58);
    ctx.stroke();

    // Body Text
    ctx.fillStyle = '#1e293b';
    ctx.font = '12px "Segoe UI", Arial, monospace';
    let y = 80;
    for (const l of pageLines) {
      ctx.fillText(l.substring(0, 85), 40, y);
      y += 15;
    }

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Page ${pIdx + 1} of ${totalPages}`, 40, 825);

    const dataUrl = canvas.toDataURL('image/png');

    pages.push({
      id: uid('pg_txt'),
      sourceType: 'image', // Drawn text converted to clean image page
      fileName: `${fileName} (P. ${pIdx + 1})`,
      originalIndex: pIdx,
      pageNumber: pIdx + 1,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      orientation: 'portrait',
      rotation: 0,
      thumbnail: dataUrl,
      imageDataUrl: dataUrl,
      imageWidth: 600,
      imageHeight: 848,
      annotations: [],
      penDrawingDataUrl: null,
      headerText: '',
      footerText: '',
    });
  }

  return pages;
}

/**
 * Converts Word (.docx) file into paginated PDF pages using client docx parser.
 */
export async function convertDocxToPages(file) {
  const parsed = await parseDocxFile(file);
  if (!parsed.success) {
    throw new Error(parsed.error || 'Failed to parse Word document.');
  }

  // Create temporary container to render HTML
  const container = document.createElement('div');
  container.style.width = '794px'; // 96 DPI A4 width
  container.style.minHeight = '1123px';
  container.style.padding = '48px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.innerHTML = parsed.html || '<p style="color:#64748b;">(Empty Document)</p>';
  document.body.appendChild(container);

  // Measure content height and paginate
  const a4PageHeightPx = 1123;
  const totalHeight = Math.max(a4PageHeightPx, container.scrollHeight);
  const totalPages = Math.ceil(totalHeight / a4PageHeightPx);
  const pages = [];

  for (let i = 0; i < totalPages; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 794;
    canvas.height = 1123;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render plain text & headers onto canvas
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${file.name.replace(/\.docx$/i, '')}`, 48, 55);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(48, 68);
    ctx.lineTo(746, 68);
    ctx.stroke();

    // Render extracted paragraphs
    const allLines = (parsed.totalText || '').split(/\n+/).filter(Boolean);
    const linesPerPage = 38;
    const pageLines = allLines.slice(i * linesPerPage, (i + 1) * linesPerPage);

    ctx.fillStyle = '#1e293b';
    ctx.font = '13.5px "Segoe UI", Arial, sans-serif';
    let curY = 100;
    for (const line of pageLines) {
      // Simple word wrapping
      const words = line.split(' ');
      let currentLine = '';
      for (const w of words) {
        const testLine = currentLine ? currentLine + ' ' + w : w;
        if (ctx.measureText(testLine).width > 680) {
          ctx.fillText(currentLine, 48, curY);
          curY += 20;
          currentLine = w;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        ctx.fillText(currentLine, 48, curY);
        curY += 24;
      }
    }

    // Page number footer
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Page ${i + 1} of ${totalPages}`, 48, 1090);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    pages.push({
      id: uid('pg_docx'),
      sourceType: 'image',
      fileName: `${file.name} (P. ${i + 1})`,
      originalIndex: i,
      pageNumber: i + 1,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      orientation: 'portrait',
      rotation: 0,
      thumbnail: dataUrl,
      imageDataUrl: dataUrl,
      imageWidth: 794,
      imageHeight: 1123,
      annotations: [],
      penDrawingDataUrl: null,
      headerText: '',
      footerText: '',
    });
  }

  document.body.removeChild(container);
  return pages;
}

/**
 * Converts a hex color string (#rrggbb) to rgb(r, g, b) object with values 0-1.
 */
export function hexToRgb01(hex) {
  if (!hex || typeof hex !== 'string') return rgb(0, 0, 0);
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return rgb(r, g, b);
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Master PDF Compiler that merges all pages and draws all annotations.
 */
export async function compilePdfDocument(pages, options = {}) {
  const {
    optimize = true,
    documentTitle = 'Compiled_Document',
    author = 'IIPC Canada Portal User',
  } = options;

  const targetDoc = await PDFDocument.create();
  targetDoc.setTitle(documentTitle);
  targetDoc.setAuthor(author);
  targetDoc.setCreator('IIPC Canada PDF Maker & Document Studio');
  targetDoc.setProducer('pdf-lib + IIPC Portal');

  // Embed standard fonts
  const fontHelvetica = await targetDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await targetDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await targetDoc.embedFont(StandardFonts.TimesRoman);
  const fontCourier = await targetDoc.embedFont(StandardFonts.Courier);

  // Cache source PDF documents to avoid re-parsing same PDF multiple times
  const srcDocCache = new Map();

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const pageItem = pages[pIdx];
    let pdfPage = null;

    if (pageItem.sourceType === 'pdf') {
      let srcDoc = srcDocCache.get(pageItem.pdfBytes);
      if (!srcDoc) {
        srcDoc = await PDFDocument.load(pageItem.pdfBytes, { ignoreEncryption: true });
        srcDocCache.set(pageItem.pdfBytes, srcDoc);
      }
      const [copiedPage] = await targetDoc.copyPages(srcDoc, [pageItem.originalIndex]);
      pdfPage = targetDoc.addPage(copiedPage);
      if (pageItem.rotation) {
        pdfPage.setRotation(degrees(pageItem.rotation));
      }
    } else if (pageItem.sourceType === 'image') {
      const isLandscape = pageItem.orientation === 'landscape';
      const pw = isLandscape ? A4_HEIGHT : A4_WIDTH;
      const ph = isLandscape ? A4_WIDTH : A4_HEIGHT;
      pdfPage = targetDoc.addPage([pw, ph]);

      if (pageItem.imageDataUrl) {
        const isPng = pageItem.imageDataUrl.startsWith('data:image/png');
        const b64Data = pageItem.imageDataUrl.split(',')[1];
        const imgBytes = Uint8Array.from(atob(b64Data), (c) => c.charCodeAt(0));

        let embeddedImg = null;
        if (isPng) {
          embeddedImg = await targetDoc.embedPng(imgBytes);
        } else {
          embeddedImg = await targetDoc.embedJpg(imgBytes);
        }

        // Fit nicely within page bounds with margin
        const margin = 20;
        const usableW = pw - margin * 2;
        const usableH = ph - margin * 2;
        const imgAspect = embeddedImg.width / embeddedImg.height;

        let drawW = usableW;
        let drawH = drawW / imgAspect;
        if (drawH > usableH) {
          drawH = usableH;
          drawW = drawH * imgAspect;
        }

        const drawX = margin + (usableW - drawW) / 2;
        const drawY = margin + (usableH - drawH) / 2;

        pdfPage.drawImage(embeddedImg, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      }
    } else {
      // Blank page
      const isLandscape = pageItem.orientation === 'landscape';
      const pw = isLandscape ? A4_HEIGHT : A4_WIDTH;
      const ph = isLandscape ? A4_WIDTH : A4_HEIGHT;
      pdfPage = targetDoc.addPage([pw, ph]);
    }

    const { width: pWidth, height: pHeight } = pdfPage.getSize();

    // 1. Embed Freehand Pen Drawing Layer (if drawn)
    if (pageItem.penDrawingDataUrl) {
      try {
        const b64Data = pageItem.penDrawingDataUrl.split(',')[1];
        const penBytes = Uint8Array.from(atob(b64Data), (c) => c.charCodeAt(0));
        const penImg = await targetDoc.embedPng(penBytes);
        pdfPage.drawImage(penImg, {
          x: 0,
          y: 0,
          width: pWidth,
          height: pHeight,
        });
      } catch (err) {
        console.warn('Could not embed pen layer:', err);
      }
    }

    // 2. Draw Annotations on this page
    const annotations = pageItem.annotations || [];
    for (const ann of annotations) {
      const annX = (ann.x / 100) * pWidth;
      // In PDF coordinates (0,0) is bottom-left
      const annY = pHeight - ((ann.y / 100) * pHeight);

      if (ann.type === 'text') {
        const font = ann.fontFamily === 'Courier' ? fontCourier : (ann.fontFamily === 'Times' ? fontTimes : (ann.isBold ? fontHelveticaBold : fontHelvetica));
        const color = hexToRgb01(ann.color || '#000000');
        pdfPage.drawText(ann.content || '', {
          x: annX,
          y: annY - (ann.fontSize || 12),
          size: ann.fontSize || 12,
          font,
          color,
        });
      } else if (ann.type === 'date') {
        const dateStr = ann.content || new Date().toLocaleString();
        pdfPage.drawText(dateStr, {
          x: annX,
          y: annY - (ann.fontSize || 11),
          size: ann.fontSize || 11,
          font: fontHelvetica,
          color: hexToRgb01(ann.color || '#1e3a8a'),
        });
      } else if (ann.type === 'signature' && ann.signatureDataUrl) {
        try {
          const b64 = ann.signatureDataUrl.split(',')[1];
          const sigBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const sigImg = await targetDoc.embedPng(sigBytes);
          const sigW = ann.width || 140;
          const sigH = ann.height || 50;
          pdfPage.drawImage(sigImg, {
            x: annX,
            y: annY - sigH,
            width: sigW,
            height: sigH,
          });
        } catch (e) {
          console.warn('Could not draw signature annotation:', e);
        }
      } else if (ann.type === 'image' && ann.imageDataUrl) {
        try {
          const isPng = ann.imageDataUrl.startsWith('data:image/png');
          const b64 = ann.imageDataUrl.split(',')[1];
          const imgBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const img = isPng ? await targetDoc.embedPng(imgBytes) : await targetDoc.embedJpg(imgBytes);
          const imgW = ann.width || 120;
          const imgH = ann.height || 90;
          pdfPage.drawImage(img, {
            x: annX,
            y: annY - imgH,
            width: imgW,
            height: imgH,
          });
        } catch (e) {
          console.warn('Could not draw image annotation:', e);
        }
      } else if (ann.type === 'checkbox') {
        const boxSize = ann.size || 14;
        const color = hexToRgb01(ann.color || '#1e293b');
        // Outer square box
        pdfPage.drawRectangle({
          x: annX,
          y: annY - boxSize,
          width: boxSize,
          height: boxSize,
          borderColor: color,
          borderWidth: 1.5,
          color: ann.checked ? rgb(0.92, 0.95, 1) : rgb(1, 1, 1),
        });
        // Checkmark if checked
        if (ann.checked) {
          pdfPage.drawLine({
            start: { x: annX + 2, y: annY - boxSize / 2 },
            end: { x: annX + boxSize / 2.2, y: annY - boxSize + 2 },
            thickness: 2,
            color,
          });
          pdfPage.drawLine({
            start: { x: annX + boxSize / 2.2, y: annY - boxSize + 2 },
            end: { x: annX + boxSize - 2, y: annY - 2 },
            thickness: 2,
            color,
          });
        }
        if (ann.label) {
          pdfPage.drawText(ann.label, {
            x: annX + boxSize + 6,
            y: annY - boxSize + 2,
            size: ann.fontSize || 11,
            font: fontHelvetica,
            color,
          });
        }
      } else if (ann.type === 'radio') {
        const radius = (ann.size || 14) / 2;
        const color = hexToRgb01(ann.color || '#1e293b');
        // Outer circle
        pdfPage.drawCircle({
          x: annX + radius,
          y: annY - radius,
          size: radius,
          borderColor: color,
          borderWidth: 1.5,
          color: rgb(1, 1, 1),
        });
        // Inner filled dot if selected
        if (ann.checked) {
          pdfPage.drawCircle({
            x: annX + radius,
            y: annY - radius,
            size: radius * 0.55,
            color,
          });
        }
        if (ann.label) {
          pdfPage.drawText(ann.label, {
            x: annX + radius * 2 + 6,
            y: annY - radius * 1.5,
            size: ann.fontSize || 11,
            font: fontHelvetica,
            color,
          });
        }
      } else if (ann.type === 'line') {
        const color = hexToRgb01(ann.color || '#0f172a');
        const length = ann.length || 150;
        const thickness = ann.thickness || 2;
        pdfPage.drawLine({
          start: { x: annX, y: annY },
          end: { x: annX + length, y: annY },
          thickness,
          color,
        });
      } else if (ann.type === 'arrow') {
        const color = hexToRgb01(ann.color || '#dc2626');
        const length = ann.length || 100;
        const thickness = ann.thickness || 2;
        const dir = ann.direction || 'right';

        let endX = annX + length;
        let endY = annY;
        if (dir === 'left') endX = annX - length;
        if (dir === 'up') { endX = annX; endY = annY + length; }
        if (dir === 'down') { endX = annX; endY = annY - length; }

        // Line shaft
        pdfPage.drawLine({
          start: { x: annX, y: annY },
          end: { x: endX, y: endY },
          thickness,
          color,
        });

        // Arrow head
        const headSize = 8;
        if (dir === 'right') {
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX - headSize, y: endY + headSize / 1.5 }, thickness, color });
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX - headSize, y: endY - headSize / 1.5 }, thickness, color });
        } else if (dir === 'left') {
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX + headSize, y: endY + headSize / 1.5 }, thickness, color });
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX + headSize, y: endY - headSize / 1.5 }, thickness, color });
        } else if (dir === 'down') {
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX - headSize / 1.5, y: endY + headSize }, thickness, color });
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX + headSize / 1.5, y: endY + headSize }, thickness, color });
        } else if (dir === 'up') {
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX - headSize / 1.5, y: endY - headSize }, thickness, color });
          pdfPage.drawLine({ start: { x: endX, y: endY }, end: { x: endX + headSize / 1.5, y: endY - headSize }, thickness, color });
        }
      } else if (ann.type === 'table') {
        const rows = ann.rows || 3;
        const cols = ann.cols || 3;
        const colW = ann.cellWidth || 80;
        const rowH = ann.cellHeight || 22;
        const borderColor = hexToRgb01(ann.borderColor || '#cbd5e1');
        const headerBg = hexToRgb01(ann.headerBg || '#f1f5f9');
        const textColor = hexToRgb01(ann.textColor || '#1e293b');

        // Draw header background
        if (ann.hasHeader) {
          pdfPage.drawRectangle({
            x: annX,
            y: annY - rowH,
            width: cols * colW,
            height: rowH,
            color: headerBg,
          });
        }

        // Draw grid
        for (let r = 0; r <= rows; r++) {
          pdfPage.drawLine({
            start: { x: annX, y: annY - r * rowH },
            end: { x: annX + cols * colW, y: annY - r * rowH },
            thickness: 1,
            color: borderColor,
          });
        }
        for (let c = 0; c <= cols; c++) {
          pdfPage.drawLine({
            start: { x: annX + c * colW, y: annY },
            end: { x: annX + c * colW, y: annY - rows * rowH },
            thickness: 1,
            color: borderColor,
          });
        }

        // Draw cell data
        const cellData = ann.data || [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cellText = cellData[r]?.[c] || (r === 0 && ann.hasHeader ? `Col ${c + 1}` : '');
            if (cellText) {
              pdfPage.drawText(String(cellText).substring(0, 16), {
                x: annX + c * colW + 4,
                y: annY - r * rowH - 15,
                size: 9.5,
                font: r === 0 && ann.hasHeader ? fontHelveticaBold : fontHelvetica,
                color: textColor,
              });
            }
          }
        }
      }
    }

    // 3. Document Headers & Footers (if defined)
    if (pageItem.headerText) {
      pdfPage.drawText(pageItem.headerText, {
        x: 40,
        y: pHeight - 25,
        size: 9,
        font: fontHelvetica,
        color: rgb(0.4, 0.45, 0.5),
      });
      pdfPage.drawLine({
        start: { x: 40, y: pHeight - 30 },
        end: { x: pWidth - 40, y: pHeight - 30 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
    }

    if (pageItem.footerText) {
      const formattedFooter = pageItem.footerText
        .replace('{page}', String(pIdx + 1))
        .replace('{total}', String(pages.length));

      pdfPage.drawLine({
        start: { x: 40, y: 35 },
        end: { x: pWidth - 40, y: 35 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
      pdfPage.drawText(formattedFooter, {
        x: 40,
        y: 20,
        size: 8.5,
        font: fontHelvetica,
        color: rgb(0.4, 0.45, 0.5),
      });
    }
  }

  // Save with stream compression if optimize is enabled
  const saveOptions = optimize ? { useObjectStreams: true } : {};
  const pdfBytes = await targetDoc.save(saveOptions);

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    bytes: pdfBytes,
    blob,
    downloadUrl,
    sizeBytes: pdfBytes.length,
    totalPages: pages.length,
  };
}

/**
 * Triggers browser download for a Blob or Data URL.
 */
export function triggerFileDownload(blobOrUrl, fileName = 'document.pdf') {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
