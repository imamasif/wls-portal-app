import JSZip from 'jszip';
import Tesseract from 'tesseract.js';

let pdfjsCache = null;
async function getPdfJs() {
  if (pdfjsCache) return pdfjsCache;
  try {
    const mod = await import('pdfjs-dist');
    pdfjsCache = mod.default || mod;
    if (pdfjsCache.GlobalWorkerOptions) {
      pdfjsCache.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  } catch (err) {
    console.warn('pdfjs-dist load failed:', err);
  }
  return pdfjsCache;
}

/**
 * Normalizes and extracts data from text lines, CSV rows, or sheet cells.
 */
export async function scanVoucherFile(file, onProgress) {
  if (!file) throw new Error('No file provided');

  const fileType = file.type || '';
  const fileName = file.name || '';
  const lowerName = fileName.toLowerCase();

  const result = {
    fileName,
    voucherNumber: '',
    title: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    payee: {
      name: '',
      email: '',
      emtEmail: '',
      phone: '',
      address: '',
      gstHstNumber: '',
    },
    payer: {
      name: '',
      company: '',
      address: '',
      email: '',
    },
    items: [],
    taxConfig: {
      applyTax: true,
      taxType: 'HST',
      rate: 13,
      taxAmount: 0,
    },
    subtotal: 0,
    totalAmount: 0,
    termsNotes: '',
    receiptImageUrl: null,
    receiptFile: null,
    rawText: '',
  };

  // 1. IMAGE FILE (.png, .jpg, .jpeg, .webp, .bmp)
  if (fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lowerName)) {
    result.receiptFile = file;
    const dataUrl = await readFileAsDataUrl(file);
    result.receiptImageUrl = dataUrl;

    // Run Tesseract OCR on the image
    try {
      if (onProgress) onProgress({ status: 'ocr', progress: 0.2 });
      const ocrResult = await Tesseract.recognize(dataUrl, 'eng', {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            onProgress({ status: 'ocr', progress: m.progress });
          }
        },
      });

      const ocrText = ocrResult?.data?.text || '';
      result.rawText = ocrText;
      parseTextIntoVoucher(ocrText, result);
    } catch (ocrErr) {
      console.warn('OCR error during image scan:', ocrErr);
    }

    if (!result.voucherNumber) {
      const numMatch = fileName.match(/(SI[-\s_]?\d+|INV[-\s_]?\d+|VCH[-\s_]?\d+|\b\d{4,8}\b)/i);
      if (numMatch) {
        result.voucherNumber = numMatch[0].replace(/[\s_]/g, '-').toUpperCase();
      } else {
        result.voucherNumber = `VCH-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    return result;
  }

  // 2. PDF FILE (.pdf)
  if (fileType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    try {
      const pdfText = await extractPdfText(file);
      result.rawText = pdfText;
      parseTextIntoVoucher(pdfText, result);
      return result;
    } catch (err) {
      console.warn('PDF parsing note:', err);
    }
  }

  // 3. EXCEL FILE (.xlsx)
  if (lowerName.endsWith('.xlsx')) {
    try {
      const extractedText = await parseXlsxToText(file);
      result.rawText = extractedText;
      parseTextIntoVoucher(extractedText, result);
      return result;
    } catch (err) {
      console.warn('XLSX parsing note:', err);
    }
  }

  // 4. TEXT OR CSV FILE (.txt, .csv, etc.)
  const textContent = await readFileAsText(file);
  result.rawText = textContent;
  parseTextIntoVoucher(textContent, result);

  return result;
}

/**
 * Helper: Identifies summary, total, tax, or non-item header lines.
 */
function isSummaryOrHeaderLine(line) {
  const l = line.toLowerCase().trim();
  if (!l) return true;
  return (
    l.startsWith('subtotal') ||
    l.startsWith('sub-total') ||
    l.startsWith('sub total') ||
    l.startsWith('total net') ||
    l.startsWith('grand total') ||
    l.startsWith('invoice total') ||
    l.startsWith('total to pay') ||
    l.startsWith('amount due') ||
    l.startsWith('balance due') ||
    l.startsWith('balance') ||
    l.startsWith('amount paid') ||
    l.startsWith('tender') ||
    l.startsWith('change due') ||
    l.startsWith('change:') ||
    l.startsWith('payment') ||
    l.startsWith('terms') ||
    l.startsWith('bill to') ||
    l.startsWith('billed to') ||
    l.startsWith('customer') ||
    l.startsWith('client') ||
    l.startsWith('invoice') ||
    l.startsWith('voucher') ||
    l.startsWith('receipt') ||
    l.startsWith('date') ||
    l.startsWith('time') ||
    l.startsWith('tel') ||
    l.startsWith('phone') ||
    l.startsWith('fax') ||
    l.startsWith('store') ||
    l.startsWith('gst') ||
    l.startsWith('hst') ||
    l.startsWith('pst') ||
    l.startsWith('tax') ||
    l.includes('rt 0001') ||
    l.includes('interac') ||
    l.includes('visa') ||
    l.includes('mastercard') ||
    l.includes('debit') ||
    l.includes('cash') ||
    /^(?:description|item|qty|quantity|amount|price|rate|net|total)\b/i.test(l)
  );
}

/**
 * Parses raw text, OCR, or CSV strings and extracts voucher fields.
 */
export function parseTextIntoVoucher(text, target = {}) {
  if (!text) return target;

  if (!target.payee) target.payee = {};
  if (!target.payer) target.payer = {};
  if (!target.taxConfig) target.taxConfig = { applyTax: true, rate: 13, taxAmount: 0, taxType: 'HST' };
  if (!Array.isArray(target.items)) target.items = [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsedItems = [];
  let inTerms = false;
  let inTable = false;
  const termsLines = [];

  // 1. Generic Payee / Vendor Name Detection (top 1-4 lines)
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const l = lines[i];
    const low = l.toLowerCase();
    if (
      !target.payee.name &&
      !low.includes('invoice') &&
      !low.includes('receipt') &&
      !low.includes('welcome') &&
      !low.includes('tax') &&
      !low.includes('gst') &&
      !low.includes('date') &&
      !low.includes('store') &&
      !/^\d+/.test(l) &&
      /[a-zA-Z]{3,}/.test(l)
    ) {
      target.payee.name = l.replace(/^[*#\s]+/, '').trim();
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Terms & Payment Instructions
    if (lower.startsWith('terms') || lower.includes('conditions:')) {
      inTerms = true;
      inTable = false;
      continue;
    }
    if (inTerms) {
      termsLines.push(line);
      const emt = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emt && !target.payee.emtEmail) {
        target.payee.emtEmail = emt[1].trim();
      }
      continue;
    }

    // Voucher / Invoice Number
    const vchMatch = line.match(/(?:invoice|voucher|bill|receipt|no\.?|number|si)[\s#:.-]+([A-Z0-9_-]{2,20})/i) || line.match(/^(SI[-\s]?\d+)/i);
    if (vchMatch && !target.voucherNumber && !vchMatch[1].toLowerCase().includes('invoice')) {
      target.voucherNumber = vchMatch[1].replace(/\s+/g, '-').trim();
    }

    // EMT / Interac E-transfer Email
    const emtMatch = line.match(/(?:e-?transfer|emt|interac|pay(?:ment)? to)[\s#:.-]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emtMatch) {
      target.payee.emtEmail = emtMatch[1].trim();
    } else {
      const generalEmail = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (generalEmail && !target.payee.email) {
        const em = generalEmail[1].trim();
        target.payee.email = em;
        if (!target.payee.emtEmail) target.payee.emtEmail = em;
      }
    }

    // GST / HST Number (e.g. 727285003 RT 0001)
    const gstMatch = line.match(/(?:gst\/?hst)[\s#:.-]*(\d{9}\s*RT\s*\d{4}|\d{9})/i) || line.match(/(\d{9}\s*RT\s*\d{4})/i);
    if (gstMatch && !target.payee.gstHstNumber) {
      target.payee.gstHstNumber = gstMatch[1].trim();
    }

    // Phone Number
    const phoneMatch = line.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) || line.match(/\b\d{10}\b/);
    if (phoneMatch && !target.payee.phone && !line.includes('RT') && !line.includes('GST')) {
      target.payee.phone = phoneMatch[0].trim();
    }

    // Dates
    const issueDateMatch = line.match(/(?:issued?|date|created)[\s#:.-]+(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i);
    if (issueDateMatch && !target.issueDate) {
      const parsedD = new Date(issueDateMatch[1]);
      if (!isNaN(parsedD.getTime())) {
        target.issueDate = parsedD.toISOString().split('T')[0];
      }
    }

    const dueDateMatch = line.match(/(?:due(?: date)?)[\s#:.-]+(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i);
    if (dueDateMatch && !target.dueDate) {
      const parsedDue = new Date(dueDateMatch[1]);
      if (!isNaN(parsedDue.getTime())) {
        target.dueDate = parsedDue.toISOString().split('T')[0];
      }
    }

    // Bill To / Payer Details
    if (lower.startsWith('bill to') || lower.startsWith('billed to') || lower.startsWith('customer:')) {
      const payerVal = line.replace(/^(?:bill to|billed to|customer:)[\s#:.-]*/i, '').trim();
      if (payerVal) target.payer.name = payerVal;
    }

    // Subtotal Detection
    if (lower.includes('subtotal') || lower.includes('sub-total') || lower.includes('total net')) {
      inTable = false;
      const m = line.match(/([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})/);
      if (m) target.subtotal = parseFloat(m[1].replace(/,/g, ''));
      continue;
    }

    // Tax Detection
    if ((lower.startsWith('hst') || lower.startsWith('gst') || lower.includes('tax:')) && !inTable) {
      const m = line.match(/([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})$/);
      if (m) target.taxConfig.taxAmount = parseFloat(m[1].replace(/,/g, ''));
      const rateMatch = line.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
      if (rateMatch) target.taxConfig.rate = parseFloat(rateMatch[1]);
      target.taxConfig.applyTax = true;
      continue;
    }

    // Total Amount Detection
    if (lower.includes('total') && (lower.includes('invoice') || lower.includes('grand') || lower.includes('total to pay') || lower.startsWith('total'))) {
      inTable = false;
      const m = line.match(/([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})/);
      if (m) target.totalAmount = parseFloat(m[1].replace(/,/g, ''));
      continue;
    }

    // Skip summary, headers, and metadata lines from becoming line items
    if (isSummaryOrHeaderLine(line)) {
      continue;
    }

    // LINE ITEM EXTRACTION:
    // Pattern A: Line contains Description AND an amount
    const amtMatches = Array.from(line.matchAll(/([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})/g)).map(m => m[1]);
    if (amtMatches.length > 0) {
      const lastAmtStr = amtMatches[amtMatches.length - 1];
      const amt = parseFloat(lastAmtStr.replace(/,/g, ''));

      if (amt > 0) {
        let desc = line
          .replace(lastAmtStr, '')
          .replace(/(?:^|\s)[$S](?=\s*\d)/g, ' ')
          .replace(/[$]/g, '')
          .replace(/\bHST\s*\d+(\.\d+)?%?/gi, '')
          .replace(/\bGST\s*\d+(\.\d+)?%?/gi, '')
          .trim();

        let qty = 1;
        const qtyMatch = desc.match(/^\s*(\d+)\s*[xX]\s+/i) || desc.match(/(?:qty|quantity)[\s#:.-]*(\d+)/i);
        if (qtyMatch) {
          qty = parseInt(qtyMatch[1], 10) || 1;
          desc = desc.replace(qtyMatch[0], '').trim();
        }

        if (desc.length >= 2 && !/^(?:total|subtotal|tax|hst|gst)$/i.test(desc)) {
          parsedItems.push({
            description: desc,
            quantity: qty,
            unitPrice: parseFloat((amt / qty).toFixed(2)),
            amount: amt,
            taxable: true,
          });
          continue;
        }
      }
    }

    // Pattern B: Description on line i, Amount on line i+1 (e.g. gas, food, or store receipts)
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1].trim();
      const nextAmtMatch = nextLine.match(/^[$S]?\s*([0-9]{1,4}(?:,[0-9]{3})*\.[0-9]{2})$/);
      if (nextAmtMatch) {
        const amt = parseFloat(nextAmtMatch[1].replace(/,/g, ''));
        if (amt > 0 && line.length >= 2 && !isSummaryOrHeaderLine(line)) {
          parsedItems.push({
            description: line.replace(/[$]/g, '').trim(),
            quantity: 1,
            unitPrice: amt,
            amount: amt,
            taxable: true,
          });
          i++; // skip next line as it was consumed as amount
          continue;
        }
      }
    }
  }

  // Fallback: If no individual line items could be parsed, but total or vendor exists
  if (parsedItems.length === 0 && (target.totalAmount > 0 || target.subtotal > 0)) {
    const amt = target.subtotal || target.totalAmount;
    parsedItems.push({
      description: target.payee?.name ? `${target.payee.name} - Receipt Expense` : 'Receipt Expense',
      quantity: 1,
      unitPrice: amt,
      amount: amt,
      taxable: true,
    });
  }

  // Populate line items
  if (parsedItems.length > 0) {
    target.items = parsedItems;
  }

  // Terms and conditions
  if (termsLines.length > 0 && !target.termsNotes) {
    target.termsNotes = termsLines.join(' ');
  } else if (!target.termsNotes && target.payee?.emtEmail) {
    target.termsNotes = `Payment can be made through Interac E-transfer: ${target.payee.emtEmail}. Please quote voucher #${target.voucherNumber || 'reference'}.`;
  }

  // Calculate subtotal & grand total if not directly provided
  if (target.items.length > 0) {
    const calcSub = target.items.reduce((acc, it) => acc + (Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0))), 0);
    if (!target.subtotal || target.subtotal === 0) {
      target.subtotal = parseFloat(calcSub.toFixed(2));
    }
  }

  const taxRate = Number(target.taxConfig?.rate) || 13;
  if (!target.taxConfig.taxAmount && target.taxConfig.applyTax && target.subtotal > 0) {
    target.taxConfig.taxAmount = parseFloat((target.subtotal * (taxRate / 100)).toFixed(2));
  }

  if (!target.totalAmount || target.totalAmount === 0) {
    target.totalAmount = target.taxConfig.applyTax
      ? parseFloat(((target.subtotal || 0) + (target.taxConfig.taxAmount || 0)).toFixed(2))
      : target.subtotal;
  }

  if (!target.title && target.items[0]?.description) {
    target.title = target.items[0].description;
  }

  return target;
}

