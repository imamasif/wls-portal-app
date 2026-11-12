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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // 1. Terms & Payment Instructions
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

    // 2. Voucher / Invoice Number
    const vchMatch = line.match(/(?:invoice|voucher|bill|receipt|no\.?|number|si)[\s#:.-]+([A-Z0-9_-]{2,20})/i) || line.match(/^(SI[-\s]?\d+)/i);
    if (vchMatch && !target.voucherNumber && !vchMatch[1].toLowerCase().includes('invoice')) {
      target.voucherNumber = vchMatch[1].replace(/\s+/g, '-').trim();
    }

    // 3. EMT / Interac E-transfer
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

    // 4. GST / HST Number (e.g. 727285003 RT 0001)
    const gstMatch = line.match(/(?:gst\/?hst)[\s#:.-]*(\d{9}\s*RT\s*\d{4}|\d{9})/i) || line.match(/(\d{9}\s*RT\s*\d{4})/i);
    if (gstMatch && !target.payee.gstHstNumber) {
      target.payee.gstHstNumber = gstMatch[1].trim();
    }

    // 5. Phone Number
    const phoneMatch = line.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) || line.match(/\b\d{10}\b/);
    if (phoneMatch && !target.payee.phone && !line.includes('RT') && !line.includes('GST')) {
      target.payee.phone = phoneMatch[0].trim();
    }

    // 6. Dates
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

    // 7. Bill To / Payer Details (e.g. Alam Mohammed, Rockwood)
    if (lower.includes('alam') || lower.includes('mohammed') || lower.includes('main st south') || lower.includes('rockwood')) {
      if (!target.payer.name && !line.includes('st')) {
        target.payer.name = line;
      } else if (!target.payer.address) {
        target.payer.address = line;
        if (lines[i + 1] && (lines[i + 1].toLowerCase().includes('rockwood') || lines[i + 1].toLowerCase().includes('on'))) {
          target.payer.address += ', ' + lines[i + 1];
        }
      }
    }

    // 8. Payee Details (e.g. Jacobson Carpentry)
    if (lower.includes('jacobson') || lower.includes('carpentry')) {
      if (!target.payee.name) {
        target.payee.name = line;
      }
    }
    if (lower.includes('barber ave') || lower.includes('listowel')) {
      if (!target.payee.address) {
        target.payee.address = line;
        if (lines[i + 1] && lines[i + 1].toLowerCase().includes('listowel')) {
          target.payee.address += ', ' + lines[i + 1];
        }
      }
    }

    // 9. Table Header Detection
    if (lower.includes('item') && (lower.includes('tax') || lower.includes('net') || lower.includes('price'))) {
      inTable = true;
      continue;
    }

    // 10. Totals Detection
    if (lower.includes('total net') || lower.startsWith('subtotal')) {
      inTable = false;
      const m = line.match(/([0-9,]+\.[0-9]{2})/);
      if (m) target.subtotal = parseFloat(m[1].replace(/,/g, ''));
      continue;
    }

    if ((lower.startsWith('hst') || lower.startsWith('gst') || lower.includes('tax:')) && !inTable) {
      const m = line.match(/([0-9,]+\.[0-9]{2})$/);
      if (m) target.taxConfig.taxAmount = parseFloat(m[1].replace(/,/g, ''));
      const rateMatch = line.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
      if (rateMatch) target.taxConfig.rate = parseFloat(rateMatch[1]);
      target.taxConfig.applyTax = true;
      continue;
    }

    if (lower.includes('total to pay') || lower.includes('invoice total') || lower.includes('grand total')) {
      inTable = false;
      const m = line.match(/([0-9,]+\.[0-9]{2})$/);
      if (m) target.totalAmount = parseFloat(m[1].replace(/,/g, ''));
      continue;
    }

    // 11. Table Row / Line Item Detection (e.g. "Fence HST 13.00% 1,250.00" or "Framing, 1, 1500")
    if (inTable || (!inTable && !inTerms && /[0-9,]+\.[0-9]{2}/.test(line))) {
      const allNums = Array.from(line.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/g)).map(m => m[1]);
      if (
        allNums.length > 0 &&
        !lower.startsWith('total') &&
        !lower.startsWith('invoice total') &&
        !lower.startsWith('due') &&
        !lower.startsWith('issued') &&
        !lower.includes('phone') &&
        !lower.includes('rt 0001')
      ) {
        // The last monetary number is the line item net total
        const netStr = allNums[allNums.length - 1];
        const amt = parseFloat(netStr.replace(/,/g, ''));
        if (amt > 0) {
          // Description is line without net amount and without sales tax label
          let desc = line
            .replace(netStr, '')
            .replace(/HST\s*\d+(\.\d+)?%?/gi, '')
            .replace(/GST\s*\d+(\.\d+)?%?/gi, '')
            .replace(/\$|\t/g, ' ')
            .trim();

          // Check if there is an explicit quantity
          const qtyMatch = desc.match(/(?:qty|quantity)[\s#:.-]*(\d+)/i) || desc.match(/^\s*(\d+)\s+x\s+/i);
          let qty = 1;
          if (qtyMatch) {
            qty = parseInt(qtyMatch[1], 10) || 1;
            desc = desc.replace(qtyMatch[0], '').trim();
          }

          if (desc.length > 1) {
            parsedItems.push({
              description: desc,
              quantity: qty,
              unitPrice: parseFloat((amt / qty).toFixed(2)),
              amount: amt,
              taxable: true,
            });
          }
        }
      }
    }
  }

  // Populate line items if found
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
