import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import os from 'os';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import { generateGenericLetterheadPdfBuffer } from './meetingPdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getLetterheadAssetsDir() {
  const candidates = [
    path.join(__dirname, 'assets'),
    path.resolve('src/features/letterheads/assets'),
    path.resolve('server/src/features/letterheads/assets'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, 'assets');
}

export function getUploadsDir() {
  const candidates = [
    path.resolve(__dirname, '../../../uploads'),
    path.resolve('uploads'),
    path.resolve('server/uploads'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const defaultDir = path.resolve(__dirname, '../../../uploads');
  if (!fs.existsSync(defaultDir)) {
    try { fs.mkdirSync(defaultDir, { recursive: true }); } catch {}
  }
  return defaultDir;
}

export function getGeneratedDir() {
  const candidates = [
    path.resolve(__dirname, '../../../generated_documents'),
    path.resolve('generated_documents'),
    path.resolve('server/generated_documents'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const defaultDir = path.resolve(__dirname, '../../../generated_documents');
  if (!fs.existsSync(defaultDir)) {
    try { fs.mkdirSync(defaultDir, { recursive: true }); } catch {}
  }
  return defaultDir;
}


export async function normalizeZip(zip) {
  const cleanZip = new JSZip();
  for (const [key, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    const cleanKey = key.replace(/\\/g, '/');
    const buf = await file.async('nodebuffer');
    cleanZip.file(cleanKey, buf);
  }
  return cleanZip;
}

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];

export function getBrowserPath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  // Try locating via 'which' on unix
  if (process.platform !== 'win32') {
    try {
      const out = execFileSync('which', ['google-chrome'], { encoding: 'utf8' }).trim();
      if (out && fs.existsSync(out)) return out;
    } catch {}
    try {
      const out = execFileSync('which', ['chromium-browser'], { encoding: 'utf8' }).trim();
      if (out && fs.existsSync(out)) return out;
    } catch {}
  }
  return null;
}

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function docxXmlToHtml(xmlContent) {
  const bodyMatch = xmlContent.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) return '<p>No content found in document body.</p>';

  const body = bodyMatch[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
  const elements = body.match(/<(w:p|w:tbl)[\s\S]*?<\/\1>/g) || [];

  let html = '';
  for (const el of elements) {
    if (el.startsWith('<w:tbl')) {
      html += parseTable(el);
    } else if (el.startsWith('<w:p')) {
      html += parseParagraph(el);
    }
  }
  return html || '<p>Empty document</p>';
}

function parseParagraph(pXml) {
  let align = 'left';
  const jcMatch = pXml.match(/<w:jc\s+w:val="([^"]+)"/);
  if (jcMatch) {
    const jc = jcMatch[1];
    if (jc === 'center') align = 'center';
    else if (jc === 'right') align = 'right';
    else if (jc === 'both') align = 'justify';
  }

  let tag = 'p';
  const styleMatch = pXml.match(/<w:pStyle\s+w:val="([^"]+)"/);
  if (styleMatch) {
    const style = styleMatch[1].toLowerCase();
    if (style.includes('heading1') || style.includes('title')) tag = 'h1';
    else if (style.includes('heading2')) tag = 'h2';
    else if (style.includes('heading3')) tag = 'h3';
  }

  const isList = /<w:numPr>/.test(pXml);
  const runs = pXml.match(/<w:r[\s\S]*?<\/w:r>/g) || [];
  let runHtml = '';

  for (const r of runs) {
    const textMatches = r.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
    let text = '';
    for (const tm of textMatches) {
      const inner = tm.replace(/<[^>]+>/g, '');
      text += escapeHtml(inner);
    }

    if (/<w:br\/>/.test(r)) text += '<br/>';
    if (/<w:tab\/>/.test(r)) text += '&emsp;&emsp;';

    if (!text) continue;

    const isBold = /<w:b(\/>|\s[^>]*>)/.test(r);
    const isItalic = /<w:i(\/>|\s[^>]*>)/.test(r);
    const isUnderline = /<w:u(\/>|\s[^>]*>)/.test(r);

    let styled = text;
    if (isBold) styled = `<strong>${styled}</strong>`;
    if (isItalic) styled = `<em>${styled}</em>`;
    if (isUnderline) styled = `<u>${styled}</u>`;

    runHtml += styled;
  }

  if (!runHtml.trim()) return '<p style="margin: 8px 0; min-height: 1em;">&nbsp;</p>';

  const alignStyle = align !== 'left' ? ` style="text-align: ${align};"` : '';
  if (isList) return `<li${alignStyle}>${runHtml}</li>`;
  return `<${tag}${alignStyle}>${runHtml}</${tag}>`;
}

function parseTable(tblXml) {
  const rows = tblXml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  let tblHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">';
  for (const r of rows) {
    tblHtml += '<tr>';
    const cells = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    for (const c of cells) {
      const paras = c.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
      let cellContent = '';
      for (const p of paras) {
        cellContent += parseParagraph(p);
      }
      tblHtml += `<td style="border: 1px solid #ddd; padding: 8px 12px; vertical-align: top;">${cellContent}</td>`;
    }
    tblHtml += '</tr>';
  }
  tblHtml += '</table>';
  return tblHtml;
}

export async function readDocxBodyXml(docxPath) {
  try {
    const data = fs.readFileSync(docxPath);
    const zip = await JSZip.loadAsync(data);
    const entry =
      zip.file('word/document.xml') ||
      Object.values(zip.files).find(
        (f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml'
      );
    if (!entry) return '';
    return await entry.async('text');
  } catch (err) {
    console.error('readDocxBodyXml error:', err);
    return '';
  }
}

export async function mergeDocxWithTemplate(templateDocxPath, userDocxPath, outputDocxPath, options = {}) {
  const tplData = fs.readFileSync(templateDocxPath);
  const userData = fs.readFileSync(userDocxPath);

  const rawTplZip = await JSZip.loadAsync(tplData);
  const tplZip = await normalizeZip(rawTplZip);
  const userZip = await JSZip.loadAsync(userData);

  const userDocXmlFile =
    userZip.file('word/document.xml') ||
    Object.values(userZip.files).find((f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml');

  const userDocXml = userDocXmlFile ? await userDocXmlFile.async('text') : '';
  const bodyMatch = userDocXml.match(/<w:body>(.*?)(<w:sectPr[\s\S]*?<\/w:sectPr>)?<\/w:body>/s);
  const userBodyContent = bodyMatch ? bodyMatch[1] : '';

  const tplDocXmlFile =
    tplZip.file('word/document.xml') ||
    Object.values(tplZip.files).find((f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml');

  const tplDocXml = tplDocXmlFile ? await tplDocXmlFile.async('text') : '';
  const tplSectMatch = tplDocXml.match(/(<w:sectPr[\s\S]*?<\/w:sectPr>)/s);
  const tplSectPr = tplSectMatch ? tplSectMatch[1] : '';

  let prefix = '';
  if (options.includeBismillah && tplZip.file('word/media/bismillah.jpg')) {
    const relsFile = tplZip.file('word/_rels/document.xml.rels');
    if (relsFile) {
      let relsXml = await relsFile.async('text');
      if (!relsXml.includes('rIdBismillah')) {
        relsXml = relsXml.replace(
          '</Relationships>',
          '<Relationship Id="rIdBismillah" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/bismillah.jpg"/></Relationships>'
        );
        tplZip.file('word/_rels/document.xml.rels', relsXml);
      }
    }
    prefix =
      '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="240" w:before="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="2397125" cy="457200"/><wp:docPr id="100" name="Bismillah"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="100" name="Bismillah"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdBismillah"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2397125" cy="457200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  }

  const newDocXml = tplDocXml.replace(/<w:body>[\s\S]*?<\/w:body>/s, `<w:body>${prefix}${userBodyContent}${tplSectPr}</w:body>`);
  tplZip.file('word/document.xml', newDocXml);

  // Copy user media files if present
  const userMediaFiles = Object.keys(userZip.files).filter((f) => f.startsWith('word/media/'));
  for (const m of userMediaFiles) {
    if (!tplZip.file(m)) {
      const buf = await userZip.file(m).async('nodebuffer');
      tplZip.file(m, buf);
    }
  }

  const outBuffer = await tplZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.mkdirSync(path.dirname(outputDocxPath), { recursive: true });
  fs.writeFileSync(outputDocxPath, outBuffer);
}

export async function generatePdfFromDocx(userDocxPath, templateType, outputPdfPath, options = {}) {
  const browserPath = getBrowserPath();
  const userXml = await readDocxBodyXml(userDocxPath);
  const bodyHtml = docxXmlToHtml(userXml);

  const assetsDir = getLetterheadAssetsDir();

  let headerBase64 = '';
  let footerBase64 = '';
  let watermarkBase64 = '';
  let bismillahBase64 = '';

  if (templateType === 'iipc') {
    if (fs.existsSync(path.join(assetsDir, 'iipc_header.jpg'))) {
      const hBytes = fs.readFileSync(path.join(assetsDir, 'iipc_header.jpg'));
      headerBase64 = `data:image/jpeg;base64,${hBytes.toString('base64')}`;
    }
    if (fs.existsSync(path.join(assetsDir, 'iipc_footer.jpg'))) {
      const fBytes = fs.readFileSync(path.join(assetsDir, 'iipc_footer.jpg'));
      footerBase64 = `data:image/jpeg;base64,${fBytes.toString('base64')}`;
    }
    if (options.includeBismillah !== false && fs.existsSync(path.join(assetsDir, 'iipc_bismillah.jpg'))) {
      const bBytes = fs.readFileSync(path.join(assetsDir, 'iipc_bismillah.jpg'));
      bismillahBase64 = `data:image/jpeg;base64,${bBytes.toString('base64')}`;
    }
  } else if (templateType === 'bp') {
    if (fs.existsSync(path.join(assetsDir, 'bp_header.jpeg'))) {
      const hBytes = fs.readFileSync(path.join(assetsDir, 'bp_header.jpeg'));
      headerBase64 = `data:image/jpeg;base64,${hBytes.toString('base64')}`;
    }
    if (fs.existsSync(path.join(assetsDir, 'bp_footer.png'))) {
      const fBytes = fs.readFileSync(path.join(assetsDir, 'bp_footer.png'));
      footerBase64 = `data:image/png;base64,${fBytes.toString('base64')}`;
    }
    if (options.includeWatermark !== false && fs.existsSync(path.join(assetsDir, 'bp_watermark.png'))) {
      const wBytes = fs.readFileSync(path.join(assetsDir, 'bp_watermark.png'));
      watermarkBase64 = `data:image/png;base64,${wBytes.toString('base64')}`;
    }
  }

  const dateBlock = options.customDate
    ? `<div style="text-align: right; font-weight: 600; color: #475569; margin: 12px 0 16px 0; font-size: 13px;">Date: ${escapeHtml(options.customDate)}</div>`
    : '';

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
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1e293b;
    position: relative;
    background: #ffffff;
  }
  .header-img {
    width: 100%;
    display: block;
  }
  .footer-img {
    width: 100%;
    display: block;
  }
  .content-wrap {
    padding: 24px 48px;
    font-size: 13.5px;
    line-height: 1.65;
    position: relative;
    z-index: 5;
    min-height: 640px;
  }
  .bismillah-wrap {
    text-align: center;
    margin: 0 0 16px 0;
  }
  .bismillah-img {
    max-height: 48px;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    opacity: 0.12;
    z-index: 1;
    pointer-events: none;
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
  ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark"/>` : ''}
  <div class="content-wrap">
    ${bismillahBase64 ? `<div class="bismillah-wrap"><img src="${bismillahBase64}" class="bismillah-img"/></div>` : ''}
    ${dateBlock}
    ${bodyHtml}
  </div>
  ${footerBase64 ? `<div class="footer-fixed"><img src="${footerBase64}" class="footer-img"/></div>` : ''}
</body>
</html>`;

  const outDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tempHtmlPath = path.join(getUploadsDir(), `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  let pdfDone = false;
  try {
    if (browserPath) {
      const absPdfPath = path.resolve(outputPdfPath);
      execFileSync(browserPath, [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        `--print-to-pdf=${absPdfPath}`,
        tempHtmlPath,
      ]);
      if (fs.existsSync(outputPdfPath) && fs.statSync(outputPdfPath).size > 1000) {
        pdfDone = true;
      }
    }
  } catch (err) {
    console.warn('Browser print failed in generatePdfFromDocx:', err.message);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      try { fs.unlinkSync(tempHtmlPath); } catch {}
    }
  }

  if (!pdfDone) {
    const assetsDir = getLetterheadAssetsDir();
    const pdfBuf = generateGenericLetterheadPdfBuffer({
      title: options.title || '',
      htmlContent: bodyHtml,
      templateType,
      assetsDir,
    });
    fs.writeFileSync(outputPdfPath, pdfBuf);
  }
}

export async function mergeTwoFilesToDocxAndPdf({
  templateFilePath,
  contentFilePath,
  outputDocxPath,
  outputPdfPath,
}) {
  const tplData = fs.readFileSync(templateFilePath);
  const rawTplZip = await JSZip.loadAsync(tplData);
  const tplZip = await normalizeZip(rawTplZip);

  const contentExt = path.extname(contentFilePath).toLowerCase();
  let userBodyContent = '';

  if (contentExt === '.txt') {
    const txtLines = fs.readFileSync(contentFilePath, 'utf8').split('\n');
    userBodyContent = txtLines
      .map((l) => `<w:p><w:r><w:t>${escapeHtml(l.trimEnd())}</w:t></w:r></w:p>`)
      .join('');
  } else {
    const cntData = fs.readFileSync(contentFilePath);
    const cntZip = await JSZip.loadAsync(cntData);
    const cntDocXmlFile =
      cntZip.file('word/document.xml') ||
      Object.values(cntZip.files).find((f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml');

    if (cntDocXmlFile) {
      const cntXml = await cntDocXmlFile.async('text');
      const bodyMatch = cntXml.match(/<w:body>(.*?)(<w:sectPr[\s\S]*?<\/w:sectPr>)?<\/w:body>/s);
      if (bodyMatch) userBodyContent = bodyMatch[1];
    }

    // Copy media files
    const mediaFiles = Object.keys(cntZip.files).filter((f) => f.startsWith('word/media/'));
    for (const m of mediaFiles) {
      if (!tplZip.file(m)) {
        const buf = await cntZip.file(m).async('nodebuffer');
        tplZip.file(m, buf);
      }
    }
  }

  const tplDocXmlFile =
    tplZip.file('word/document.xml') ||
    Object.values(tplZip.files).find((f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml');

  const tplDocXml = tplDocXmlFile ? await tplDocXmlFile.async('text') : '';
  const tplSectMatch = tplDocXml.match(/(<w:sectPr[\s\S]*?<\/w:sectPr>)/s);
  const tplSectPr = tplSectMatch
    ? tplSectMatch[1]
    : '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';

  const newDocXml = tplDocXml.replace(/<w:body>[\s\S]*?<\/w:body>/s, `<w:body>${userBodyContent}${tplSectPr}</w:body>`);
  tplZip.file('word/document.xml', newDocXml);

  const outDocxBuffer = await tplZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.mkdirSync(path.dirname(outputDocxPath), { recursive: true });
  fs.writeFileSync(outputDocxPath, outDocxBuffer);

  // Generate PDF
  await generatePdfFromDocx(outputDocxPath, 'custom', outputPdfPath, {});

  return {
    docxPath: outputDocxPath,
    pdfPath: outputPdfPath,
  };
}

function formatNumericValue(val, fmt) {
  const num = Number(val || 0);
  switch (fmt) {
    case 'currency':
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'decimal':
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'integer':
      return Math.round(num).toLocaleString('en-US');
    case 'percent':
      return `${(num * 100).toFixed(1)}%`;
    default:
      return String(val ?? '');
  }
}

export async function generateCustomizedDocument({
  userDocxPath,
  baseType,
  elements = [],
  outputDocxPath,
  outputPdfPath,
  options = {},
}) {
  const assetsDir = getLetterheadAssetsDir();

  let headerBase64 = '';
  let footerBase64 = '';
  let watermarkBase64 = '';
  let bismillahBase64 = '';

  if (baseType === 'iipc') {
    if (fs.existsSync(path.join(assetsDir, 'iipc_header.jpg'))) {
      headerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_header.jpg')).toString('base64')}`;
    }
    if (fs.existsSync(path.join(assetsDir, 'iipc_footer.jpg'))) {
      footerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_footer.jpg')).toString('base64')}`;
    }
    if (options.includeBismillah && fs.existsSync(path.join(assetsDir, 'iipc_bismillah.jpg'))) {
      bismillahBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_bismillah.jpg')).toString('base64')}`;
    }
  } else if (baseType === 'bp') {
    if (fs.existsSync(path.join(assetsDir, 'bp_header.jpeg'))) {
      headerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'bp_header.jpeg')).toString('base64')}`;
    }
    if (fs.existsSync(path.join(assetsDir, 'bp_footer.png'))) {
      footerBase64 = `data:image/png;base64,${fs.readFileSync(path.join(assetsDir, 'bp_footer.png')).toString('base64')}`;
    }
    if (options.includeWatermark && fs.existsSync(path.join(assetsDir, 'bp_watermark.png'))) {
      watermarkBase64 = `data:image/png;base64,${fs.readFileSync(path.join(assetsDir, 'bp_watermark.png')).toString('base64')}`;
    }
  }

  let userBodyHtml = '';
  if (userDocxPath && fs.existsSync(userDocxPath)) {
    const userXml = await readDocxBodyXml(userDocxPath);
    userBodyHtml = docxXmlToHtml(userXml);
  } else if (options.bodyHtml) {
    userBodyHtml = options.bodyHtml;
  } else {
    userBodyHtml = `
      <div style="margin: 20px 0; color: #334155;">
        <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Official Institutional Correspondence</h2>
        <p>This customized correspondence has been generated and validated with institutional authorization.</p>
      </div>
    `;
  }

  // Render elements into absolute positioned HTML overlays for PDF
  const overlayHtml = elements
    .map((el) => {
      const top = el.y || 100;
      const left = el.x || 100;
      const font = el.font || 'Segoe UI';
      const color = el.color || '#0f172a';
      const fSize = el.fontSize || 14;

      let inner = '';
      switch (el.type) {
        case 'date':
          inner = `<div style="font-family: '${font}'; color: ${color}; font-size: ${fSize}px; font-weight: 600;">Date: ${escapeHtml(el.text || new Date().toISOString().split('T')[0])}</div>`;
          break;
        case 'text':
          inner = `<div style="font-family: '${font}'; color: ${color}; font-size: ${fSize}px; font-weight: 500;">${escapeHtml(el.text || '')}</div>`;
          break;
        case 'checkbox':
          inner = `<div style="font-family: '${font}'; color: ${color}; font-size: ${fSize}px;"><span style="color: ${el.checked ? '#16a34a' : '#64748b'}; font-weight: bold; margin-right: 6px;">${el.checked ? '☑' : '☐'}</span>${escapeHtml(el.label || el.text || '')}</div>`;
          break;
        case 'radio':
          inner = `<div style="font-family: '${font}'; color: ${color}; font-size: ${fSize}px;"><span style="color: ${el.checked ? '#2563eb' : '#64748b'}; font-weight: bold; margin-right: 6px;">${el.checked ? '🔘' : '⚪'}</span>${escapeHtml(el.label || el.text || '')}</div>`;
          break;
        case 'checkmark':
          inner = `<div style="color: ${color || '#16a34a'}; font-size: ${el.size || 24}px; font-weight: bold; line-height: 1;">✔</div>`;
          break;
        case 'crossmark':
          inner = `<div style="color: ${color || '#dc2626'}; font-size: ${el.size || 24}px; font-weight: bold; line-height: 1;">✖</div>`;
          break;
        case 'numeric':
          const formatted = formatNumericValue(el.value ?? el.text, el.format);
          inner = `<div style="font-family: '${font}'; color: ${color}; font-size: ${fSize}px; font-weight: 700;">${escapeHtml(formatted)}</div>`;
          break;
        case 'signature':
          if (el.dataUrl) {
            inner = `<img src="${el.dataUrl}" style="width: ${el.width || 170}px; height: ${el.height || 55}px; object-fit: contain; display: block;"/>`;
          }
          break;
        case 'image':
          if (el.dataUrl) {
            inner = `<img src="${el.dataUrl}" style="width: ${el.width || 110}px; height: ${el.height || 110}px; object-fit: contain; display: block;"/>`;
          }
          break;
      }

      return `<div style="position: absolute; top: ${top}px; left: ${left}px; z-index: 20;">${inner}</div>`;
    })
    .join('\n');

  const fullPdfHtml = `<!DOCTYPE html>
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
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1e293b;
    position: relative;
    background: #ffffff;
    min-height: 100vh;
  }
  .header-img { width: 100%; display: block; }
  .footer-img { width: 100%; display: block; }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70%;
    opacity: 0.12;
    z-index: 1;
    pointer-events: none;
  }
  .content-wrap {
    padding: 24px 48px;
    font-size: 13.5px;
    line-height: 1.65;
    position: relative;
    z-index: 5;
    min-height: 600px;
  }
  .bismillah-wrap { text-align: center; margin: 0 0 16px 0; }
  .bismillah-img { max-height: 48px; }
  .footer-fixed { position: fixed; bottom: 0; left: 0; width: 100%; }
</style>
</head>
<body>
  ${headerBase64 ? `<img src="${headerBase64}" class="header-img"/>` : ''}
  ${watermarkBase64 ? `<img src="${watermarkBase64}" class="watermark"/>` : ''}
  <div class="content-wrap">
    ${bismillahBase64 ? `<div class="bismillah-wrap"><img src="${bismillahBase64}" class="bismillah-img"/></div>` : ''}
    ${userBodyHtml}
    ${overlayHtml}
  </div>
  ${footerBase64 ? `<div class="footer-fixed"><img src="${footerBase64}" class="footer-img"/></div>` : ''}
</body>
</html>`;

  const outDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tempHtmlPath = path.join(getUploadsDir(), `custom_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, fullPdfHtml, 'utf8');

  try {
    const browserPath = getBrowserPath();
    if (browserPath) {
      const absPdfPath = path.resolve(outputPdfPath);
      execFileSync(browserPath, [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        `--print-to-pdf=${absPdfPath}`,
        tempHtmlPath,
      ]);
    } else {
      fs.writeFileSync(outputPdfPath, Buffer.from('%PDF-1.4\n%EOF\n'));
    }
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      try { fs.unlinkSync(tempHtmlPath); } catch {}
    }
  }

  // Base template for DOCX
  let templateFile = path.join(assetsDir, 'iipc_template.docx');
  if (baseType === 'bp') templateFile = path.join(assetsDir, 'bp_template.docx');

  let customXmlElements = '';
  for (const el of elements) {
    const font = el.font || 'Calibri';
    const colorHex = (el.color || '1A1A1A').replace('#', '').toUpperCase();
    const szVal = Math.round((el.fontSize || 12) * 2);

    switch (el.type) {
      case 'date': {
        const dText = el.text || new Date().toISOString().split('T')[0];
        customXmlElements += `<w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:color w:val="${colorHex}"/><w:sz w:val="${szVal}"/><w:b/></w:rPr><w:t>Date: ${escapeHtml(dText)}</w:t></w:r></w:p>`;
        break;
      }
      case 'text': {
        customXmlElements += `<w:p><w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:color w:val="${colorHex}"/><w:sz w:val="${szVal}"/></w:rPr><w:t>${escapeHtml(el.text || '')}</w:t></w:r></w:p>`;
        break;
      }
      case 'checkbox': {
        const symbol = el.checked ? '☑ ' : '☐ ';
        customXmlElements += `<w:p><w:r><w:rPr><w:rFonts w:ascii="MS Gothic" w:hAnsi="MS Gothic"/><w:sz w:val="${szVal + 4}"/><w:color w:val="${el.checked ? '16A34A' : '64748B'}"/></w:rPr><w:t>${symbol}</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="${font}"/><w:sz w:val="${szVal}"/></w:rPr><w:t>${escapeHtml(el.label || el.text || '')}</w:t></w:r></w:p>`;
        break;
      }
      case 'radio': {
        const symbol = el.checked ? '🔘 ' : '⚪ ';
        customXmlElements += `<w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI Symbol" w:hAnsi="Segoe UI Symbol"/><w:sz w:val="${szVal + 2}"/><w:color w:val="${el.checked ? '2563EB' : '64748B'}"/></w:rPr><w:t>${symbol}</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="${font}"/><w:sz w:val="${szVal}"/></w:rPr><w:t>${escapeHtml(el.label || el.text || '')}</w:t></w:r></w:p>`;
        break;
      }
      case 'checkmark': {
        customXmlElements += `<w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI Symbol" w:hAnsi="Segoe UI Symbol"/><w:sz w:val="${szVal + 8}"/><w:b/><w:color w:val="${colorHex || '16A34A'}"/></w:rPr><w:t>✔</w:t></w:r></w:p>`;
        break;
      }
      case 'crossmark': {
        customXmlElements += `<w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI Symbol" w:hAnsi="Segoe UI Symbol"/><w:sz w:val="${szVal + 8}"/><w:b/><w:color w:val="${colorHex || 'DC2626'}"/></w:rPr><w:t>✖</w:t></w:r></w:p>`;
        break;
      }
      case 'numeric': {
        const formatted = formatNumericValue(el.value ?? el.text, el.format);
        customXmlElements += `<w:p><w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:color w:val="${colorHex}"/><w:sz w:val="${szVal}"/><w:b/></w:rPr><w:t>${escapeHtml(formatted)}</w:t></w:r></w:p>`;
        break;
      }
      case 'signature': {
        customXmlElements += `<w:p><w:r><w:rPr><w:rFonts w:ascii="Brush Script MT" w:hAnsi="Brush Script MT"/><w:sz w:val="36"/><w:i/><w:color w:val="1E3A8A"/></w:rPr><w:t>Signed: Authorized Officer</w:t></w:r><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pPr></w:pPr></w:p>`;
        break;
      }
    }
  }

  // Merge with JSZip
  const tplData = fs.readFileSync(templateFile);
  const tplZip = await JSZip.loadAsync(tplData);

  let userBody = '';
  if (userDocxPath && fs.existsSync(userDocxPath)) {
    const uData = fs.readFileSync(userDocxPath);
    const rawUZip = await JSZip.loadAsync(uData);
    const uZip = await normalizeZip(rawUZip);
    const uDocXmlFile =
      uZip.file('word/document.xml') ||
      Object.values(uZip.files).find((f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml');

    if (uDocXmlFile) {
      const uXml = await uDocXmlFile.async('text');
      const bMatch = uXml.match(/<w:body>(.*?)(<w:sectPr[\s\S]*?<\/w:sectPr>)?<\/w:body>/s);
      if (bMatch) userBody = bMatch[1];
    }

    // Copy media files
    const mediaFiles = Object.keys(uZip.files).filter((f) => f.startsWith('word/media/'));
    for (const m of mediaFiles) {
      if (!tplZip.file(m)) {
        const buf = await uZip.file(m).async('nodebuffer');
        tplZip.file(m, buf);
      }
    }
  } else if (options.bodyText) {
    const paras = options.bodyText.split('\n').filter((p) => p.trim());
    userBody = paras
      .map(
        (p) =>
          `<w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI"/><w:sz w:val="24"/></w:rPr><w:t>${escapeHtml(p)}</w:t></w:r></w:p>`
      )
      .join('');
  }

  const tplDocXmlFile =
    tplZip.file('word/document.xml') ||
    Object.values(tplZip.files).find((f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml');

  const docXml = tplDocXmlFile ? await tplDocXmlFile.async('text') : '';
  const tplSectMatch = docXml.match(/(<w:sectPr[\s\S]*?<\/w:sectPr>)/s);
  const tplSectPr = tplSectMatch ? tplSectMatch[1] : '';

  const newDocXml = docXml.replace(/<w:body>[\s\S]*?<\/w:body>/s, `<w:body>${userBody}${customXmlElements}${tplSectPr}</w:body>`);
  tplZip.file('word/document.xml', newDocXml);

  const outDocxBuffer = await tplZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.mkdirSync(path.dirname(outputDocxPath), { recursive: true });
  fs.writeFileSync(outputDocxPath, outDocxBuffer);

  return {
    docxPath: outputDocxPath,
    pdfPath: outputPdfPath,
  };
}
