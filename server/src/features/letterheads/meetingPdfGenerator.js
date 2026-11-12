import fs from 'fs';
import path from 'path';
import { parseSignatureDataUrl, decodePngToRgb } from './signatureImageHelper.js';

/**
 * Extracts width and height from JPEG bytes safely.
 */
export function getJpegDimensions(buf) {
  try {
    if (!buf || buf.length < 10) return { width: 800, height: 160 };
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        if (width > 0 && height > 0) return { width, height };
      }
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const len = buf.readUInt16BE(i + 2);
      if (len <= 2) {
        i += 2;
      } else {
        i += 2 + len;
      }
    }
  } catch (e) {
    console.warn('JPEG dimension read notice:', e.message);
  }
  return { width: 800, height: 160 };
}

/**
 * Escape text for PDF text strings.
 */
function escapePdfText(str) {
  return String(str || '')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/[^\x20-\x7E\t\n\r]/g, ' ')
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
 * Compiles a list of structured PDF objects into a 100% compliant PDF 1.4 binary.
 */
export function compilePdfObjects(pdfObjects, catalogId = 1) {
  const chunks = [];
  chunks.push(Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary'));

  const xrefOffsets = [0];
  let curOffset = chunks[0].length;

  for (const obj of pdfObjects) {
    xrefOffsets.push(curOffset);
    let headStr = `${obj.id} 0 obj\n${obj.dict}\n`;
    if (obj.streamBuf) {
      headStr += 'stream\n';
      const headBuf = Buffer.from(headStr, 'utf8');
      const tailBuf = Buffer.from('\nendstream\nendobj\n', 'utf8');
      chunks.push(headBuf);
      chunks.push(obj.streamBuf);
      chunks.push(tailBuf);
      curOffset += (headBuf.length + obj.streamBuf.length + tailBuf.length);
    } else {
      headStr += 'endobj\n';
      const objBuf = Buffer.from(headStr, 'utf8');
      chunks.push(objBuf);
      curOffset += objBuf.length;
    }
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

  // Filter attending signatories only
  const activeSignatories = (signatories || []).filter((s) => s.attending !== false);

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

  // Pre-process signature images from attending signatories
  const sigImages = [];
  for (let sIdx = 0; sIdx < activeSignatories.length; sIdx++) {
    const s = activeSignatories[sIdx];
    if (s.isSigned && s.signatureDataUrl) {
      const parsed = parseSignatureDataUrl(s.signatureDataUrl);
      if (parsed) {
        if (parsed.format === 'png') {
          const dec = decodePngToRgb(parsed.buffer);
          if (dec && dec.compressedRgb) {
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

  for (let idx = 0; idx < activeSignatories.length; idx += 2) {
    checkPageSpace(sigBoxHeight + 8);
    const leftSig = activeSignatories[idx];
    const rightSig = activeSignatories[idx + 1];

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

  // Assemble PDF Objects with precise object mapping
  const pdfObjects = [];
  let nextObjId = 1;

  function registerObject(dict, streamBuf = null) {
    const id = nextObjId++;
    pdfObjects.push({ id, dict, streamBuf });
    return id;
  }

  const catalogId = registerObject('<< /Type /Catalog /Pages 2 0 R >>'); // 1
  const pagesTreeId = registerObject(''); // 2 (placeholder updated below)
  const fontF1Id = registerObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3
  const fontF2Id = registerObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4
  const fontF3Id = registerObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>'); // 5

  let imgHeaderId = null;
  let imgFooterId = null;
  let imgBismillahId = null;

  if (headerBuf) {
    imgHeaderId = registerObject(
      `<< /Type /XObject /Subtype /Image /Width ${headerDim.width} /Height ${headerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${headerBuf.length} >>`,
      headerBuf
    );
  }
  if (footerBuf) {
    imgFooterId = registerObject(
      `<< /Type /XObject /Subtype /Image /Width ${footerDim.width} /Height ${footerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${footerBuf.length} >>`,
      footerBuf
    );
  }
  if (bismillahBuf) {
    imgBismillahId = registerObject(
      `<< /Type /XObject /Subtype /Image /Width ${bismillahDim.width} /Height ${bismillahDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bismillahBuf.length} >>`,
      bismillahBuf
    );
  }

  // Assign Object IDs to signature images
  for (const img of sigImages) {
    const filter = img.format === 'png' ? '/Filter /FlateDecode' : '/Filter /DCTDecode';
    img.objId = registerObject(
      `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 ${filter} /Length ${img.data.length} >>`,
      img.data
    );
  }

  // Build XObject Dictionary
  let xobjDict = '';
  if (imgHeaderId) xobjDict += `/ImHeader ${imgHeaderId} 0 R `;
  if (imgFooterId) xobjDict += `/ImFooter ${imgFooterId} 0 R `;
  if (imgBismillahId) xobjDict += `/ImBismillah ${imgBismillahId} 0 R `;
  for (const img of sigImages) {
    xobjDict += `/ImSig_${img.sIdx} ${img.objId} 0 R `;
  }

  const pageIds = [];
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const streamData = pages[i].join('');
    const streamBuffer = Buffer.from(streamData, 'utf8');

    const pageId = nextObjId++;
    const contentId = nextObjId++;
    pageIds.push(`${pageId} 0 R`);

    pdfObjects.push({
      id: pageId,
      dict: `<< /Type /Page /Parent ${pagesTreeId} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R /F3 ${fontF3Id} 0 R >> /XObject << ${xobjDict}>> >> /Contents ${contentId} 0 R >>`,
    });

    pdfObjects.push({
      id: contentId,
      dict: `<< /Length ${streamBuffer.length} >>`,
      streamBuf: streamBuffer,
    });
  }

  // Update Pages Tree object
  const pagesTreeObj = pdfObjects.find((o) => o.id === pagesTreeId);
  if (pagesTreeObj) {
    pagesTreeObj.dict = `<< /Type /Pages /Kids [${pageIds.join(' ')}] /Count ${totalPages} >>`;
  }

  return compilePdfObjects(pdfObjects, catalogId);
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

  if (templateType === 'iipc' && bismillahBuf) {
    const bW = 190;
    const bH = (bismillahDim.height / bismillahDim.width) * bW;
    const bX = (PAGE_WIDTH - bW) / 2;
    curStream.push(`q\n${bW.toFixed(2)} 0 0 ${bH.toFixed(2)} ${bX.toFixed(2)} ${(curY - bH).toFixed(2)} cm\n/ImBismillah Do\nQ\n`);
    curY -= (bH + 16);
  }

  if (title) {
    const titleLines = wrapText(title, 55);
    for (const tl of titleLines) {
      addText(tl, MARGIN_LEFT, curY, '/F2', 13, 0.06, 0.09, 0.16);
      curY -= 18;
    }
    curY -= 6;
  }

  // Parse HTML - sanitize by stripping style, script, head, doctype blocks
  const sanitizedHtml = (htmlContent || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const rawParts = sanitizedHtml.split(/(<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<table[^>]*>[\s\S]*?<\/table>)/gi);
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (/<h[1-6]/i.test(trimmed)) {
      const hText = trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      checkPageSpace(30);
      curY -= 6;
      addText(hText, MARGIN_LEFT, curY, '/F2', 11, 0.12, 0.23, 0.54);
      curY -= 15;
    } else if (/<table/i.test(trimmed)) {
      const rows = [];
      const trMatches = trimmed.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      for (const tr of trMatches) {
        const isHeader = /<th/i.test(tr);
        const cells = (tr.match(/<(?:td|th)[\s\S]*?<\/(?:td|th)>/gi) || [])
          .map((c) => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        if (cells.length) rows.push({ isHeader, cells });
      }
      if (rows.length) {
        const colCount = Math.max(...rows.map((r) => r.cells.length), 1);
        const colW = USABLE_WIDTH / colCount;
        for (const row of rows) {
          checkPageSpace(24);
          let curX = MARGIN_LEFT;
          for (const c of row.cells) {
            addText(c, curX + 4, curY - 10, row.isHeader ? '/F2' : '/F1', 8.5, 0.1, 0.15, 0.2);
            curX += colW;
          }
          curY -= 20;
        }
      }
    } else {
      const paras = trimmed.split(/<\/(?:p|div|li)>/gi)
        .map((p) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      for (const p of paras) {
        const lines = wrapText(p, 88);
        for (const l of lines) {
          checkPageSpace(15);
          addText(l, MARGIN_LEFT, curY, '/F1', 9.5, 0.15, 0.2, 0.25);
          curY -= 14;
        }
        curY -= 4;
      }
    }
  }

  // Draw Header and Footer
  if (headerBuf) {
    const hY = PAGE_HEIGHT - headerHeightPt;
    pages[0].unshift(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${headerHeightPt.toFixed(2)} 0 ${hY.toFixed(2)} cm\n/ImHeader Do\nQ\n`);
  }

  if (footerBuf) {
    for (const pStream of pages) {
      pStream.push(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${footerHeightPt.toFixed(2)} 0 0 cm\n/ImFooter Do\nQ\n`);
    }
  }

  const pdfObjects = [];
  let nextObjId = 1;

  function registerObject(dict, streamBuf = null) {
    const id = nextObjId++;
    pdfObjects.push({ id, dict, streamBuf });
    return id;
  }

  const catalogId = registerObject('<< /Type /Catalog /Pages 2 0 R >>');
  const pagesTreeId = registerObject('');
  const fontF1Id = registerObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontF2Id = registerObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const fontF3Id = registerObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>');

  let imgHeaderId = null;
  let imgFooterId = null;
  let imgBismillahId = null;

  if (headerBuf) {
    imgHeaderId = registerObject(
      `<< /Type /XObject /Subtype /Image /Width ${headerDim.width} /Height ${headerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${headerBuf.length} >>`,
      headerBuf
    );
  }
  if (footerBuf) {
    imgFooterId = registerObject(
      `<< /Type /XObject /Subtype /Image /Width ${footerDim.width} /Height ${footerDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${footerBuf.length} >>`,
      footerBuf
    );
  }
  if (bismillahBuf) {
    imgBismillahId = registerObject(
      `<< /Type /XObject /Subtype /Image /Width ${bismillahDim.width} /Height ${bismillahDim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bismillahBuf.length} >>`,
      bismillahBuf
    );
  }

  let xobjDict = '';
  if (imgHeaderId) xobjDict += `/ImHeader ${imgHeaderId} 0 R `;
  if (imgFooterId) xobjDict += `/ImFooter ${imgFooterId} 0 R `;
  if (imgBismillahId) xobjDict += `/ImBismillah ${imgBismillahId} 0 R `;

  const pageIds = [];
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const streamData = pages[i].join('');
    const streamBuffer = Buffer.from(streamData, 'utf8');

    const pageId = nextObjId++;
    const contentId = nextObjId++;
    pageIds.push(`${pageId} 0 R`);

    pdfObjects.push({
      id: pageId,
      dict: `<< /Type /Page /Parent ${pagesTreeId} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R /F3 ${fontF3Id} 0 R >> /XObject << ${xobjDict}>> >> /Contents ${contentId} 0 R >>`,
    });

    pdfObjects.push({
      id: contentId,
      dict: `<< /Length ${streamBuffer.length} >>`,
      streamBuf: streamBuffer,
    });
  }

  const pagesTreeObj = pdfObjects.find((o) => o.id === pagesTreeId);
  if (pagesTreeObj) {
    pagesTreeObj.dict = `<< /Type /Pages /Kids [${pageIds.join(' ')}] /Count ${totalPages} >>`;
  }

  return compilePdfObjects(pdfObjects, catalogId);
}