/**
 * Extracts plain text from a PDF file using pdfjs-dist.
 */
async function extractPdfText(file) {
  const pdfjs = await getPdfJs();
  if (!pdfjs) return '';
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(it => it.str);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

/**
 * Extracts plain text from an .xlsx workbook using JSZip.
 */
async function parseXlsxToText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const sharedStrings = [];
  const sharedStrFile = zip.file('xl/sharedStrings.xml');
  if (sharedStrFile) {
    const xml = await sharedStrFile.async('text');
    const matches = xml.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
    for (const m of matches) {
      const inner = m.replace(/<[^>]+>/g, '');
      sharedStrings.push(inner);
    }
  }

  const sheetFile = zip.file('xl/worksheets/sheet1.xml') || zip.file(/^xl\/worksheets\/sheet.*\.xml$/i)[0];
  if (!sheetFile) return '';

  const sheetXml = await sheetFile.async('text');
  const rowMatches = sheetXml.match(/<row[^>]*>([\s\S]*?)<\/row>/g) || [];
  const extractedLines = [];

  for (const row of rowMatches) {
    const cellMatches = row.match(/<c[^>]*>(?:<v>([\s\S]*?)<\/v>)?<\/c>/g) || [];
    const rowValues = [];
    for (const cell of cellMatches) {
      const isShared = cell.includes('t="s"');
      const valMatch = cell.match(/<v>([\s\S]*?)<\/v>/);
      if (valMatch) {
        const val = valMatch[1].trim();
        if (isShared) {
          const idx = parseInt(val, 10);
          rowValues.push(sharedStrings[idx] || val);
        } else {
          rowValues.push(val);
        }
      }
    }
    if (rowValues.length > 0) {
      extractedLines.push(rowValues.join('\t'));
    }
  }

  return extractedLines.join('\n');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
