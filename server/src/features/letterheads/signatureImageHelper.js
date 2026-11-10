import zlib from 'zlib';

/**
 * Parses a base64 Data URL (PNG or JPEG).
 */
export function parseSignatureDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
  if (!match) return null;

  const rawExt = match[1].toLowerCase();
  const format = rawExt === 'jpg' ? 'jpeg' : rawExt;
  const buffer = Buffer.from(match[2], 'base64');
  return { format, buffer };
}

/**
 * Decodes PNG buffer into composite RGB buffer using pure JS + Node zlib.
 */
export function decodePngToRgb(pngBuf) {
  let offset = 8; // skip PNG signature
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idatChunks = [];

  while (offset < pngBuf.length) {
    const len = pngBuf.readUInt32BE(offset);
    const type = pngBuf.toString('ascii', offset + 4, offset + 8);
    const data = pngBuf.slice(offset + 8, offset + 8 + len);
    offset += 12 + len;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (!width || !height || idatChunks.length === 0) {
    return null;
  }

  try {
    const compressedIdat = Buffer.concat(idatChunks);
    const decompressed = zlib.inflateSync(compressedIdat);

    const bytesPerPixel = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
    const stride = width * bytesPerPixel;
    const rgbBuf = Buffer.alloc(width * height * 3);

    const prevRow = Buffer.alloc(stride);
    const curRow = Buffer.alloc(stride);

    let inOffset = 0;
    let outOffset = 0;

    for (let y = 0; y < height; y++) {
      const filter = decompressed[inOffset++];
      for (let x = 0; x < stride; x++) {
        const raw = decompressed[inOffset++];
        const a = x >= bytesPerPixel ? curRow[x - bytesPerPixel] : 0;
        const b = prevRow[x];
        const c = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;

        let val = raw;
        if (filter === 1) { // Sub
          val = (raw + a) & 0xff;
        } else if (filter === 2) { // Up
          val = (raw + b) & 0xff;
        } else if (filter === 3) { // Average
          val = (raw + Math.floor((a + b) / 2)) & 0xff;
        } else if (filter === 4) { // Paeth
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          val = (raw + pr) & 0xff;
        }
        curRow[x] = val;
      }

      // Convert curRow to RGB on white background
      for (let x = 0; x < width; x++) {
        const px = x * bytesPerPixel;
        if (colorType === 6) { // RGBA
          const r = curRow[px];
          const g = curRow[px + 1];
          const b = curRow[px + 2];
          const alpha = curRow[px + 3] / 255;
          rgbBuf[outOffset++] = Math.round(r * alpha + 255 * (1 - alpha));
          rgbBuf[outOffset++] = Math.round(g * alpha + 255 * (1 - alpha));
          rgbBuf[outOffset++] = Math.round(b * alpha + 255 * (1 - alpha));
        } else if (colorType === 2) { // RGB
          rgbBuf[outOffset++] = curRow[px];
          rgbBuf[outOffset++] = curRow[px + 1];
          rgbBuf[outOffset++] = curRow[px + 2];
        } else { // Grayscale
          const v = curRow[px];
          rgbBuf[outOffset++] = v;
          rgbBuf[outOffset++] = v;
          rgbBuf[outOffset++] = v;
        }
      }

      curRow.copy(prevRow);
    }

    return {
      width,
      height,
      compressedRgb: zlib.deflateSync(rgbBuf),
    };
  } catch (err) {
    console.warn('PNG decode error in signatureImageHelper:', err.message);
    return null;
  }
}

/**
 * Creates OpenXML Drawing XML snippet for embedding an image in Microsoft Word.
 */
export function createDocxDrawingXml(rId, widthEmu = 1450000, heightEmu = 480000, docPrId = 200, align = 'left') {
  return `<w:p><w:pPr><w:jc w:val="${align}"/><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:docPr id="${docPrId}" name="SignImage${docPrId}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${docPrId}" name="SignImage${docPrId}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}
