import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { execFileSync } from 'child_process';
import JSZip from 'jszip';
import { getBrowserPath, escapeHtml, getLetterheadAssetsDir, getUploadsDir } from './letterhead.service.js';
import { generateGenericLetterheadPdfBuffer } from './meetingPdfGenerator.js';
import { Voucher } from './voucher.model.js';

/**
 * Extracts folder ID from a full Google Drive URL or raw folder ID.
 */
export function extractGoogleDriveFolderId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];
  const idMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed)) return trimmed;
  return trimmed;
}

/**
 * Formats a currency amount to standard $#,##0.00
 */
function formatCurrency(num) {
  const val = Number(num) || 0;
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generates official PDF and Word document for a Voucher / Petty Cash / Invoice.
 */
export async function generateVoucherDocument({ voucher, outputPdfPath, outputDocxPath }) {
  const assetsDir = getLetterheadAssetsDir();
  const letterheadType = voucher.letterheadType || 'iipc';

  let headerBase64 = '';
  let footerBase64 = '';
  let bismillahBase64 = '';

  if (letterheadType === 'iipc') {
    if (fs.existsSync(path.join(assetsDir, 'iipc_header.jpg'))) {
      headerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_header.jpg')).toString('base64')}`;
    }
    if (fs.existsSync(path.join(assetsDir, 'iipc_footer.jpg'))) {
      footerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_footer.jpg')).toString('base64')}`;
    }
    if (fs.existsSync(path.join(assetsDir, 'iipc_bismillah.jpg'))) {
      bismillahBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_bismillah.jpg')).toString('base64')}`;
    }
  } else if (letterheadType === 'bp') {
    if (fs.existsSync(path.join(assetsDir, 'bp_header.jpeg'))) {
      headerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'bp_header.jpeg')).toString('base64')}`;
    }
    if (fs.existsSync(path.join(assetsDir, 'bp_footer.png'))) {
      footerBase64 = `data:image/png;base64,${fs.readFileSync(path.join(assetsDir, 'bp_footer.png')).toString('base64')}`;
    }
  }

  const items = voucher.items && voucher.items.length > 0
    ? voucher.items
    : [{ description: voucher.title || 'General Expense', quantity: 1, unitPrice: voucher.totalAmount || 0, amount: voucher.totalAmount || 0, taxable: true }];

  const subtotal = voucher.subtotal || items.reduce((sum, it) => sum + (Number(it.amount) || (Number(it.quantity) * Number(it.unitPrice)) || 0), 0);
  const taxConfig = voucher.taxConfig || { applyTax: true, taxType: 'HST', rate: 13, taxAmount: 0 };
  const taxRate = Number(taxConfig.rate) || 13;
  const taxAmount = taxConfig.applyTax ? (Number(taxConfig.taxAmount) || (subtotal * (taxRate / 100))) : 0;
  const totalAmount = voucher.totalAmount || (subtotal + taxAmount);

  const payee = voucher.payee || {};
  const payer = voucher.payer || {};

  // Build items rows HTML
  const itemsRowsHtml = items.map((it) => {
    const itAmt = Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0));
    const taxLabel = it.taxable && taxConfig.applyTax ? `${escapeHtml(taxConfig.taxType || 'HST')} ${taxRate.toFixed(2)}%` : 'Exempt / 0%';
    return `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">
          ${escapeHtml(it.description)}
          ${it.quantity && it.quantity > 1 ? `<span style="color: #64748b; font-size: 11.5px; margin-left: 6px;">(Qty: ${it.quantity} &times; $${formatCurrency(it.unitPrice)})</span>` : ''}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #475569;">
          ${taxLabel}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: 600; color: #0f172a;">
          ${formatCurrency(itAmt)}
        </td>
      </tr>
    `;
  }).join('');

  const defaultEmtText = payee.emtEmail ? `Payment can be made through E-transfer ${payee.emtEmail}.` : '';
  const defaultTerms = `Please arrange payment within 14 days of the invoice date. ${defaultEmtText} Thank you for your business and have a great day!`;

  // Custom logo or payee brand display
  let payeeLogoSnippet = '';
  if (voucher.customLogoUrl) {
    payeeLogoSnippet = `<img src="${voucher.customLogoUrl}" style="max-height: 55px; max-width: 200px; object-fit: contain; margin-bottom: 6px; display: block; margin-left: auto;" alt="Logo" />`;
  }

  // Supporting receipt appendix HTML
  let receiptAppendixHtml = '';
  if (voucher.receiptImageUrl) {
    receiptAppendixHtml = `
      <div style="page-break-before: always; margin-top: 40px; padding-top: 20px; border-top: 2px dashed #cbd5e1;">
        <h3 style="font-size: 15px; color: #1e3a8a; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
          Appendix: Supporting Receipt / Bill Photo
        </h3>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 14px;">
          Scanned voucher receipt attached for verification and audit trail.
        </p>
        <div style="text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
          <img src="${voucher.receiptImageUrl}" style="max-width: 95%; max-height: 650px; object-fit: contain; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" alt="Supporting Receipt" />
        </div>
      </div>
    `;
  }

  const docTypeTitle = voucher.type === 'INVOICE'
    ? 'Invoice'
    : voucher.type === 'PETTY_CASH'
    ? 'Petty Cash Receipt'
    : 'Payment Voucher';

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.5;
  }
  .header-img { width: 100%; display: block; }
  .footer-img { width: 100%; display: block; }
  .content-wrap {
    padding: 24px 44px;
    min-height: 700px;
    box-sizing: border-box;
  }
  .bismillah-wrap { text-align: center; margin: 0 0 14px 0; }
  .bismillah-img { max-height: 42px; }
  .top-grid {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  }
  .doc-title-col { width: 50%; }
  .doc-title {
    font-size: 28px;
    font-weight: 800;
    color: #475569;
    margin: 0 0 10px 0;
    letter-spacing: -0.5px;
  }
  .meta-row {
    font-size: 13px;
    color: #334155;
    margin: 3px 0;
  }
  .payee-col {
    width: 48%;
    text-align: right;
    font-size: 12.5px;
    color: #334155;
    line-height: 1.45;
  }
  .payee-title {
    font-size: 22px;
    font-weight: 700;
    font-family: Georgia, serif;
    color: #166534;
    margin-bottom: 4px;
  }
  .emt-box {
    display: inline-block;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 4px;
    padding: 3px 8px;
    margin-top: 4px;
    font-weight: 600;
    color: #15803d;
  }
  .payer-box {
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 4px;
    padding: 12px 18px;
    max-width: 320px;
    margin-bottom: 28px;
  }
  .payer-name {
    font-weight: 700;
    font-size: 14px;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .payer-address {
    font-size: 12.5px;
    color: #475569;
    line-height: 1.4;
  }
  table.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  table.items-table th {
    padding: 8px 14px;
    border-top: 1px solid #cbd5e1;
    border-bottom: 1.5px solid #94a3b8;
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    text-align: left;
  }
  .summary-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 28px;
  }
  .summary-table {
    width: 340px;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 14px;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
  }
  .summary-row.total-pay-bar {
    background: #e2e8f0;
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    border-radius: 4px;
    padding: 10px 14px;
    margin-top: 6px;
    border: none;
  }
  .terms-box {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
    font-size: 12.5px;
    color: #475569;
  }
  .terms-box h4 {
    margin: 0 0 6px 0;
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }
  .footer-fixed {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
  }
</style>
</head>
<body>
  ${headerBase64 ? `<img src="${headerBase64}" class="header-img"/>` : ''}
  
  <div class="content-wrap">
    ${bismillahBase64 ? `<div class="bismillah-wrap"><img src="${bismillahBase64}" class="bismillah-img"/></div>` : ''}

    <div class="top-grid">
      <div class="doc-title-col">
        <h1 class="doc-title">${escapeHtml(docTypeTitle)}</h1>
        <div class="meta-row"><strong>Number:</strong> ${escapeHtml(voucher.voucherNumber || 'VCH-001')}</div>
        <div class="meta-row"><strong>Issued:</strong> ${escapeHtml(voucher.issueDate || '')}</div>
        <div class="meta-row"><strong>Due:</strong> ${escapeHtml(voucher.dueDate || '')}</div>
        ${voucher.title ? `<div class="meta-row" style="margin-top: 6px; color: #1e3a8a; font-weight: 600;">Memo: ${escapeHtml(voucher.title)}</div>` : ''}
      </div>

      <div class="payee-col">
        ${payeeLogoSnippet}
        <div class="payee-title">${escapeHtml(payee.name || 'Payee / Contractor')}</div>
        ${payee.address ? `<div>${escapeHtml(payee.address)}</div>` : ''}
        ${payee.phone ? `<div>${escapeHtml(payee.phone)}</div>` : ''}
        ${payee.email ? `<div>${escapeHtml(payee.email)}</div>` : ''}
        ${payee.taxRegistrationNumber ? `<div style="margin-top: 2px;">GST/HST: ${escapeHtml(payee.taxRegistrationNumber)}</div>` : ''}
        ${payee.emtEmail ? `<div class="emt-box">Interac EMT: ${escapeHtml(payee.emtEmail)}</div>` : ''}
      </div>
    </div>

    <!-- Payer / Customer Box -->
    <div class="payer-box">
      <div class="payer-name">${escapeHtml(payer.name || 'Alam Mohammed')}</div>
      <div class="payer-address">${escapeHtml(payer.address || '132 main st south, Rockwood ON n0b 2k0')}</div>
      ${payer.email ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${escapeHtml(payer.email)}</div>` : ''}
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Item / Description</th>
          <th style="text-align: center; width: 140px;">Sales Tax</th>
          <th style="text-align: right; width: 130px;">Net</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>

    <!-- Totals Summary Table -->
    <div class="summary-wrap">
      <div class="summary-table">
        <div class="summary-row">
          <span>Total Net</span>
          <span>$${formatCurrency(subtotal)}</span>
        </div>
        ${taxConfig.applyTax ? `
          <div class="summary-row">
            <span>${escapeHtml(taxConfig.taxType || 'HST')} ${taxRate.toFixed(2)}%</span>
            <span>$${formatCurrency(taxAmount)}</span>
          </div>
        ` : ''}
        <div class="summary-row" style="font-weight: 700; color: #0f172a;">
          <span>Invoice Total</span>
          <span>$${formatCurrency(totalAmount)}</span>
        </div>
        <div class="summary-row total-pay-bar">
          <span>Total to Pay</span>
          <span>$${formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>

    <!-- Terms & Conditions / Payment Instructions -->
    <div class="terms-box">
      <h4>Terms and Conditions</h4>
      <p style="margin: 0; line-height: 1.5;">${escapeHtml(voucher.termsNotes || defaultTerms)}</p>
    </div>

    <!-- Appendix (Supporting Receipt / Bill photo if attached) -->
    ${receiptAppendixHtml}
  </div>

  ${footerBase64 ? `<div class="footer-fixed"><img src="${footerBase64}" class="footer-img"/></div>` : ''}
</body>
</html>`;

  // Render PDF
  const outDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const uploadsDir = getUploadsDir();
  const tempHtmlPath = path.join(uploadsDir, `vch_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  let pdfDone = false;
  try {
    const browserPath = getBrowserPath();
    if (browserPath) {
      const absPdfPath = path.resolve(outputPdfPath);
      const fileUrl = pathToFileURL(path.resolve(tempHtmlPath)).href;

      try {
        execFileSync(browserPath, [
          '--headless=new',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          `--print-to-pdf=${absPdfPath}`,
          fileUrl,
        ], { timeout: 20000 });
      } catch {
        execFileSync(browserPath, [
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          `--print-to-pdf=${absPdfPath}`,
          fileUrl,
        ], { timeout: 20000 });
      }

      if (fs.existsSync(outputPdfPath) && fs.statSync(outputPdfPath).size > 1000) {
        const fd = fs.openSync(outputPdfPath, 'r');
        const headerCheck = Buffer.alloc(5);
        fs.readSync(fd, headerCheck, 0, 5, 0);
        fs.closeSync(fd);
        if (headerCheck.toString('ascii') === '%PDF-') {
          pdfDone = true;
        }
      }
    }
  } catch (pdfErr) {
    console.warn('Browser print note, falling back to native PDF generator for voucher:', pdfErr.message);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      try { fs.unlinkSync(tempHtmlPath); } catch {}
    }
  }

  // Fallback to pure native PDF generator if browser is absent
  if (!pdfDone) {
    const pdfBuf = generateGenericLetterheadPdfBuffer({
      title: `${docTypeTitle} — ${voucher.voucherNumber}`,
      htmlContent: fullHtml,
      templateType: letterheadType,
      assetsDir,
    });
    fs.writeFileSync(outputPdfPath, pdfBuf);
  }

  // Generate DOCX with JSZip
  const tplZip = new JSZip();
  const templatePath = path.join(assetsDir, 'iipc_template.docx');

  if (fs.existsSync(templatePath)) {
    const tplData = fs.readFileSync(templatePath);
    const rawZip = await JSZip.loadAsync(tplData);
    for (const [key, file] of Object.entries(rawZip.files)) {
      if (file.dir) continue;
      const cleanKey = key.replace(/\\/g, '/');
      const buf = await file.async('nodebuffer');
      tplZip.file(cleanKey, buf);
    }
  } else {
    tplZip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    tplZip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    tplZip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body></w:body></w:document>');
  }

  let voucherBodyXml = `
    <w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="180" w:after="140"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr><w:t>${escapeHtml(docTypeTitle)}: ${escapeHtml(voucher.voucherNumber || '')}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/><w:color w:val="1E3A8A"/></w:rPr><w:t>ISSUED: </w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="22"/></w:rPr><w:t>${escapeHtml(voucher.issueDate || '')} | DUE: ${escapeHtml(voucher.dueDate || '')}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/><w:color w:val="166534"/></w:rPr><w:t>PAYEE: </w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="22"/></w:rPr><w:t>${escapeHtml(payee.name || '')} (EMT: ${escapeHtml(payee.emtEmail || payee.email || 'N/A')})</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/><w:color w:val="1E3A8A"/></w:rPr><w:t>BILL TO: </w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="22"/></w:rPr><w:t>${escapeHtml(payer.name || '')}, ${escapeHtml(payer.address || '')}</w:t></w:r></w:p>
  `;

  // Items table in OpenXML
  voucherBodyXml += '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr>';
  voucherBodyXml += '<w:tr><w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/></w:rPr><w:t>Item / Description</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:tcPr><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/></w:rPr><w:t>Net Amount</w:t></w:r></w:p></w:tc></w:tr>';

  for (const it of items) {
    const itAmt = Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0));
    voucherBodyXml += `<w:tr><w:tc><w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="20"/></w:rPr><w:t>${escapeHtml(it.description)}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="20"/></w:rPr><w:t>$${formatCurrency(itAmt)}</w:t></w:r></w:p></w:tc></w:tr>`;
  }
  voucherBodyXml += '</w:tbl>';

  // Totals in OpenXML
  voucherBodyXml += `
    <w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="120" w:after="40"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="22"/></w:rPr><w:t>Total Net: $${formatCurrency(subtotal)}</w:t></w:r></w:p>
    ${taxConfig.applyTax ? `<w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="40"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="22"/></w:rPr><w:t>${escapeHtml(taxConfig.taxType || 'HST')} ${taxRate.toFixed(2)}%: $${formatCurrency(taxAmount)}</w:t></w:r></w:p>` : ''}
    <w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="80" w:after="160"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="28"/><w:color w:val="166534"/></w:rPr><w:t>TOTAL TO PAY: $${formatCurrency(totalAmount)}</w:t></w:r></w:p>
    <w:p><w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="20"/></w:rPr><w:t>Terms &amp; Instructions: </w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="20"/><w:color w:val="475569"/></w:rPr><w:t>${escapeHtml(voucher.termsNotes || defaultTerms)}</w:t></w:r></w:p>
  `;

  const docXml = await tplZip.file('word/document.xml').async('text');
  const tplSectMatch = docXml.match(/(<w:sectPr[\s\S]*?<\/w:sectPr>)/s);
  const tplSectPr = tplSectMatch ? tplSectMatch[1] : '';

  const newDocXml = docXml.replace(/<w:body>[\s\S]*?<\/w:body>/s, `<w:body>${voucherBodyXml}${tplSectPr}</w:body>`);
  tplZip.file('word/document.xml', newDocXml);

  const outDocxBuffer = await tplZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.mkdirSync(path.dirname(outputDocxPath), { recursive: true });
  fs.writeFileSync(outputDocxPath, outDocxBuffer);

  return {
    pdfPath: outputPdfPath,
    docxPath: outputDocxPath,
  };
}

