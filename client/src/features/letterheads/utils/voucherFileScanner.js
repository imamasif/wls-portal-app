import JSZip from 'jszip';

/**
 * Normalizes and extracts data from text lines, CSV rows, or sheet cells.
 */
export async function scanVoucherFile(file) {
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

  // 1. IMAGE FILE (.png, .jpg, .jpeg, .webp)
  if (fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lowerName)) {
    result.receiptFile = file;
    result.receiptImageUrl = await readFileAsDataUrl(file);
    result.title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    // Guess number from filename if present
    const numMatch = fileName.match(/(SI[-\s_]?\d+|INV[-\s_]?\d+|VCH[-\s_]?\d+|\b\d{4,8}\b)/i);
    if (numMatch) {
      result.voucherNumber = numMatch[0].replace(/[\s_]/g, '-').toUpperCase();
    } else {
      result.voucherNumber = `VCH-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    result.termsNotes = 'Scanned invoice / receipt attached as supporting proof.';
    return result;
  }

  // 2. EXCEL FILE (.xlsx)
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

  // 3. TEXT OR CSV FILE (.txt, .csv, etc.)
  const textContent = await readFileAsText(file);
  result.rawText = textContent;
  parseTextIntoVoucher(textContent, result);

  return result;
}

/**
 * Parses raw text or CSV strings and extracts voucher fields.
 */
export function parseTextIntoVoucher(text, target = {}) {
  if (!text) return target;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let currentSection = '';
  const parsedItems = [];
  let foundEmt = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Voucher / Invoice Number
    const vchMatch = line.match(/(?:invoice|voucher|bill|receipt|no\.?|number|si)[\s#:.-]+([A-Z0-9_-]{2,20})/i);
    if (vchMatch && !target.voucherNumber) {
      target.voucherNumber = vchMatch[1].trim();
    }

    // Detect EMT / Interac E-transfer
    const emtMatch = line.match(/(?:e-?transfer|emt|interac|pay(?:ment)? to)[\s#:.-]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emtMatch) {
      target.payee.emtEmail = emtMatch[1].trim();
      foundEmt = true;
    } else {
      const generalEmail = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (generalEmail && !target.payee.email) {
        target.payee.email = generalEmail[1].trim();
        if (!target.payee.emtEmail) target.payee.emtEmail = generalEmail[1].trim();
      }
    }

    // Detect GST / HST Number (e.g. 727285003 RT 0001)
    const gstMatch = line.match(/(?:gst|hst|tax reg)[\s/:]*(\d{9}\s*RT\s*\d{4}|\d{9})/i);
    if (gstMatch) {
      target.payee.gstHstNumber = gstMatch[1].trim();
    }

    // Detect Phone Number
    const phoneMatch = line.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch && !target.payee.phone) {
      target.payee.phone = phoneMatch[0].trim();
    }

    // Detect Issue Date
    const issueDateMatch = line.match(/(?:issued?|date|created)[\s#:.-]+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|[A-Za-z]+ \d{1,2},? \d{4})/i);
    if (issueDateMatch && !target.issueDate) {
      const parsedD = new Date(issueDateMatch[1]);
      if (!isNaN(parsedD.getTime())) {
        target.issueDate = parsedD.toISOString().split('T')[0];
      }
    }

    // Detect Due Date
    const dueDateMatch = line.match(/(?:due(?: date)?)[\s#:.-]+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|[A-Za-z]+ \d{1,2},? \d{4})/i);
    if (dueDateMatch) {
      const parsedDue = new Date(dueDateMatch[1]);
      if (!isNaN(parsedDue.getTime())) {
        target.dueDate = parsedDue.toISOString().split('T')[0];
      }
    }

    // Detect Bill To / Payer
    if (/^(?:bill to|billed to|client|customer|payer):?$/i.test(line)) {
      currentSection = 'payer';
      continue;
    }

    if (currentSection === 'payer') {
      if (!target.payer.name && line.length > 2 && !line.includes(':')) {
        target.payer.name = line;
      } else if (!target.payer.address && line.length > 4) {
        target.payer.address = line;
        currentSection = '';
      }
    }

    // Detect Payee Name if near the top
    if (i === 0 || i === 1) {
      if (!target.payee.name && !line.toLowerCase().includes('invoice') && !line.toLowerCase().includes('voucher')) {
        target.payee.name = line;
      }
    }

    // Detect Line Items (e.g. "Drywall installation, 1, 1500.00" or "Service ... $150.00")
    const itemMatch = line.match(/^([^,$\t\n]+?)[,\t| -]+(?:\$?\s*(\d+(?:\.\d{1,2})?))(?:\s*,\s*\$?(\d+(?:\.\d{1,2})?))?$/);
    const moneyMatch = line.match(/^(.*?)(?:\s+|\t+)\$?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2}))$/);

    if (moneyMatch && !line.toLowerCase().includes('total') && !line.toLowerCase().includes('hst') && !line.toLowerCase().includes('subtotal') && !line.toLowerCase().includes('tax')) {
      const desc = moneyMatch[1].trim();
      const amt = parseFloat(moneyMatch[2].replace(/,/g, ''));
      if (desc && !isNaN(amt) && amt > 0) {
        parsedItems.push({
          description: desc,
          quantity: 1,
          unitPrice: amt,
          amount: amt,
          taxable: true,
        });
      }
    } else if (itemMatch) {
      const desc = itemMatch[1].trim();
      const val1 = parseFloat(itemMatch[2]);
      const val2 = itemMatch[3] ? parseFloat(itemMatch[3]) : null;

      if (desc && !isNaN(val1)) {
        const qty = val2 ? val1 : 1;
        const price = val2 ? val2 : val1;
        parsedItems.push({
          description: desc,
          quantity: qty,
          unitPrice: price,
          amount: qty * price,
          taxable: true,
        });
      }
    }

    // Detect Totals & HST
    if (line.toLowerCase().includes('subtotal') || line.toLowerCase().includes('total net')) {
      const subMatch = line.match(/\$?([0-9,]+\.[0-9]{2})/);
      if (subMatch) target.subtotal = parseFloat(subMatch[1].replace(/,/g, ''));
    }

    if (line.toLowerCase().includes('hst') || line.toLowerCase().includes('gst')) {
      const rateMatch = line.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
      if (rateMatch) {
        target.taxConfig.rate = parseFloat(rateMatch[1]);
      }
      const taxAmtMatch = line.match(/\$?([0-9,]+\.[0-9]{2})/);
      if (taxAmtMatch) {
        target.taxConfig.taxAmount = parseFloat(taxAmtMatch[1].replace(/,/g, ''));
      }
      target.taxConfig.applyTax = true;
    }

    if (line.toLowerCase().includes('total to pay') || line.toLowerCase().includes('grand total') || line.toLowerCase().includes('invoice total')) {
      const totMatch = line.match(/\$?([0-9,]+\.[0-9]{2})/);
      if (totMatch) {
        target.totalAmount = parseFloat(totMatch[1].replace(/,/g, ''));
      }
    }
  }

  // Populate line items if found
  if (parsedItems.length > 0) {
    target.items = parsedItems;
  } else if (!target.items || target.items.length === 0) {
    target.items = [
      {
        description: target.title || 'General Contractor Services',
        quantity: 1,
        unitPrice: target.totalAmount || 0,
        amount: target.totalAmount || 0,
        taxable: true,
      },
    ];
  }

  // Calculate totals if missing
  const calculatedSub = target.items.reduce((acc, it) => acc + (Number(it.amount) || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0))), 0);
  if (!target.subtotal || target.subtotal === 0) {
    target.subtotal = calculatedSub;
  }

  const taxRate = Number(target.taxConfig?.rate) || 13;
  if (!target.taxConfig.taxAmount && target.taxConfig.applyTax) {
    target.taxConfig.taxAmount = parseFloat((target.subtotal * (taxRate / 100)).toFixed(2));
  }

  if (!target.totalAmount || target.totalAmount === 0) {
    target.totalAmount = target.taxConfig.applyTax
      ? parseFloat((target.subtotal + target.taxConfig.taxAmount).toFixed(2))
      : target.subtotal;
  }

  if (!target.title) {
    target.title = target.items[0]?.description || 'Payment Voucher';
  }

  if (!target.termsNotes && target.payee.emtEmail) {
    target.termsNotes = `Payment can be made through Interac E-transfer: ${target.payee.emtEmail}. Please quote voucher #${target.voucherNumber || 'reference'}.`;
  }

  return target;
}

/**
 * Extracts plain text from an .xlsx workbook using JSZip.
 */
async function parseXlsxToText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Extract shared strings table if present
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

  // Extract sheet1.xml
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
