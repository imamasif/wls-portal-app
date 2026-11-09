import JSZip from 'jszip';

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extracts relationship IDs to target file paths from word/_rels/document.xml.rels
 */
async function extractRelationships(zip) {
  const relsMap = {};
  try {
    const relsEntry =
      zip.file('word/_rels/document.xml.rels') ||
      Object.values(zip.files).find(
        (f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/_rels/document.xml.rels'
      );

    if (!relsEntry) return relsMap;

    const relsXml = await relsEntry.async('text');
    const relMatches = relsXml.match(/<Relationship\s+[^>]*\/>/g) || [];

    for (const rel of relMatches) {
      const idMatch = rel.match(/Id="([^"]+)"/);
      const targetMatch = rel.match(/Target="([^"]+)"/);
      const typeMatch = rel.match(/Type="([^"]+)"/);

      if (idMatch && targetMatch) {
        const id = idMatch[1];
        let target = targetMatch[1];
        // Clean path relative to word/
        if (!target.startsWith('word/')) {
          if (target.startsWith('../')) {
            target = target.replace('../', '');
          } else if (!target.startsWith('/')) {
            target = 'word/' + target;
          }
        }
        relsMap[id] = {
          target: target.replace(/\\/g, '/'),
          type: typeMatch ? typeMatch[1] : '',
        };
      }
    }
  } catch (err) {
    console.warn('Could not parse document relationships:', err);
  }
  return relsMap;
}

/**
 * Parses a single OpenXML <w:p> paragraph element into HTML
 */
export function parseParagraph(pXml, imagesMap = {}) {
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

  // Check for inline images
  let inlineImagesHtml = '';
  const blipMatches = pXml.match(/<a:blip\s+[^>]*r:embed="([^"]+)"/g) || [];
  for (const bm of blipMatches) {
    const rIdMatch = bm.match(/r:embed="([^"]+)"/);
    if (rIdMatch && imagesMap[rIdMatch[1]]) {
      inlineImagesHtml += `<div style="margin: 8px 0;"><img src="${imagesMap[rIdMatch[1]]}" style="max-width: 100%; height: auto; border-radius: 4px;" alt="Document Image" /></div>`;
    }
  }

  const runs = pXml.match(/<w:r[\s\S]*?<\/w:r>/g) || [];
  let runHtml = '';
  let plainText = '';

  for (const r of runs) {
    const textMatches = r.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
    let text = '';
    for (const tm of textMatches) {
      const inner = tm.replace(/<[^>]+>/g, '');
      text += escapeHtml(inner);
      plainText += inner;
    }

    if (/<w:br\/>/.test(r)) {
      text += '<br/>';
      plainText += '\n';
    }
    if (/<w:tab\/>/.test(r)) {
      text += '&emsp;&emsp;';
      plainText += '    ';
    }

    if (!text) continue;

    const isBold = /<w:b(\/>|\s[^>]*>)/.test(r);
    const isItalic = /<w:i(\/>|\s[^>]*>)/.test(r);
    const isUnderline = /<w:u(\/>|\s[^>]*>)/.test(r);
    const colorMatch = r.match(/<w:color\s+w:val="([0-9a-fA-F]{6})"/);

    let styled = text;
    if (isBold) styled = `<strong>${styled}</strong>`;
    if (isItalic) styled = `<em>${styled}</em>`;
    if (isUnderline) styled = `<u>${styled}</u>`;
    if (colorMatch) styled = `<span style="color: #${colorMatch[1]};">${styled}</span>`;

    runHtml += styled;
  }

  if (inlineImagesHtml) {
    runHtml += inlineImagesHtml;
  }

  if (!runHtml.trim()) return { html: '<p style="margin: 6px 0; min-height: 1em;">&nbsp;</p>', text: '' };

  const alignStyle = align !== 'left' ? ` style="text-align: ${align}; margin: 6px 0;"` : ' style="margin: 6px 0;"';
  if (isList) return { html: `<li${alignStyle}>${runHtml}</li>`, text: plainText };
  return { html: `<${tag}${alignStyle}>${runHtml}</${tag}>`, text: plainText };
}

/**
 * Parses an OpenXML <w:tbl> table element into HTML
 */
export function parseTable(tblXml, imagesMap = {}) {
  const rows = tblXml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  let tblHtml = '<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">';
  let totalText = '';

  for (const r of rows) {
    tblHtml += '<tr>';
    const cells = r.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    for (const c of cells) {
      const paras = c.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
      let cellContent = '';
      for (const p of paras) {
        const parsedP = parseParagraph(p, imagesMap);
        cellContent += parsedP.html;
        totalText += ' ' + parsedP.text;
      }
      tblHtml += `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top;">${cellContent || '&nbsp;'}</td>`;
    }
    tblHtml += '</tr>';
  }
  tblHtml += '</table>';
  return { html: tblHtml, text: totalText };
}

/**
 * Parses any Word .docx file (File or Blob or ArrayBuffer) into styled HTML for canvas display.
 */
export async function parseDocxFile(fileOrBlob) {
  try {
    const zip = await JSZip.loadAsync(fileOrBlob);
    const docEntry =
      zip.file('word/document.xml') ||
      Object.values(zip.files).find(
        (f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml'
      );

    if (!docEntry) {
      return { success: false, error: 'word/document.xml not found inside Word document.' };
    }

    // Extract relationships and images
    const relsMap = await extractRelationships(zip);
    const imagesMap = {};
    for (const [rId, rel] of Object.entries(relsMap)) {
      if (rel.type.includes('image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(rel.target)) {
        const imgFile = zip.file(rel.target);
        if (imgFile) {
          try {
            const b64 = await imgFile.async('base64');
            const ext = rel.target.split('.').pop().toLowerCase();
            const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
            imagesMap[rId] = `data:${mime};base64,${b64}`;
          } catch (e) {
            console.warn(`Could not load image ${rel.target}:`, e);
          }
        }
      }
    }

    const xmlContent = await docEntry.async('text');
    // Body can have attributes, so match <w:body(?:\s[^>]*)?>
    const bodyMatch = xmlContent.match(/<w:body(?:\s[^>]*)?>([\s\S]*?)<\/w:body>/);
    if (!bodyMatch) {
      return { success: false, error: 'No document body found in Word document.' };
    }

    const body = bodyMatch[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
    const elements = body.match(/<(w:p|w:tbl)[\s\S]*?<\/\1>/g) || [];

    let fullHtml = '';
    let totalText = '';
    let paraCount = 0;

    for (const el of elements) {
      if (el.startsWith('<w:tbl')) {
        const parsedTbl = parseTable(el, imagesMap);
        fullHtml += parsedTbl.html;
        totalText += ' ' + parsedTbl.text;
      } else if (el.startsWith('<w:p')) {
        const parsedP = parseParagraph(el, imagesMap);
        fullHtml += parsedP.html;
        totalText += ' ' + parsedP.text;
        if (parsedP.text.trim()) paraCount++;
      }
    }

    const trimmedText = totalText.trim();
    const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const isEmpty = wordCount === 0 && Object.keys(imagesMap).length === 0;

    return {
      success: true,
      html: fullHtml || '',
      totalText: trimmedText,
      wordCount,
      paraCount,
      isEmpty,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to parse .docx file.',
    };
  }
}