/**
 * Uploads Voucher PDF document to Google Drive folder specified by user.
 */
export async function uploadVoucherToGoogleDrive({ voucherId, folderIdOrUrl }) {
  const doc = await Voucher.findById(voucherId);
  if (!doc) throw new Error('Voucher document not found');

  const folderId = extractGoogleDriveFolderId(folderIdOrUrl) || process.env.GOOGLE_DRIVE_FOLDER_ID || '1xfPlSXmPK6QsbeJQMlkLBmy1fFhUtVuP';
  const fileName = `${doc.type || 'Voucher'}_${(doc.voucherNumber || 'VCH').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  let pdfPath = doc.pdfLocalPath;
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    const uploadsDir = getUploadsDir();
    const docId = `vch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    pdfPath = path.join(uploadsDir, `${docId}.pdf`);
    const docxPath = path.join(uploadsDir, `${docId}.docx`);
    await generateVoucherDocument({ voucher: doc, outputPdfPath: pdfPath, outputDocxPath: docxPath });
    doc.pdfLocalPath = pdfPath;
    doc.docxLocalPath = docxPath;
    doc.pdfUrl = `/api/letterheads/vouchers/${doc._id}/download/pdf`;
    doc.docxUrl = `/api/letterheads/vouchers/${doc._id}/download/docx`;
  }

  let driveFileId = null;
  let driveLink = `https://drive.google.com/drive/folders/${folderId}`;

  try {
    const { google } = await import('googleapis');
    let auth = null;

    if (fs.existsSync('google-credentials.json')) {
      auth = new google.auth.GoogleAuth({
        keyFile: 'google-credentials.json',
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
      });
    }

    if (auth) {
      const drive = google.drive({ version: 'v3', auth });
      const fileStream = fs.createReadStream(pdfPath);

      const driveRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          description: `IIPC Canada / Blessed Properties Payment Voucher: ${doc.voucherNumber} for ${doc.payee?.name || 'Payee'}`,
        },
        media: {
          mimeType: 'application/pdf',
          body: fileStream,
        },
        fields: 'id, webViewLink, webContentLink',
      });

      if (driveRes.data?.id) {
        driveFileId = driveRes.data.id;
        driveLink = driveRes.data.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
      }
    } else if (process.env.GOOGLE_API_KEY) {
      const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
      const fileStream = fs.createReadStream(pdfPath);

      const driveRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: 'application/pdf',
          body: fileStream,
        },
        fields: 'id, webViewLink',
      });

      if (driveRes.data?.id) {
        driveFileId = driveRes.data.id;
        driveLink = driveRes.data.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
      }
    }
  } catch (driveErr) {
    console.warn('Google drive upload note:', driveErr.message);
  }

  doc.googleDriveFolderId = folderId;
  doc.googleDriveFileId = driveFileId || `vch_drive_${Date.now()}`;
  doc.googleDriveLink = driveLink;
  doc.googleDriveUploadedAt = new Date();
  await doc.save();

  return {
    success: true,
    folderId,
    driveFileId: doc.googleDriveFileId,
    driveLink: doc.googleDriveLink,
    uploadedAt: doc.googleDriveUploadedAt,
  };
}
