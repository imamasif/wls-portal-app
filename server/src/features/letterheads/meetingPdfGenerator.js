import fs from 'fs';
import path from 'path';
import { parseSignatureDataUrl, decodePngToRgb } from './signatureImageHelper.js';

/**
 * Extracts width and height from JPEG bytes (SOF0/SOF2 markers).
 */
export function getJpegDimensions(buf) {
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return { width: 800, height: 160 };
}

/**
 * Escape text for PDF text strings.
 */
function escapePdfText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Splits a long string into lines that fit within maxChars.
 */
function wrapText(text, maxChars) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let cur = '';

  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + ' ' + w).length <= maxChars) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/**
 * Pure JavaScript PDF Generator for Board Meeting Minutes.
 * Generates 100% compliant PDF 1.4 with real embedded signature images.
 */
export function generateMeetingMinutesPdfBuffer({
  title = 'BOARD MEETING MINUTES',
  meetingDate = 'November 7th, 2026',
  meetingTime = '9:00 AM Eastern Time',
  location = 'Online- Zoom',
  callToOrder = 'IIPC Canada Meeting',
  contentHtml = '',
  signatories = [],
  assetsDir,
}) {
  const PAGE_WIDTH = 595.28;  // A4 width
  const PAGE_HEIGHT = 841.89; // A4 height
  const MARGIN_LEFT = 36;
  const MARGIN_RIGHT = 36;
  const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  // 1. Load Asset Images
  let headerBuf = null;
  let footerBuf = null;
  let bismillahBuf = null;
  let headerDim = { width: 800, height: 130 };
  let footerDim = { width: 800, height: 90 };
  let bismillahDim = { width: 400, height: 75 };

  if (assetsDir) {
    const hPath = path.join(assetsDir, 'iipc_header.jpg');
    const fPath = path.join(assetsDir, 'iipc_footer.jpg');
    const bPath = path.join(assetsDir, 'iipc_bismillah.jpg');

    if (fs.existsSync(hPath)) {
      headerBuf = fs.readFileSync(hPath);
      headerDim = getJpegDimensions(headerBuf);
    }
    if (fs.existsSync(fPath)) {
      footerBuf = fs.readFileSync(fPath);
      footerDim = getJpegDimensions(footerBuf);
    }
    if (fs.existsSync(bPath)) {
      bismillahBuf = fs.readFileSync(bPath);
      bismillahDim = getJpegDimensions(bismillahBuf);
    }
  }

  // Pre-process signature images from signatories
  const sigImages = [];
  for (let sIdx = 0; sIdx < signatories.length; sIdx++) {
    const s = signatories[sIdx];
    if (s.isSigned && s.signatureDataUrl) {
      const parsed = parseSignatureDataUrl(s.signatureDataUrl);
      if (parsed) {
        if (parsed.format === 'png') {
          const dec = decodePngToRgb(parsed.buffer);
          if (dec) {
            sigImages.push({
              sIdx,
              format: 'png',
              width: dec.width,
              height: dec.height,
              data: dec.compressedRgb,
            });
          }
        } else if (parsed.format === 'jpeg') {
          const dim = getJpegDimensions(parsed.buffer);
          sigImages.push({
            sIdx,
            format: 'jpeg',
            width: dim.width,
            height: dim.height,
            data: parsed.buffer,
          });
        }
      }
    }
  }

  // Header and footer heights on page (proportional)
  const headerHeightPt = headerBuf ? (headerDim.height / headerDim.width) * PAGE_WIDTH : 60;
  const footerHeightPt = footerBuf ? (footerDim.height / footerDim.width) * PAGE_WIDTH : 45;

  // Multi-page builder state
  const pages = [];
  let curStream = [];
  let curY = PAGE_HEIGHT - headerHeightPt - 24;

  function startNewPage() {
    curStream = [];
    curY = PAGE_HEIGHT - 45; // Subsequent pages leave small margin at top
    pages.push(curStream);
  }

  // Start first page
  pages.push(curStream);

  function checkPageSpace(requiredHeight) {
    if (curY - requiredHeight < footerHeightPt + 25) {
      startNewPage();
    }
  }

  // PDF stream primitive: Add color rect
  function addRect(x, y, w, h, fillR = 1, fillG = 1, fillB = 1, strokeR = null, strokeG = null, strokeB = null) {
    let op = `q\n${fillR.toFixed(3)} ${fillG.toFixed(3)} ${fillB.toFixed(3)} rg\n`;
    if (strokeR !== null) {
      op += `${strokeR.toFixed(3)} ${strokeG.toFixed(3)} ${strokeB.toFixed(3)} RG\n1 w\n`;
      op += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B\nQ\n`;
    } else {
      op += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\nQ\n`;
    }
    curStream.push(op);
  }

  // PDF stream primitive: Add text
  function addText(text, x, y, font = '/F1', size = 10, r = 0.1, g = 0.1, b = 0.1) {
    const safe = escapePdfText(text);
    curStream.push(
      `BT\n${font} ${size} Tf\n${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n${x.toFixed(2)} ${y.toFixed(2)} Td\n(${safe}) Tj\nET\n`
    );
  }

  // Draw Bismillah (if present)
  if (bismillahBuf) {
    const bW = 190;
    const bH = (bismillahDim.height / bismillahDim.width) * bW;
    const bX = (PAGE_WIDTH - bW) / 2;
    curStream.push(`q\n${bW.toFixed(2)} 0 0 ${bH.toFixed(2)} ${bX.toFixed(2)} ${(curY - bH).toFixed(2)} cm\n/ImBismillah Do\nQ\n`);
    curY -= (bH + 12);
  }

  // Title
  const titleLines = wrapText(title, 55);
  for (const tl of titleLines) {
    addText(tl, MARGIN_LEFT, curY, '/F2', 14, 0.06, 0.09, 0.16);
    curY -= 18;
  }
  curY -= 4;

  // Metadata Box (Date, Time, Location, Call to order)
  const metaBoxHeight = 52;
  addRect(MARGIN_LEFT, curY - metaBoxHeight, USABLE_WIDTH, metaBoxHeight, 0.96, 0.98, 0.99, 0.8, 0.88, 0.92);
  addText(`DATE: ${meetingDate}`, MARGIN_LEFT + 14, curY - 18, '/F2', 9.5, 0.12, 0.23, 0.54);
  addText(`TIME: ${meetingTime}`, MARGIN_LEFT + 270, curY - 18, '/F2', 9.5, 0.12, 0.23, 0.54);
  addText(`LOCATION: ${location}`, MARGIN_LEFT + 14, curY - 38, '/F1', 9.5, 0.2, 0.25, 0.3);
  addText(`CALL TO ORDER: ${callToOrder}`, MARGIN_LEFT + 270, curY - 38, '/F2', 9.5, 0.12, 0.23, 0.54);
  curY -= (metaBoxHeight + 16);

  // Parse HTML content into structured sections
  const sections = [];
  const rawParts = contentHtml.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<table[^>]*>[\s\S]*?<\/table>)/gi);

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (/<h[1-6]/i.test(trimmed)) {
      const headingText = trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      sections.push({ type: 'heading', text: headingText });
    } else if (/<table/i.test(trimmed)) {
      const rows = [];
      const trMatches = trimmed.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      for (const tr of trMatches) {
        const isHeader = /<th/i.test(tr);
        const cells = (tr.match(/<(?:td|th)[\s\S]*?<\/(?:td|th)>/gi) || [])
          .map((c) => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        if (cells.length) rows.push({ isHeader, cells });
      }
      if (rows.length) sections.push({ type: 'table', rows });
    } else {
      const paras = trimmed.split(/<\/(?:p|div|li)>/gi)
        .map((p) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      for (const p of paras) {
        sections.push({ type: 'para', text: p });
      }
    }
  }

  // Render Content Sections
  for (const sec of sections) {
    if (sec.type === 'heading') {
      checkPageSpace(32);
      curY -= 6;
      addText(sec.text, MARGIN_LEFT, curY, '/F2', 11, 0.12, 0.23, 0.54);
      curStream.push(`q\n0.8 0.85 0.9 RG\n1 w\n${MARGIN_LEFT} ${(curY - 3).toFixed(2)} m ${(MARGIN_LEFT + USABLE_WIDTH)} ${(curY - 3).toFixed(2)} l S\nQ\n`);
      curY -= 15;
    } else if (sec.type === 'para') {
      const lines = wrapText(sec.text, 88);
      for (const l of lines) {
        checkPageSpace(15);
        addText(l, MARGIN_LEFT, curY, '/F1', 9.5, 0.15, 0.2, 0.25);
        curY -= 14;
      }
      curY -= 4;
    } else if (sec.type === 'table') {
      const colWidths = sec.rows[0]?.cells.length === 2
        ? [50, USABLE_WIDTH - 50]
        : [35, 170, USABLE_WIDTH - 205];

      for (const row of sec.rows) {
        const cellLines = row.cells.map((c, idx) => {
          const maxChar = Math.floor(colWidths[idx] / 5.5);
          return wrapText(c, maxChar);
        });
        const maxLines = Math.max(...cellLines.map((cl) => cl.length), 1);
        const rowHeight = maxLines * 12 + 10;

        checkPageSpace(rowHeight);

        if (row.isHeader) {
          addRect(MARGIN_LEFT, curY - rowHeight, USABLE_WIDTH, rowHeight, 0.94, 0.96, 0.98, 0.75, 0.8, 0.85);
        } else {
          addRect(MARGIN_LEFT, curY - rowHeight, USABLE_WIDTH, rowHeight, 1, 1, 1, 0.82, 0.86, 0.9);
        }

        let curX = MARGIN_LEFT;
        for (let colIdx = 0; colIdx < row.cells.length; colIdx++) {
          const w = colWidths[colIdx];
          const lines = cellLines[colIdx];
          let textY = curY - 12;

          for (const l of lines) {
            addText(
              l,
              curX + 6,
              textY,
              row.isHeader ? '/F2' : (colIdx === 0 ? '/F2' : '/F1'),
              8.5,
              row.isHeader ? 0.05 : 0.15,
              row.isHeader ? 0.1 : 0.2,
              row.isHeader ? 0.2 : 0.25
            );
            textY -= 11;
          }
          curX += w;
        }

        curY -= rowHeight;
      }
      curY -= 8;
    }
  }

  // Ratification & Signatures Heading
  checkPageSpace(50);
  curY -= 10;
  addText('BOARD OF DIRECTORS RATIFICATION & SIGNATURES', MARGIN_LEFT, curY, '/F2', 11.5, 0.12, 0.23, 0.54);
  curStream.push(`q\n0.12 0.23 0.54 RG\n1.5 w\n${MARGIN_LEFT} ${(curY - 3).toFixed(2)} m ${(MARGIN_LEFT + USABLE_WIDTH)} ${(curY - 3).toFixed(2)} l S\nQ\n`);
  curY -= 16;

  // Render 2-Column Signatories Grid (height 78pt accommodates real signature images)
  const colWidth = (USABLE_WIDTH - 14) / 2;
  const sigBoxHeight = 78;

  for (let idx = 0; idx < signatories.length; idx += 2) {
    checkPageSpace(sigBoxHeight + 8);
    const leftSig = signatories[idx];
    const rightSig = signatories[idx + 1];

    const sigsToRender = [
      { s: leftSig, sIdx: idx, x: MARGIN_LEFT },
      { s: rightSig, sIdx: idx + 1, x: MARGIN_LEFT + colWidth + 14 },
    ];

    for (const item of sigsToRender) {
      if (!item.s) continue;
      const { s, sIdx, x } = item;

      // Box border & fill
      addRect(x, curY - sigBoxHeight, colWidth, sigBoxHeight, 0.97, 0.98, 0.99, 0.78, 0.83, 0.88);

      // Role
      addText(`${s.role}:`, x + 10, curY - 14, '/F2', 8.5, 0.12, 0.23, 0.54);

      // Signature: check if real signature image exists
      const sigImg = sigImages.find((img) => img.sIdx === sIdx);
      if (sigImg) {
        const maxW = colWidth - 28;
        const maxH = 28;
        const aspect = sigImg.height / sigImg.width;
        let dw = maxW;
        let dh = dw * aspect;
        if (dh > maxH) {
          dh = maxH;
          dw = dh / aspect;
        }
        const dx = x + (colWidth - dw) / 2;
        const dy = curY - 18 - dh;
        curStream.push(`q\n${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm\n/ImSig_${sIdx} Do\nQ\n`);
      } else if (s.isSigned) {
        addText(`Signed Digitally by: ${s.name}`, x + 10, curY - 32, '/F3', 9, 0.05, 0.55, 0.25);
      } else {
        addText('(Signature & Date)', x + 10, curY - 32, '/F3', 8.5, 0.6, 0.65, 0.7);
      }

      // Signatory Name
      addText(s.name, x + 10, curY - 54, '/F2', 9, 0.06, 0.09, 0.16);

      // Date & Time
      const dateText = `Date: ${s.signDate || meetingDate} | Time: ${s.signTime || meetingTime}`;
      addText(dateText, x + 10, curY - 68, '/F1', 7.5, 0.4, 0.45, 0.5);
    }

    curY -= (sigBoxHeight + 8);
  }

  // Draw Header on Page 1 & Footer on every page
  if (headerBuf) {
    const hY = PAGE_HEIGHT - headerHeightPt;
    pages[0].unshift(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${headerHeightPt.toFixed(2)} 0 ${hY.toFixed(2)} cm\n/ImHeader Do\nQ\n`);
  }

  if (footerBuf) {
    for (const pStream of pages) {
      pStream.push(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${footerHeightPt.toFixed(2)} 0 0 cm\n/ImFooter Do\nQ\n`);
    }
  }

  // Assemble PDF Objects
  const objects = [];
  const catalogId = 1;
  const pagesTreeId = 2;
  const fontF1Id = 3;
  const fontF2Id = 4;
  const fontF3Id = 5;

  let nextObjId = 6;
  let imgHeaderId = null;
  let imgFooterId = null;
  let imgBismillahId = null;

  if (headerBuf) imgHeaderId = nextObjId++;
  if (footerBuf) imgFooterId = nextObjId++;
  if (bismillahBuf) imgBismillahId = nextObjId++;

  // Assign Object IDs to signature images
  for (const img of sigImages) {
    img.objId = nextObjId++;
  }

  const firstPageObjId = nextObjId;
  const totalPages = pages.length;

  // 1 0 obj - Catalog
  objects.push(`<< /Type /Catalog /Pages ${pagesTreeId} 0 R >>`);

  // 2 0 obj - Pages Tree
  const pageIds = [];
  for (let i = 0; i < totalPages; i++) {
    pageIds.push(`${firstPageObjId + (i * 2)} 0 R`);
  }
  objects.push(`<< /Type /Pages /Kids [${pageIds.join(' ')}] /Count ${totalPages} >>`);

  // 3 0 obj - Helvetica
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);

  // 4 0 obj - Helvetica-Bold
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);

  // 5 0 obj - Helvetica-Oblique
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`);

  // Image XObjects: Header, Footer, Bismillah
  if (headerBuf) {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${headerDim.width} /Height ${headerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${headerBuf.length} >>\nstream\n`
    );
  }
  if (footerBuf) {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${footerDim.width} /Height ${footerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${footerBuf.length} >>\nstream\n`
    );
  }
  if (bismillahBuf) {
    objects.push(
      `<< /Type /XObject /Subtype /Image /Width ${bismillahDim.width} /Height ${bismillahDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bismillahBuf.length} >>\nstream\n`
    );
  }

  // Image XObjects: Signatures
  for (const img of sigImages) {
    if (img.format === 'png') {
      objects.push(
        `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${img.data.length} >>\nstream\n`
      );
    } else {
      objects.push(
        `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.length} >>\nstream\n`
      );
    }
  }

  // Build XObject Dictionary
  let xobjDict = '';
  if (imgHeaderId) xobjDict += `/ImHeader ${imgHeaderId} 0 R `;
  if (imgFooterId) xobjDict += `/ImFooter ${imgFooterId} 0 R `;
  if (imgBismillahId) xobjDict += `/ImBismillah ${imgBismillahId} 0 R `;
  for (const img of sigImages) {
    xobjDict += `/ImSig_${img.sIdx} ${img.objId} 0 R `;
  }

  // Page Objects and Content Streams
  for (let i = 0; i < totalPages; i++) {
    const pageId = firstPageObjId + (i * 2);
    const contentId = pageId + 1;
    const streamData = pages[i].join('');
    const streamBuffer = Buffer.from(streamData, 'utf8');

    // Page Object
    objects.push(
      `<< /Type /Page /Parent ${pagesTreeId} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R /F3 ${fontF3Id} 0 R >> /XObject << ${xobjDict}>> >> /Contents ${contentId} 0 R >>`
    );

    // Stream Object
    objects.push(
      `<< /Length ${streamBuffer.length} >>\nstream\n${streamData}\nendstream`
    );
  }

  // Compile PDF Binary with xref and trailer
  const chunks = [];
  chunks.push(Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary'));

  const xrefOffsets = [0];
  let curOffset = chunks[0].length;

  let objIdx = 1;
  for (const obj of objects) {
    xrefOffsets.push(curOffset);

    if (obj.includes('/Filter /DCTDecode') || obj.includes('/Filter /FlateDecode')) {
      let imgData = null;
      if (headerBuf && obj.includes(`Length ${headerBuf.length}`)) imgData = headerBuf;
      else if (footerBuf && obj.includes(`Length ${footerBuf.length}`)) imgData = footerBuf;
      else if (bismillahBuf && obj.includes(`Length ${bismillahBuf.length}`)) imgData = bismillahBuf;
      else {
        const foundSig = sigImages.find((img) => obj.includes(`Length ${img.data.length}`));
        if (foundSig) imgData = foundSig.data;
      }

      const head = Buffer.from(`${objIdx} 0 obj\n${obj}`, 'utf8');
      const tail = Buffer.from('\nendstream\nendobj\n', 'utf8');
      chunks.push(head);
      if (imgData) chunks.push(imgData);
      chunks.push(tail);
      curOffset += (head.length + (imgData ? imgData.length : 0) + tail.length);
    } else {
      const objBuf = Buffer.from(`${objIdx} 0 obj\n${obj}\nendobj\n`, 'utf8');
      chunks.push(objBuf);
      curOffset += objBuf.length;
    }
    objIdx++;
  }

  // xref section
  const startXref = curOffset;
  let xrefStr = `xref\n0 ${xrefOffsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < xrefOffsets.length; i++) {
    xrefStr += `${String(xrefOffsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xrefStr += `trailer\n<< /Size ${xrefOffsets.length} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  chunks.push(Buffer.from(xrefStr, 'utf8'));

  return Buffer.concat(chunks);
}

/**
 * Universal Native PDF Generator for any Letterhead Document (Cards 1, 2, 3, 4).
 * Runs with 0 dependencies and produces 100% valid PDF 1.4 binary.
 */
export function generateGenericLetterheadPdfBuffer({
  title = '',
  htmlContent = '',
  templateType = 'iipc',
  assetsDir,
}) {
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 36;
  const MARGIN_RIGHT = 36;
  const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let headerBuf = null;
  let footerBuf = null;
  let bismillahBuf = null;
  let headerDim = { width: 800, height: 130 };
  let footerDim = { width: 800, height: 90 };
  let bismillahDim = { width: 400, height: 75 };

  if (assetsDir) {
    if (templateType === 'bp') {
      const hPath = path.join(assetsDir, 'bp_header.jpeg');
      if (fs.existsSync(hPath)) {
        headerBuf = fs.readFileSync(hPath);
        headerDim = getJpegDimensions(headerBuf);
      }
    } else {
      const hPath = path.join(assetsDir, 'iipc_header.jpg');
      const fPath = path.join(assetsDir, 'iipc_footer.jpg');
      const bPath = path.join(assetsDir, 'iipc_bismillah.jpg');
      if (fs.existsSync(hPath)) {
        headerBuf = fs.readFileSync(hPath);
        headerDim = getJpegDimensions(headerBuf);
      }
      if (fs.existsSync(fPath)) {
        footerBuf = fs.readFileSync(fPath);
        footerDim = getJpegDimensions(footerBuf);
      }
      if (fs.existsSync(bPath)) {
        bismillahBuf = fs.readFileSync(bPath);
        bismillahDim = getJpegDimensions(bismillahBuf);
      }
    }
  }

  const headerHeightPt = headerBuf ? (headerDim.height / headerDim.width) * PAGE_WIDTH : 60;
  const footerHeightPt = footerBuf ? (footerDim.height / footerDim.width) * PAGE_WIDTH : 45;

  const pages = [];
  let curStream = [];
  let curY = PAGE_HEIGHT - headerHeightPt - 24;

  function startNewPage() {
    curStream = [];
    curY = PAGE_HEIGHT - 45;
    pages.push(curStream);
  }
  pages.push(curStream);

  function checkPageSpace(reqHeight) {
    if (curY - reqHeight < footerHeightPt + 25) {
      startNewPage();
    }
  }

  function addText(text, x, y, font = '/F1', size = 10, r = 0.1, g = 0.1, b = 0.1) {
    const safe = escapePdfText(text);
    curStream.push(
      `BT\n${font} ${size} Tf\n${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n${x.toFixed(2)} ${y.toFixed(2)} Td\n(${safe}) Tj\nET\n`
    );
  }

  if (bismillahBuf) {
    const bW = 190;
    const bH = (bismillahDim.height / bismillahDim.width) * bW;
    const bX = (PAGE_WIDTH - bW) / 2;
    curStream.push(`q\n${bW.toFixed(2)} 0 0 ${bH.toFixed(2)} ${bX.toFixed(2)} ${(curY - bH).toFixed(2)} cm\n/ImBismillah Do\nQ\n`);
    curY -= (bH + 12);
  }

  if (title) {
    const tLines = wrapText(title, 60);
    for (const tl of tLines) {
      addText(tl, MARGIN_LEFT, curY, '/F2', 14, 0.06, 0.09, 0.16);
      curY -= 18;
    }
    curY -= 6;
  }

  const sections = [];
  const rawParts = (htmlContent || '').split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<table[^>]*>[\s\S]*?<\/table>)/gi);
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (/<h[1-6]/i.test(trimmed)) {
      sections.push({ type: 'heading', text: trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
    } else if (/<table/i.test(trimmed)) {
      const rows = [];
      const trs = trimmed.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      for (const tr of trs) {
        const isHeader = /<th/i.test(tr);
        const cells = (tr.match(/<(?:td|th)[\s\S]*?<\/(?:td|th)>/gi) || []).map((c) => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        if (cells.length) rows.push({ isHeader, cells });
      }
      if (rows.length) sections.push({ type: 'table', rows });
    } else {
      const paras = trimmed.split(/<\/(?:p|div|li)>/gi).map((p) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
      for (const p of paras) sections.push({ type: 'para', text: p });
    }
  }

  for (const sec of sections) {
    if (sec.type === 'heading') {
      checkPageSpace(30);
      curY -= 4;
      addText(sec.text, MARGIN_LEFT, curY, '/F2', 11, 0.12, 0.23, 0.54);
      curStream.push(`q\n0.8 0.85 0.9 RG\n1 w\n${MARGIN_LEFT} ${(curY - 3).toFixed(2)} m ${(MARGIN_LEFT + USABLE_WIDTH)} ${(curY - 3).toFixed(2)} l S\nQ\n`);
      curY -= 14;
    } else if (sec.type === 'para') {
      const lines = wrapText(sec.text, 88);
      for (const l of lines) {
        checkPageSpace(15);
        addText(l, MARGIN_LEFT, curY, '/F1', 9.5, 0.15, 0.2, 0.25);
        curY -= 14;
      }
      curY -= 4;
    } else if (sec.type === 'table') {
      const numCols = sec.rows[0]?.cells.length || 1;
      const colWidth = USABLE_WIDTH / numCols;
      for (const row of sec.rows) {
        const cellLines = row.cells.map((c) => wrapText(c, Math.floor(colWidth / 5.5)));
        const maxL = Math.max(...cellLines.map((cl) => cl.length), 1);
        const rH = maxL * 12 + 10;
        checkPageSpace(rH);

        let op = `q\n${row.isHeader ? '0.94 0.96 0.98' : '1.0 1.0 1.0'} rg\n0.8 0.85 0.9 RG\n1 w\n${MARGIN_LEFT} ${(curY - rH).toFixed(2)} ${USABLE_WIDTH} ${rH} re B\nQ\n`;
        curStream.push(op);

        let cx = MARGIN_LEFT;
        for (let ci = 0; ci < row.cells.length; ci++) {
          let ty = curY - 12;
          for (const l of cellLines[ci]) {
            addText(l, cx + 6, ty, row.isHeader ? '/F2' : '/F1', 8.5, 0.15, 0.2, 0.25);
            ty -= 11;
          }
          cx += colWidth;
        }
        curY -= rH;
      }
      curY -= 8;
    }
  }

  if (headerBuf) {
    const hY = PAGE_HEIGHT - headerHeightPt;
    pages[0].unshift(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${headerHeightPt.toFixed(2)} 0 ${hY.toFixed(2)} cm\n/ImHeader Do\nQ\n`);
  }
  if (footerBuf) {
    for (const pStream of pages) {
      pStream.push(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${footerHeightPt.toFixed(2)} 0 0 cm\n/ImFooter Do\nQ\n`);
    }
  }

  const objects = [];
  const catalogId = 1;
  const pagesTreeId = 2;
  const fontF1Id = 3;
  const fontF2Id = 4;
  const fontF3Id = 5;

  let imgHeaderId = headerBuf ? 6 : null;
  let imgFooterId = footerBuf ? (imgHeaderId ? 7 : 6) : null;
  let imgBismillahId = bismillahBuf ? ((imgFooterId || imgHeaderId || 5) + 1) : null;
  const firstPageObjId = (imgBismillahId || imgFooterId || imgHeaderId || fontF3Id) + 1;
  const totalPages = pages.length;

  objects.push(`<< /Type /Catalog /Pages ${pagesTreeId} 0 R >>`);
  const pageIds = [];
  for (let i = 0; i < totalPages; i++) pageIds.push(`${firstPageObjId + (i * 2)} 0 R`);
  objects.push(`<< /Type /Pages /Kids [${pageIds.join(' ')}] /Count ${totalPages} >>`);
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`);
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`);
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`);

  if (headerBuf) {
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${headerDim.width} /Height ${headerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${headerBuf.length} >>\nstream\n`);
  }
  if (footerBuf) {
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${footerDim.width} /Height ${footerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${footerBuf.length} >>\nstream\n`);
  }
  if (bismillahBuf) {
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${bismillahDim.width} /Height ${bismillahDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bismillahBuf.length} >>\nstream\n`);
  }

  let xobjDict = '';
  if (imgHeaderId) xobjDict += `/ImHeader ${imgHeaderId} 0 R `;
  if (imgFooterId) xobjDict += `/ImFooter ${imgFooterId} 0 R `;
  if (imgBismillahId) xobjDict += `/ImBismillah ${imgBismillahId} 0 R `;

  for (let i = 0; i < totalPages; i++) {
    const pageId = firstPageObjId + (i * 2);
    const contentId = pageId + 1;
    const streamData = pages[i].join('');
    const streamBuffer = Buffer.from(streamData, 'utf8');
    objects.push(`<< /Type /Page /Parent ${pagesTreeId} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R /F3 ${fontF3Id} 0 R >> /XObject << ${xobjDict}>> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${streamBuffer.length} >>\nstream\n${streamData}\nendstream`);
  }

  const chunks = [];
  chunks.push(Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary'));
  const xrefOffsets = [0];
  let curOffset = chunks[0].length;
  let objIdx = 1;

  for (const obj of objects) {
    xrefOffsets.push(curOffset);
    if (obj.includes('/Filter /DCTDecode')) {
      let imgData = null;
      if (obj.includes(`Length ${headerBuf?.length}`)) imgData = headerBuf;
      else if (obj.includes(`Length ${footerBuf?.length}`)) imgData = footerBuf;
      else if (obj.includes(`Length ${bismillahBuf?.length}`)) imgData = bismillahBuf;

      const head = Buffer.from(`${objIdx} 0 obj\n${obj}`, 'utf8');
      const tail = Buffer.from('\nendstream\nendobj\n', 'utf8');
      chunks.push(head);
      if (imgData) chunks.push(imgData);
      chunks.push(tail);
      curOffset += (head.length + (imgData ? imgData.length : 0) + tail.length);
    } else {
      const objBuf = Buffer.from(`${objIdx} 0 obj\n${obj}\nendobj\n`, 'utf8');
      chunks.push(objBuf);
      curOffset += objBuf.length;
    }
    objIdx++;
  }

  const startXref = curOffset;
  let xrefStr = `xref\n0 ${xrefOffsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < xrefOffsets.length; i++) {
    xrefStr += `${String(xrefOffsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xrefStr += `trailer\n<< /Size ${xrefOffsets.length} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  chunks.push(Buffer.from(xrefStr, 'utf8'));

  return Buffer.concat(chunks);
}
