import fs from 'fs';
import path from 'path';
import { getJpegDimensions, compilePdfObjects } from './meetingPdfGenerator.js';

/**
 * Escapes strings for PDF Type 1 text. Converts non-ASCII and dashes cleanly.
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

function formatCurrency(num) {
  const val = Number(num) || 0;
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generates an institutional vector PDF for a Voucher / Invoice / Petty Cash Receipt.
 * Completely independent of browser or external dependencies.
 * Features automated multi-page pagination for long receipts & multiple receipt batches,
 * re-printing table headers on continuation pages, displaying clean subtotals,
 * combined taxes, and individual receipt photo appendices.
 */
export function generateVoucherPdfBuffer({ voucher, letterheadType = 'iipc', assetsDir }) {
  const PAGE_WIDTH = 595.28;  // A4 width
  const PAGE_HEIGHT = 841.89; // A4 height
  const MARGIN_LEFT = 36;
  const MARGIN_RIGHT = 36;
  const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  // 1. Load Header, Footer, and Bismillah assets
  let headerBuf = null;
  let footerBuf = null;
  let bismillahBuf = null;
  let headerDim = { width: 800, height: 130 };
  let footerDim = { width: 800, height: 90 };
  let bismillahDim = { width: 400, height: 75 };

  if (assetsDir) {
    if (letterheadType === 'iipc') {
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
    } else if (letterheadType === 'bp') {
      const hPath = path.join(assetsDir, 'bp_header.jpeg');
      if (fs.existsSync(hPath)) {
        headerBuf = fs.readFileSync(hPath);
        headerDim = getJpegDimensions(headerBuf);
      }
    }
  }

  // 2. Supporting receipt images (handles single or multiple receipts)
  const rawReceiptUrls = [];
  if (Array.isArray(voucher.receiptImageUrls)) {
    for (const u of voucher.receiptImageUrls) {
      if (u && !rawReceiptUrls.includes(u)) rawReceiptUrls.push(u);
    }
  }
  if (Array.isArray(voucher.receipts)) {
    for (const r of voucher.receipts) {
      if (r?.url && !rawReceiptUrls.includes(r.url)) {
        rawReceiptUrls.push(r.url);
      }
    }
  }
  if (voucher.receiptImageUrl && !rawReceiptUrls.includes(voucher.receiptImageUrl)) {
    rawReceiptUrls.push(voucher.receiptImageUrl);
  }

  const receiptImages = [];
  for (let rIdx = 0; rIdx < rawReceiptUrls.length; rIdx++) {
    const rUrl = rawReceiptUrls[rIdx];
    try {
      let rBuf = null;
      let rDim = { width: 800, height: 600 };
      let rMime = 'jpeg';

      if (rUrl.startsWith('data:image/')) {
        const parts = rUrl.split(',');
        if (parts.length === 2) {
          const rawMime = parts[0].toLowerCase();
          rBuf = Buffer.from(parts[1], 'base64');
          if (rawMime.includes('jpeg') || rawMime.includes('jpg')) {
            rDim = getJpegDimensions(rBuf);
            rMime = 'jpeg';
          }
        }
      } else {
        const localPath = path.resolve(rUrl.replace(/^\//, ''));
        if (fs.existsSync(localPath) && /\.(jpe?g|png)$/i.test(localPath)) {
          rBuf = fs.readFileSync(localPath);
          rDim = getJpegDimensions(rBuf);
        }
      }

      if (rBuf && rDim.width > 0) {
        receiptImages.push({
          index: rIdx + 1,
          buf: rBuf,
          dim: rDim,
          mime: rMime,
          xobjName: `ImReceipt${rIdx + 1}`,
        });
      }
    } catch (e) {
      console.warn('Receipt image load note for PDF:', e.message);
    }
  }

  // 3. Multi-page pagination management for invoice body
  const invoicePages = [[]];
  let curStream = invoicePages[0];
  let curInvoicePageIdx = 0;

  const headerHeightPt = headerBuf ? (headerDim.height / headerDim.width) * PAGE_WIDTH : 0;
  const footerHeightPt = footerBuf ? (footerDim.height / footerDim.width) * PAGE_WIDTH : 0;

  const TOP_MARGIN_Y = PAGE_HEIGHT - (headerHeightPt > 0 ? headerHeightPt + 14 : 36);
  const BOTTOM_MARGIN_Y = (footerHeightPt > 0 ? footerHeightPt + 24 : 36);

  let curY = TOP_MARGIN_Y;
  let isTableActive = false;

  const colWDesc = USABLE_WIDTH * 0.58;
  const colWTax = USABLE_WIDTH * 0.20;
  const colWAmt = USABLE_WIDTH * 0.22;

  const colXDesc = MARGIN_LEFT;
  const colXTax = colXDesc + colWDesc;
  const colXAmt = colXTax + colWTax;

  const docTypeTitle = voucher.type === 'INVOICE'
    ? 'INVOICE'
    : voucher.type === 'PETTY_CASH'
    ? 'PETTY CASH RECEIPT'
    : 'PAYMENT VOUCHER';

  function addText(text, x, y, font = '/F1', size = 10, r = 0.1, g = 0.1, b = 0.1) {
    const safe = escapePdfText(text);
    curStream.push(
      `BT\n${font} ${size} Tf\n${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n${x.toFixed(2)} ${y.toFixed(2)} Td\n(${safe}) Tj\nET\n`
    );
  }

  function drawRect(x, y, w, h, fill = null, stroke = null, lineWidth = 1) {
    let cmd = 'q\n';
    if (fill) {
      cmd += `${fill.r.toFixed(3)} ${fill.g.toFixed(3)} ${fill.b.toFixed(3)} rg\n`;
    }
    if (stroke) {
      cmd += `${stroke.r.toFixed(3)} ${stroke.g.toFixed(3)} ${stroke.b.toFixed(3)} RG\n${lineWidth} w\n`;
    }
    cmd += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re\n`;
    if (fill && stroke) {
      cmd += 'B\nQ\n';
    } else if (fill) {
      cmd += 'f\nQ\n';
    } else {
      cmd += 'S\nQ\n';
    }
    curStream.push(cmd);
  }

  function drawLine(x1, y1, x2, y2, stroke = { r: 0.8, g: 0.83, b: 0.88 }, lineWidth = 1) {
    curStream.push(
      `q\n${stroke.r.toFixed(3)} ${stroke.g.toFixed(3)} ${stroke.b.toFixed(3)} RG\n${lineWidth} w\n${x1.toFixed(2)} ${y1.toFixed(2)} m\n${x2.toFixed(2)} ${y2.toFixed(2)} l\nS\nQ\n`
    );
  }

  // Automatic page-break sensor
  function ensureSpace(neededHeight = 24) {
    if (curY - neededHeight < BOTTOM_MARGIN_Y) {
      const newPageStream = [];
      invoicePages.push(newPageStream);
      curInvoicePageIdx++;
      curStream = newPageStream;
      curY = TOP_MARGIN_Y;

      // Continuation header at top of next page
      addText(
        `${docTypeTitle}: ${voucher.voucherNumber || ''} (Continued — Page ${curInvoicePageIdx + 1})`,
        MARGIN_LEFT,
        curY - 8,
        '/F2',
        8.5,
        0.35,
        0.42,
        0.52
      );
      curY -= 20;

      // Re-draw table header row if line items are ongoing
      if (isTableActive) {
        const thH = 20;
        drawRect(MARGIN_LEFT, curY - thH, USABLE_WIDTH, thH, { r: 0.94, g: 0.96, b: 0.98 }, { r: 0.80, g: 0.83, b: 0.88 }, 1);
        addText('Item / Description', colXDesc + 8, curY - 14, '/F2', 8.5, 0.09, 0.15, 0.24);
        addText('Sales Tax', colXTax + (colWTax / 2) - 18, curY - 14, '/F2', 8.5, 0.09, 0.15, 0.24);
        addText('Net Amount', colXAmt + colWAmt - 68, curY - 14, '/F2', 8.5, 0.09, 0.15, 0.24);
        curY -= (thH + 2);
      }
    }
  }

  // Draw Bismillah if IIPC (Page 1)
  if (letterheadType === 'iipc' && bismillahBuf) {
    const bW = 180;
    const bH = (bismillahDim.height / bismillahDim.width) * bW;
    const bX = (PAGE_WIDTH - bW) / 2;
    curStream.push(`q\n${bW.toFixed(2)} 0 0 ${bH.toFixed(2)} ${bX.toFixed(2)} ${(curY - bH).toFixed(2)} cm\n/ImBismillah Do\nQ\n`);
    curY -= (bH + 16);
  }

  const payee = voucher.payee || {};
  const payer = voucher.payer || {};
  const items = (voucher.items && voucher.items.length > 0)
    ? voucher.items
    : [{ description: voucher.title || 'General Expense', quantity: 1, unitPrice: voucher.totalAmount || 0, amount: voucher.totalAmount || 0, taxable: true }];

  const subtotal = Number(voucher.subtotal) || items.reduce((acc, it) => acc + (Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0))), 0);
  const taxConfig = voucher.taxConfig || { applyTax: true, rate: 13, taxAmount: 0, taxType: 'HST' };
  const taxRate = Number(taxConfig.rate) || 13;
  const taxAmount = taxConfig.applyTax ? (Number(taxConfig.taxAmount) || (subtotal * (taxRate / 100))) : 0;
  const totalAmount = Number(voucher.totalAmount) || (subtotal + taxAmount);

  // Group items by receipt (Receipt 1, Receipt 2, etc.)
  const receiptGroups = [];
  const receiptGroupMap = new Map();

  for (const it of items) {
    const rNum = Number(it.receiptNumber) || 1;
    let rTitle = it.receiptTitle;
    if (!rTitle) {
      rTitle = it.receiptNumber ? `Receipt ${it.receiptNumber}` : 'General Items';
    }
    const key = `rcp_${rNum}_${rTitle}`;
    if (!receiptGroupMap.has(key)) {
      const newGrp = { number: rNum, title: rTitle, items: [], subtotal: 0 };
      receiptGroupMap.set(key, newGrp);
      receiptGroups.push(newGrp);
    }
    const grp = receiptGroupMap.get(key);
    grp.items.push(it);
    const itAmt = Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0));
    grp.subtotal += itAmt;
  }

  const hasMultipleReceipts = receiptGroups.length > 1;

  // TOP SECTION: Left side Title & Metadata, Right side Payee / Vendor
  const topBlockStartY = curY;

  // Left Title
  addText(docTypeTitle, MARGIN_LEFT, curY, '/F2', 18, 0.18, 0.25, 0.34);
  curY -= 16;
  addText(`Number: ${voucher.voucherNumber || 'VCH-001'}`, MARGIN_LEFT, curY, '/F2', 10.5, 0.1, 0.15, 0.2);
  curY -= 14;
  addText(`Issued: ${voucher.issueDate || new Date().toISOString().split('T')[0]}`, MARGIN_LEFT, curY, '/F1', 9.5, 0.3, 0.35, 0.4);
  curY -= 13;
  if (voucher.dueDate) {
    addText(`Due: ${voucher.dueDate}`, MARGIN_LEFT, curY, '/F1', 9.5, 0.3, 0.35, 0.4);
    curY -= 13;
  }
  if (voucher.title) {
    addText(`Memo: ${voucher.title}`, MARGIN_LEFT, curY, '/F2', 9.5, 0.12, 0.23, 0.54);
    curY -= 14;
  }

  // Right Payee / Vendor Block
  const payeeX = PAGE_WIDTH - MARGIN_RIGHT - 210;
  let payeeY = topBlockStartY;
  if (payee.name) {
    addText(payee.name, payeeX, payeeY, '/F2', 13, 0.09, 0.40, 0.20);
    payeeY -= 14;
  }
  if (payee.address) {
    const pLines = wrapText(payee.address, 32);
    for (const pl of pLines) {
      addText(pl, payeeX, payeeY, '/F1', 8.5, 0.3, 0.35, 0.4);
      payeeY -= 11;
    }
  }
  if (payee.phone) {
    addText(payee.phone, payeeX, payeeY, '/F1', 8.5, 0.3, 0.35, 0.4);
    payeeY -= 11;
  }
  if (payee.email) {
    addText(payee.email, payeeX, payeeY, '/F1', 8.5, 0.3, 0.35, 0.4);
    payeeY -= 11;
  }
  if (payee.gstHstNumber) {
    addText(`GST/HST: ${payee.gstHstNumber}`, payeeX, payeeY, '/F2', 8.5, 0.2, 0.25, 0.3);
    payeeY -= 12;
  }
  if (payee.emtEmail) {
    const emtBoxW = 205;
    const emtBoxH = 18;
    drawRect(payeeX - 4, payeeY - 14, emtBoxW, emtBoxH, { r: 0.94, g: 0.99, b: 0.96 }, { r: 0.73, g: 0.94, b: 0.80 }, 1);
    addText(`Interac EMT: ${payee.emtEmail}`, payeeX, payeeY - 10, '/F2', 8.5, 0.08, 0.50, 0.24);
    payeeY -= 20;
  }

  curY = Math.min(curY, payeeY) - 16;

  // BILL TO / CUSTOMER BOX
  const billBoxW = 250;
  const billLines = [];
  if (payer.name) billLines.push(payer.name);
  if (payer.company) billLines.push(payer.company);
  if (payer.address) {
    const addrWrapped = wrapText(payer.address, 38);
    billLines.push(...addrWrapped);
  }
  if (payer.email) billLines.push(payer.email);

  const billBoxH = 16 + (billLines.length * 12) + 6;
  drawRect(MARGIN_LEFT, curY - billBoxH, billBoxW, billBoxH, { r: 0.98, g: 0.99, b: 1.0 }, { r: 0.80, g: 0.83, b: 0.88 }, 1);

  addText('BILL TO:', MARGIN_LEFT + 10, curY - 14, '/F2', 8.5, 0.12, 0.23, 0.54);
  let bRowY = curY - 26;
  for (let bi = 0; bi < billLines.length; bi++) {
    const isName = (bi === 0);
    addText(billLines[bi], MARGIN_LEFT + 10, bRowY, isName ? '/F2' : '/F1', isName ? 9.5 : 8.5, isName ? 0.06 : 0.25, isName ? 0.09 : 0.3, isName ? 0.16 : 0.35);
    bRowY -= 12;
  }

  curY -= (billBoxH + 20);

  // START LINE ITEMS TABLE
  isTableActive = true;

  // Table Header on Page 1
  const thH = 22;
  drawRect(MARGIN_LEFT, curY - thH, USABLE_WIDTH, thH, { r: 0.94, g: 0.96, b: 0.98 }, { r: 0.80, g: 0.83, b: 0.88 }, 1);
  addText('Item / Description', colXDesc + 8, curY - 15, '/F2', 9, 0.09, 0.15, 0.24);
  addText('Sales Tax', colXTax + (colWTax / 2) - 18, curY - 15, '/F2', 9, 0.09, 0.15, 0.24);
  addText('Net Amount', colXAmt + colWAmt - 68, curY - 15, '/F2', 9, 0.09, 0.15, 0.24);

  curY -= thH;

  // Table Rows (Grouped by Receipt if multiple)
  for (const grp of receiptGroups) {
    if (hasMultipleReceipts) {
      // Ensure space for group banner + at least one item
      ensureSpace(38);

      const gH = 18;
      drawRect(MARGIN_LEFT, curY - gH, USABLE_WIDTH, gH, { r: 0.93, g: 0.96, b: 1.0 }, { r: 0.72, g: 0.84, b: 0.98 }, 1);

      // Clean duplicate "Receipt X:" in title
      const cleanGroupTitle = String(grp.title || '').replace(new RegExp(`^Receipt\\s*${grp.number}:?\\s*`, 'i'), '').trim();
      const displayGroupTitle = `Receipt ${grp.number}: ${cleanGroupTitle || grp.title}`;

      addText(displayGroupTitle, colXDesc + 6, curY - 13, '/F2', 8.5, 0.10, 0.25, 0.55);
      const grpSubStr = `Subtotal: $${formatCurrency(grp.subtotal)}`;
      addText(grpSubStr, colXAmt + colWAmt - 85, curY - 13, '/F2', 8.5, 0.10, 0.25, 0.55);
      curY -= gH;
    }

    for (const it of grp.items) {
      const itAmt = Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0));
      const taxLabel = it.taxable && taxConfig.applyTax ? `${taxConfig.taxType || 'HST'} ${taxRate.toFixed(2)}%` : 'Exempt / 0%';
      const desc = it.description || 'General Service';
      const descWrapped = wrapText(desc, 50);

      const rowH = Math.max(18, descWrapped.length * 12 + 5);
      ensureSpace(rowH);

      // Light border bottom
      drawLine(MARGIN_LEFT, curY - rowH, MARGIN_LEFT + USABLE_WIDTH, curY - rowH, { r: 0.88, g: 0.91, b: 0.94 }, 0.75);

      // Description
      let dY = curY - 13;
      for (const dl of descWrapped) {
        addText(dl, colXDesc + 8, dY, '/F1', 8.5, 0.12, 0.16, 0.22);
        dY -= 11;
      }

      // Tax
      addText(taxLabel, colXTax + (colWTax / 2) - 24, curY - 13, '/F1', 8, 0.35, 0.40, 0.45);

      // Amount
      const amtStr = `$${formatCurrency(itAmt)}`;
      addText(amtStr, colXAmt + colWAmt - 55, curY - 13, '/F2', 8.5, 0.06, 0.09, 0.16);

      curY -= rowH;
    }

    if (hasMultipleReceipts) {
      // Group subtotal row
      ensureSpace(20);
      const subRowH = 16;
      drawLine(colXTax, curY - 1, MARGIN_LEFT + USABLE_WIDTH, curY - 1, { r: 0.75, g: 0.82, b: 0.90 }, 1);
      addText(`Receipt ${grp.number} Subtotal:`, colXTax + 10, curY - 12, '/F2', 8, 0.25, 0.35, 0.45);
      addText(`$${formatCurrency(grp.subtotal)}`, colXAmt + colWAmt - 55, curY - 12, '/F2', 8.5, 0.10, 0.20, 0.35);
      curY -= (subRowH + 4);
    }
  }

  // End of items table
  isTableActive = false;
  curY -= 10;

  // TOTALS SUMMARY BOX (Right Aligned)
  const sumW = 230;
  const sumX = PAGE_WIDTH - MARGIN_RIGHT - sumW;
  const neededTotalsHeight = hasMultipleReceipts ? (receiptGroups.length * 14 + 100) : 95;

  // Auto page break if totals box cannot fit on current page
  ensureSpace(neededTotalsHeight);

  if (hasMultipleReceipts) {
    for (const grp of receiptGroups) {
      const cleanGroupTitle = String(grp.title || '').replace(new RegExp(`^Receipt\\s*${grp.number}:?\\s*`, 'i'), '').trim();
      addText(`Receipt ${grp.number} Subtotal:`, sumX + 8, curY, '/F1', 8.5, 0.30, 0.35, 0.40);
      addText(`$${formatCurrency(grp.subtotal)}`, sumX + sumW - 60, curY, '/F2', 8.5, 0.15, 0.20, 0.25);
      curY -= 13;
    }
    drawLine(sumX + 8, curY - 2, sumX + sumW - 8, curY - 2, { r: 0.85, g: 0.88, b: 0.92 }, 0.75);
    curY -= 6;
    addText('Combined Subtotal:', sumX + 8, curY, '/F2', 9, 0.15, 0.20, 0.25);
    addText(`$${formatCurrency(subtotal)}`, sumX + sumW - 60, curY, '/F2', 9, 0.06, 0.09, 0.16);
    curY -= 15;
  } else {
    addText('Total Net:', sumX + 8, curY, '/F1', 9.5, 0.25, 0.30, 0.35);
    addText(`$${formatCurrency(subtotal)}`, sumX + sumW - 60, curY, '/F2', 9.5, 0.06, 0.09, 0.16);
    curY -= 15;
  }

  // HST
  if (taxConfig.applyTax) {
    addText(`${taxConfig.taxType || 'HST'} ${taxRate.toFixed(2)}%:`, sumX + 8, curY, '/F1', 9.5, 0.25, 0.30, 0.35);
    addText(`$${formatCurrency(taxAmount)}`, sumX + sumW - 60, curY, '/F2', 9.5, 0.06, 0.09, 0.16);
    curY -= 18;
  }

  // TOTAL TO PAY BAR
  const totBarH = 26;
  drawRect(sumX, curY - totBarH, sumW, totBarH, { r: 0.12, g: 0.16, b: 0.23 }, null, 0);
  addText(hasMultipleReceipts ? 'COMBINED TOTAL TO PAY:' : 'TOTAL TO PAY:', sumX + 8, curY - 18, '/F2', 9.5, 1.0, 1.0, 1.0);
  addText(`$${formatCurrency(totalAmount)}`, sumX + sumW - 75, curY - 18, '/F2', 12, 0.29, 0.87, 0.50);

  curY -= (totBarH + 20);

  // TERMS AND CONDITIONS BOX
  const defaultEmtNote = payee.emtEmail ? `Payment can be made through E-transfer ${payee.emtEmail}.` : '';
  const termsText = voucher.termsNotes || `Please arrange payment within 14 days of the invoice date. ${defaultEmtNote} Thank you for your business and have a great day!`;

  const termsWrapped = wrapText(termsText, 88);
  const termsBoxH = 18 + (termsWrapped.length * 12) + 8;

  ensureSpace(termsBoxH + 10);

  drawRect(MARGIN_LEFT, curY - termsBoxH, USABLE_WIDTH, termsBoxH, { r: 0.98, g: 0.99, b: 1.0 }, { r: 0.85, g: 0.88, b: 0.92 }, 1);
  addText('Terms & Payment Instructions:', MARGIN_LEFT + 10, curY - 13, '/F2', 8.5, 0.12, 0.23, 0.54);

  let tY = curY - 25;
  for (const tl of termsWrapped) {
    addText(tl, MARGIN_LEFT + 10, tY, '/F1', 8, 0.3, 0.35, 0.4);
    tY -= 11;
  }

  // Apply Header and Footer to ALL invoice pages
  for (let i = 0; i < invoicePages.length; i++) {
    const pStream = invoicePages[i];
    if (headerBuf) {
      const hY = PAGE_HEIGHT - headerHeightPt;
      pStream.unshift(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${headerHeightPt.toFixed(2)} 0 ${hY.toFixed(2)} cm\n/ImHeader Do\nQ\n`);
    }

    if (footerBuf) {
      pStream.push(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${footerHeightPt.toFixed(2)} 0 0 cm\n/ImFooter Do\nQ\n`);
    }
  }

  // APPENDIX PAGES FOR SUPPORTING RECEIPTS (Each receipt on its own dedicated page)
  const appendixPages = [];
  for (const rcp of receiptImages) {
    if (rcp.buf && rcp.dim.width > 0 && rcp.mime === 'jpeg') {
      const pStream = [];
      appendixPages.push(pStream);

      let pY = PAGE_HEIGHT - 50;
      const addTextP = (text, x, y, font = '/F1', size = 10, r = 0.1, g = 0.1, b = 0.1) => {
        const safe = escapePdfText(text);
        pStream.push(
          `BT\n${font} ${size} Tf\n${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n${x.toFixed(2)} ${y.toFixed(2)} Td\n(${safe}) Tj\nET\n`
        );
      };

      const rawRTitle = (receiptGroups && receiptGroups[rcp.index - 1]?.title) || `Receipt ${rcp.index}`;
      const cleanRTitle = String(rawRTitle).replace(new RegExp(`^Receipt\\s*${rcp.index}:?\\s*`, 'i'), '').trim();
      const rDisplayTitle = cleanRTitle ? `Receipt ${rcp.index}: ${cleanRTitle}` : `Receipt ${rcp.index}`;

      addTextP(`APPENDIX: SUPPORTING RECEIPT ${rcp.index} PHOTO`, MARGIN_LEFT, pY, '/F2', 13, 0.12, 0.23, 0.54);
      pY -= 16;
      addTextP(`Attached for audit trail verification - Voucher #${voucher.voucherNumber || 'Reference'} • ${rDisplayTitle}`, MARGIN_LEFT, pY, '/F1', 9, 0.4, 0.45, 0.5);
      pY -= 20;

      // Draw receipt image box scaled to page
      const maxImgW = USABLE_WIDTH;
      const maxImgH = 620;
      const scale = Math.min(maxImgW / rcp.dim.width, maxImgH / rcp.dim.height, 1);
      const rW = rcp.dim.width * scale;
      const rH = rcp.dim.height * scale;
      const rX = (PAGE_WIDTH - rW) / 2;
      const rY = pY - rH;

      pStream.push(`q\n${rW.toFixed(2)} 0 0 ${rH.toFixed(2)} ${rX.toFixed(2)} ${rY.toFixed(2)} cm\n/${rcp.xobjName} Do\nQ\n`);

      if (footerBuf) {
        pStream.push(`q\n${PAGE_WIDTH.toFixed(2)} 0 0 ${footerHeightPt.toFixed(2)} 0 0 cm\n/ImFooter Do\nQ\n`);
      }
    }
  }

  // Combine invoice pages and appendix pages
  const pages = [...invoicePages, ...appendixPages];

  // 4. Register PDF Objects
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

  const registeredReceiptIds = [];
  for (const rcp of receiptImages) {
    if (rcp.buf && rcp.mime === 'jpeg') {
      const rId = registerObject(
        `<< /Type /XObject /Subtype /Image /Width ${rcp.dim.width} /Height ${rcp.dim.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${rcp.buf.length} >>`,
        rcp.buf
      );
      registeredReceiptIds.push({ name: rcp.xobjName, id: rId });
    }
  }

  let xobjDict = '';
  if (imgHeaderId) xobjDict += `/ImHeader ${imgHeaderId} 0 R `;
  if (imgFooterId) xobjDict += `/ImFooter ${imgFooterId} 0 R `;
  if (imgBismillahId) xobjDict += `/ImBismillah ${imgBismillahId} 0 R `;
  for (const rIdObj of registeredReceiptIds) {
    xobjDict += `/${rIdObj.name} ${rIdObj.id} 0 R `;
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

  const pagesTreeObj = pdfObjects.find((o) => o.id === pagesTreeId);
  if (pagesTreeObj) {
    pagesTreeObj.dict = `<< /Type /Pages /Kids [${pageIds.join(' ')}] /Count ${totalPages} >>`;
  }

  return compilePdfObjects(pdfObjects, catalogId);
}
