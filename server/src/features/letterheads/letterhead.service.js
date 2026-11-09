import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import os from 'os';

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

export function getBrowserPath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Neither Chrome nor Edge was found on the system for PDF generation.');
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

export function readDocxBodyXml(docxPath) {
  const safePath = docxPath.replace(/\\/g, '/');
  const psScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${safePath}')
$entry = $zip.Entries | Where-Object { $_.FullName -replace '\\\\','/' -eq 'word/document.xml' } | Select-Object -First 1
if ($entry) {
  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  $content = $reader.ReadToEnd()
  $reader.Dispose()
  $stream.Dispose()
} else {
  $content = ""
}
$zip.Dispose()
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[System.Console]::Write($content)
`;

  return execFileSync('powershell', ['-NoProfile', '-Command', psScript], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

export function mergeDocxWithTemplate(templateDocxPath, userDocxPath, outputDocxPath, options = {}) {
  const tplSafe = templateDocxPath.replace(/\\/g, '/');
  const userSafe = userDocxPath.replace(/\\/g, '/');
  const outSafe = outputDocxPath.replace(/\\/g, '/');

  const psScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tempWork = Join-Path $env:TEMP ("lh_tpl_" + [System.Guid]::NewGuid().ToString())
$tempUser = Join-Path $env:TEMP ("lh_usr_" + [System.Guid]::NewGuid().ToString())

try {
  [System.IO.Compression.ZipFile]::ExtractToDirectory('${tplSafe}', $tempWork)
  [System.IO.Compression.ZipFile]::ExtractToDirectory('${userSafe}', $tempUser)

  $userDocXmlFile = Join-Path $tempUser "word\\document.xml"
  if (!(Test-Path $userDocXmlFile)) {
    $userDocXmlFile = (Get-ChildItem -Recurse $tempUser | Where-Object { $_.FullName -like "*word*document.xml" } | Select-Object -First 1).FullName
  }
  $userDocXml = Get-Content -LiteralPath $userDocXmlFile -Raw

  $bodyMatch = [System.Text.RegularExpressions.Regex]::Match($userDocXml, '<w:body>(.*?)(<w:sectPr.*?</w:sectPr>)?</w:body>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $userBodyContent = ""
  if ($bodyMatch.Success) {
    $userBodyContent = $bodyMatch.Groups[1].Value
  }

  $tplDocXmlFile = Join-Path $tempWork "word\\document.xml"
  $tplDocXml = Get-Content -LiteralPath $tplDocXmlFile -Raw
  $tplSectMatch = [System.Text.RegularExpressions.Regex]::Match($tplDocXml, '(<w:sectPr.*?</w:sectPr>)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $tplSectPr = $tplSectMatch.Groups[1].Value

  $prefix = ""
  ${options.includeBismillah ? `
  if (Test-Path "$tempWork/word/media/bismillah.jpg") {
    $docRelsPath = "$tempWork/word/_rels/document.xml.rels"
    $docRels = Get-Content -LiteralPath $docRelsPath -Raw
    if ($docRels -notlike "*rIdBismillah*") {
      $docRels = $docRels.Replace('</Relationships>', '<Relationship Id="rIdBismillah" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/bismillah.jpg"/></Relationships>')
      Set-Content -LiteralPath $docRelsPath -Value $docRels -NoNewline
    }
    $prefix = '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="240" w:before="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="2397125" cy="457200"/><wp:docPr id="100" name="Bismillah"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="100" name="Bismillah"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdBismillah"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2397125" cy="457200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
  }
  ` : ''}

  $newDocXml = [System.Text.RegularExpressions.Regex]::Replace($tplDocXml, '<w:body>.*?</w:body>', "<w:body>$prefix$userBodyContent$tplSectPr</w:body>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
  Set-Content -LiteralPath $tplDocXmlFile -Value $newDocXml -NoNewline

  # Copy user images if present
  $userMediaDir = Join-Path $tempUser "word\\media"
  $tplMediaDir = Join-Path $tempWork "word\\media"
  if (Test-Path $userMediaDir) {
    if (!(Test-Path $tplMediaDir)) { New-Item -ItemType Directory -Path $tplMediaDir | Out-Null }
    Get-ChildItem $userMediaDir | ForEach-Object {
      $destFile = Join-Path $tplMediaDir $_.Name
      if (!(Test-Path $destFile)) {
        Copy-Item $_.FullName $destFile
      }
    }
  }

  $outDir = Split-Path '${outSafe}' -Parent
  $outLeaf = Split-Path '${outSafe}' -Leaf
  if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
  if (Test-Path '${outSafe}') { Remove-Item -Force '${outSafe}' }
  [System.IO.Compression.ZipFile]::CreateFromDirectory($tempWork, (Join-Path (Resolve-Path $outDir).Path $outLeaf))
} finally {
  if (Test-Path $tempWork) { Remove-Item -Recurse -Force $tempWork -ErrorAction SilentlyContinue }
  if (Test-Path $tempUser) { Remove-Item -Recurse -Force $tempUser -ErrorAction SilentlyContinue }
}
`;

  execFileSync('powershell', ['-NoProfile', '-Command', psScript], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

export function generatePdfFromDocx(userDocxPath, templateType, outputPdfPath, options = {}) {
  const browserPath = getBrowserPath();
  const userXml = readDocxBodyXml(userDocxPath);
  const bodyHtml = docxXmlToHtml(userXml);

  const assetsDir = path.resolve('server/src/features/letterheads/assets');

  let headerBase64 = '';
  let footerBase64 = '';
  let watermarkBase64 = '';
  let bismillahBase64 = '';

  if (templateType === 'iipc') {
    const hBytes = fs.readFileSync(path.join(assetsDir, 'iipc_header.jpg'));
    headerBase64 = `data:image/jpeg;base64,${hBytes.toString('base64')}`;
    const fBytes = fs.readFileSync(path.join(assetsDir, 'iipc_footer.jpg'));
    footerBase64 = `data:image/jpeg;base64,${fBytes.toString('base64')}`;
    if (options.includeBismillah !== false) {
      const bBytes = fs.readFileSync(path.join(assetsDir, 'iipc_bismillah.jpg'));
      bismillahBase64 = `data:image/jpeg;base64,${bBytes.toString('base64')}`;
    }
  } else if (templateType === 'bp') {
    const hBytes = fs.readFileSync(path.join(assetsDir, 'bp_header.jpeg'));
    headerBase64 = `data:image/jpeg;base64,${hBytes.toString('base64')}`;
    const fBytes = fs.readFileSync(path.join(assetsDir, 'bp_footer.png'));
    footerBase64 = `data:image/png;base64,${fBytes.toString('base64')}`;
    if (options.includeWatermark !== false) {
      const wBytes = fs.readFileSync(path.join(assetsDir, 'bp_watermark.png'));
      watermarkBase64 = `data:image/png;base64,${wBytes.toString('base64')}`;
    }
  }

  const dateStr = options.date || new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Letterhead Document</title>
<style>
  @page {
    size: letter portrait;
    margin: 0;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    position: relative;
    min-height: 100vh;
  }
  .header-container {
    width: 100%;
  }
  .header-banner {
    width: 100%;
    display: block;
    border: 0;
  }
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 65%;
    opacity: 0.15;
    z-index: 0;
    pointer-events: none;
  }
  .footer-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 10;
  }
  .footer-banner {
    width: 100%;
    display: block;
    border: 0;
  }
  .document-body {
    position: relative;
    z-index: 1;
    padding: 24px 54px 130px 54px;
    font-size: 14px;
    line-height: 1.65;
  }
  .bismillah-center {
    text-align: center;
    margin-bottom: 20px;
  }
  .bismillah-img {
    max-height: 48px;
    display: inline-block;
  }
  .doc-date {
    text-align: right;
    font-weight: 500;
    color: #4b5563;
    margin-bottom: 20px;
    font-size: 13px;
  }
  h1 { font-size: 20px; margin-top: 0; margin-bottom: 14px; color: ${templateType === 'iipc' ? '#0d47a1' : '#c62828'}; }
  h2 { font-size: 17px; margin-top: 14px; margin-bottom: 10px; color: #1e293b; }
  h3 { font-size: 15px; margin-top: 12px; margin-bottom: 8px; color: #334155; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  td, th { border: 1px solid #cbd5e1; padding: 8px 12px; vertical-align: top; }
  ul, ol { margin: 8px 0 8px 24px; padding: 0; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>
  ${headerBase64 ? `<div class="header-container"><img class="header-banner" src="${headerBase64}" alt="Header" /></div>` : ''}

  ${watermarkBase64 ? `<img class="watermark" src="${watermarkBase64}" alt="Watermark" />` : ''}

  <div class="document-body">
    ${bismillahBase64 ? `<div class="bismillah-center"><img class="bismillah-img" src="${bismillahBase64}" alt="Bismillah" /></div>` : ''}
    <div class="doc-date">Date: ${dateStr}</div>
    ${bodyHtml}
  </div>

  ${footerBase64 ? `<div class="footer-container"><img class="footer-banner" src="${footerBase64}" alt="Footer" /></div>` : ''}
</body>
</html>`;

  const outDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tempHtmlPath = path.resolve(`scratch/temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  try {
    const absPdfPath = path.resolve(outputPdfPath);
    execFileSync(browserPath, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      `--print-to-pdf=${absPdfPath}`,
      tempHtmlPath,
    ]);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }

  return { htmlPreview: fullHtml };
}

// -------------------------------------------------------------
// CARD 4: Universal 2-File Merger (Template + Content)
// -------------------------------------------------------------

export function mergeTwoFilesToDocxAndPdf({
  templateFilePath,
  contentFilePath,
  outputDocxPath,
  outputPdfPath,
}) {
  const browserPath = getBrowserPath();
  const tplSafe = templateFilePath.replace(/\\/g, '/');
  const cntSafe = contentFilePath.replace(/\\/g, '/');
  const outDocxSafe = outputDocxPath.replace(/\\/g, '/');

  // 1. Merge into output DOCX using PowerShell
  const psMerge = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tempWork = Join-Path $env:TEMP ("lh_tplmerge_" + [System.Guid]::NewGuid().ToString())
$tempUser = Join-Path $env:TEMP ("lh_usrmerge_" + [System.Guid]::NewGuid().ToString())

try {
  [System.IO.Compression.ZipFile]::ExtractToDirectory('${tplSafe}', $tempWork)
  
  $contentExt = [System.IO.Path]::GetExtension('${cntSafe}').ToLower()
  $userBodyContent = ""

  if ($contentExt -eq ".txt") {
    $txtLines = Get-Content -LiteralPath '${cntSafe}'
    foreach ($line in $txtLines) {
      $esc = [System.Security.SecurityElement]::Escape($line)
      $userBodyContent += "<w:p><w:r><w:t>$esc</w:t></w:r></w:p>"
    }
  } else {
    [System.IO.Compression.ZipFile]::ExtractToDirectory('${cntSafe}', $tempUser)
    $userDocXmlFile = Join-Path $tempUser "word\\document.xml"
    if (!(Test-Path $userDocXmlFile)) {
      $userDocXmlFile = (Get-ChildItem -Recurse $tempUser | Where-Object { $_.FullName -like "*word*document.xml" } | Select-Object -First 1).FullName
    }
    if ($userDocXmlFile -and (Test-Path $userDocXmlFile)) {
      $userDocXml = Get-Content -LiteralPath $userDocXmlFile -Raw
      $bodyMatch = [System.Text.RegularExpressions.Regex]::Match($userDocXml, '<w:body>(.*?)(<w:sectPr.*?</w:sectPr>)?</w:body>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
      if ($bodyMatch.Success) {
        $userBodyContent = $bodyMatch.Groups[1].Value
      }
    }

    # Copy user media if any
    $userMedia = Join-Path $tempUser "word\\media"
    $workMedia = Join-Path $tempWork "word\\media"
    if (Test-Path $userMedia) {
      if (!(Test-Path $workMedia)) { New-Item -ItemType Directory -Path $workMedia | Out-Null }
      Get-ChildItem $userMedia | ForEach-Object {
        $targetFile = Join-Path $workMedia $_.Name
        if (!(Test-Path $targetFile)) {
          Copy-Item $_.FullName $targetFile
        }
      }
    }
  }

  $tplDocXmlFile = Join-Path $tempWork "word\\document.xml"
  if (!(Test-Path $tplDocXmlFile)) {
    $tplDocXmlFile = (Get-ChildItem -Recurse $tempWork | Where-Object { $_.FullName -like "*word*document.xml" } | Select-Object -First 1).FullName
  }
  $tplDocXml = Get-Content -LiteralPath $tplDocXmlFile -Raw

  $tplSectMatch = [System.Text.RegularExpressions.Regex]::Match($tplDocXml, '(<w:sectPr.*?</w:sectPr>)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $tplSectPr = ""
  if ($tplSectMatch.Success) {
    $tplSectPr = $tplSectMatch.Groups[1].Value
  } else {
    $tplSectPr = "<w:sectPr><w:pgSz w:w=""12240"" w:h=""15840""/><w:pgMar w:top=""1440"" w:right=""1440"" w:bottom=""1440"" w:left=""1440"" w:header=""720"" w:footer=""720"" w:gutter=""0""/></w:sectPr>"
  }

  $newDocXml = [System.Text.RegularExpressions.Regex]::Replace($tplDocXml, '<w:body>.*?</w:body>', "<w:body>$userBodyContent$tplSectPr</w:body>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
  Set-Content -LiteralPath $tplDocXmlFile -Value $newDocXml -NoNewline

  $outDir = Split-Path '${outDocxSafe}' -Parent
  $outLeaf = Split-Path '${outDocxSafe}' -Leaf
  if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
  if (Test-Path '${outDocxSafe}') { Remove-Item -Force '${outDocxSafe}' }

  [System.IO.Compression.ZipFile]::CreateFromDirectory($tempWork, (Join-Path (Resolve-Path $outDir).Path $outLeaf))
} finally {
  if (Test-Path $tempWork) { Remove-Item -Recurse -Force $tempWork -ErrorAction SilentlyContinue }
  if (Test-Path $tempUser) { Remove-Item -Recurse -Force $tempUser -ErrorAction SilentlyContinue }
}
`;

  execFileSync('powershell', ['-NoProfile', '-Command', psMerge], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  // 2. Extract Header/Footer images and body for PDF generation
  const psExtractAssets = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tempInspect = Join-Path $env:TEMP ("lh_inspect_" + [System.Guid]::NewGuid().ToString())
try {
  [System.IO.Compression.ZipFile]::ExtractToDirectory('${tplSafe}', $tempInspect)
  $result = @{
    headerImages = @()
    footerImages = @()
    watermarkImages = @()
  }

  # Check header files
  $headers = Get-ChildItem -Recurse $tempInspect | Where-Object { $_.FullName -like "*word*header*.xml" -and $_.FullName -notlike "*rels*" }
  foreach ($h in $headers) {
    $hContent = Get-Content -LiteralPath $h.FullName -Raw
    $relsFile = Join-Path (Split-Path $h.FullName -Parent) ("_rels\\" + $h.Name + ".rels")
    if (Test-Path $relsFile) {
      $relsContent = Get-Content -LiteralPath $relsFile -Raw
      $imgMatches = [System.Text.RegularExpressions.Regex]::Matches($relsContent, 'Target="([^"]+\\.(png|jpeg|jpg))"', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
      foreach ($m in $imgMatches) {
        $imgPath = $m.Groups[1].Value -replace '/', '\\'
        $fullImgPath = Join-Path (Split-Path $h.FullName -Parent) $imgPath
        if (Test-Path $fullImgPath) {
          $bytes = [System.IO.File]::ReadAllBytes($fullImgPath)
          $b64 = [Convert]::ToBase64String($bytes)
          $ext = [System.IO.Path]::GetExtension($fullImgPath).ToLower().TrimStart('.')
          if ($ext -eq "jpg") { $ext = "jpeg" }
          
          if ($hContent -like "*behindDoc=""1""*" -or $fullImgPath -like "*watermark*") {
            $result.watermarkImages += "data:image/$ext;base64,$b64"
          } else {
            $result.headerImages += "data:image/$ext;base64,$b64"
          }
        }
      }
    }
  }

  # Check footer files
  $footers = Get-ChildItem -Recurse $tempInspect | Where-Object { $_.FullName -like "*word*footer*.xml" -and $_.FullName -notlike "*rels*" }
  foreach ($f in $footers) {
    $relsFile = Join-Path (Split-Path $f.FullName -Parent) ("_rels\\" + $f.Name + ".rels")
    if (Test-Path $relsFile) {
      $relsContent = Get-Content -LiteralPath $relsFile -Raw
      $imgMatches = [System.Text.RegularExpressions.Regex]::Matches($relsContent, 'Target="([^"]+\\.(png|jpeg|jpg))"', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
      foreach ($m in $imgMatches) {
        $imgPath = $m.Groups[1].Value -replace '/', '\\'
        $fullImgPath = Join-Path (Split-Path $f.FullName -Parent) $imgPath
        if (Test-Path $fullImgPath) {
          $bytes = [System.IO.File]::ReadAllBytes($fullImgPath)
          $b64 = [Convert]::ToBase64String($bytes)
          $ext = [System.IO.Path]::GetExtension($fullImgPath).ToLower().TrimStart('.')
          if ($ext -eq "jpg") { $ext = "jpeg" }
          $result.footerImages += "data:image/$ext;base64,$b64"
        }
      }
    }
  }

  $json = $result | ConvertTo-Json -Compress
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  [System.Console]::Write($json)
} finally {
  if (Test-Path $tempInspect) { Remove-Item -Recurse -Force $tempInspect -ErrorAction SilentlyContinue }
}
`;

  let assetMeta = { headerImages: [], footerImages: [], watermarkImages: [] };
  try {
    const rawJson = execFileSync('powershell', ['-NoProfile', '-Command', psExtractAssets], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    if (rawJson && rawJson.trim().startsWith('{')) {
      assetMeta = JSON.parse(rawJson.trim());
    }
  } catch (inspectErr) {
    console.warn('Template asset inspection note:', inspectErr.message);
  }

  // Read merged docx body
  const psReadMergedXml = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('${outDocxSafe}')
$entry = $zip.Entries | Where-Object { $_.FullName -replace '\\\\','/' -eq 'word/document.xml' } | Select-Object -First 1
if ($entry) {
  $stream = $entry.Open()
  $reader = New-Object System.IO.StreamReader($stream)
  $content = $reader.ReadToEnd()
  $reader.Dispose()
  $stream.Dispose()
} else {
  $content = ""
}
$zip.Dispose()
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[System.Console]::Write($content)
`;

  const mergedXml = execFileSync('powershell', ['-NoProfile', '-Command', psReadMergedXml], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  const bodyHtml = docxXmlToHtml(mergedXml);

  const headerImgTag =
    assetMeta.headerImages && assetMeta.headerImages.length > 0
      ? `<div class="header-container"><img class="header-banner" src="${assetMeta.headerImages[0]}" alt="Header" /></div>`
      : '';

  const watermarkTag =
    assetMeta.watermarkImages && assetMeta.watermarkImages.length > 0
      ? `<img class="watermark" src="${assetMeta.watermarkImages[0]}" alt="Watermark" />`
      : '';

  const footerImgTag =
    assetMeta.footerImages && assetMeta.footerImages.length > 0
      ? `<div class="footer-container"><img class="footer-banner" src="${assetMeta.footerImages[0]}" alt="Footer" /></div>`
      : '';

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Merged Letterhead Document</title>
<style>
  @page {
    size: letter portrait;
    margin: 0;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    position: relative;
    min-height: 100vh;
  }
  .header-container { width: 100%; }
  .header-banner { width: 100%; display: block; border: 0; }
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 65%;
    opacity: 0.15;
    z-index: 0;
    pointer-events: none;
  }
  .footer-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 10;
  }
  .footer-banner { width: 100%; display: block; border: 0; }
  .document-body {
    position: relative;
    z-index: 1;
    padding: ${headerImgTag ? '24px' : '48px'} 54px 130px 54px;
    font-size: 14px;
    line-height: 1.65;
  }
  h1 { font-size: 20px; margin-top: 0; margin-bottom: 14px; color: #1e3a8a; }
  h2 { font-size: 17px; margin-top: 14px; margin-bottom: 10px; color: #1e293b; }
  h3 { font-size: 15px; margin-top: 12px; margin-bottom: 8px; color: #334155; }
  p { margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  td, th { border: 1px solid #cbd5e1; padding: 8px 12px; vertical-align: top; }
  ul, ol { margin: 8px 0 8px 24px; padding: 0; }
  li { margin-bottom: 4px; }
</style>
</head>
<body>
  ${headerImgTag}
  ${watermarkTag}
  <div class="document-body">
    ${bodyHtml}
  </div>
  ${footerImgTag}
</body>
</html>`;

  const outDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tempHtmlPath = path.resolve(`scratch/merge_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  try {
    const absPdfPath = path.resolve(outputPdfPath);
    execFileSync(browserPath, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      `--print-to-pdf=${absPdfPath}`,
      tempHtmlPath,
    ]);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }

  return { docxPath: outputDocxPath, pdfPath: outputPdfPath };
}

// -------------------------------------------------------------
// CARD 3: Advanced Document Customizer & E-Signature Studio
// -------------------------------------------------------------

function formatNumericValue(val, fmt) {
  const num = parseFloat(val) || 0;
  switch (fmt) {
    case 'currency':
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percent':
      return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
    case 'integer':
      return Math.round(num).toLocaleString('en-US');
    case 'decimal':
    default:
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function generateCustomizedDocument({
  baseType = 'blank', // 'iipc', 'bp', 'blank', 'uploaded'
  userDocxPath = null,
  elements = [],
  options = {},
  outputDocxPath,
  outputPdfPath,
}) {
  const browserPath = getBrowserPath();
  const assetsDir = path.resolve('server/src/features/letterheads/assets');

  let headerBase64 = '';
  let footerBase64 = '';
  let watermarkBase64 = '';
  let bismillahBase64 = '';

  if (baseType === 'iipc') {
    const hBytes = fs.readFileSync(path.join(assetsDir, 'iipc_header.jpg'));
    headerBase64 = `data:image/jpeg;base64,${hBytes.toString('base64')}`;
    const fBytes = fs.readFileSync(path.join(assetsDir, 'iipc_footer.jpg'));
    footerBase64 = `data:image/jpeg;base64,${fBytes.toString('base64')}`;
    if (options.includeBismillah) {
      const bBytes = fs.readFileSync(path.join(assetsDir, 'iipc_bismillah.jpg'));
      bismillahBase64 = `data:image/jpeg;base64,${bBytes.toString('base64')}`;
    }
  } else if (baseType === 'bp') {
    const hBytes = fs.readFileSync(path.join(assetsDir, 'bp_header.jpeg'));
    headerBase64 = `data:image/jpeg;base64,${hBytes.toString('base64')}`;
    const fBytes = fs.readFileSync(path.join(assetsDir, 'bp_footer.png'));
    footerBase64 = `data:image/png;base64,${fBytes.toString('base64')}`;
    if (options.includeWatermark) {
      const wBytes = fs.readFileSync(path.join(assetsDir, 'bp_watermark.png'));
      watermarkBase64 = `data:image/png;base64,${wBytes.toString('base64')}`;
    }
  }

  let baseContentHtml = '';
  if (userDocxPath && fs.existsSync(userDocxPath)) {
    const userXml = readDocxBodyXml(userDocxPath);
    baseContentHtml = docxXmlToHtml(userXml);
  }

  let overlayHtml = '';
  for (const el of elements) {
    const x = el.x ?? 50;
    const y = el.y ?? 50;
    const font = el.font || 'Segoe UI';
    const color = el.color || '#1a1a1a';
    const fontSize = el.fontSize || 14;

    const baseStyle = `position: absolute; left: ${x}px; top: ${y}px; font-family: '${font}', sans-serif; color: ${color}; font-size: ${fontSize}px; z-index: 50;`;

    switch (el.type) {
      case 'date': {
        const dText = el.text || new Date().toISOString().split('T')[0];
        overlayHtml += `<div style="${baseStyle} padding: 4px 8px; background: rgba(255,255,255,0.9); border: 1px dashed #cbd5e1; border-radius: 4px;"><strong>Date:</strong> ${escapeHtml(dText)}</div>`;
        break;
      }
      case 'signature': {
        const w = el.width || 180;
        const h = el.height || 60;
        if (el.dataUrl) {
          overlayHtml += `<div style="${baseStyle}"><img src="${el.dataUrl}" style="width: ${w}px; height: ${h}px; object-fit: contain; display: block;" /><div style="font-size: 10px; color: #64748b; border-top: 1px solid #000; padding-top: 2px;">Authorized Signature</div></div>`;
        }
        break;
      }
      case 'text': {
        overlayHtml += `<div style="${baseStyle} padding: 4px 8px; background: rgba(255,255,255,0.85); border-radius: 4px; max-width: 400px; white-space: pre-wrap;">${escapeHtml(el.text || '')}</div>`;
        break;
      }
      case 'checkbox': {
        const symbol = el.checked ? '&#9745;' : '&#9744;';
        overlayHtml += `<div style="${baseStyle} display: flex; align-items: center; gap: 6px;"><span style="font-size: ${fontSize + 4}px; color: ${el.checked ? '#16a34a' : '#64748b'};">${symbol}</span><span>${escapeHtml(el.label || el.text || '')}</span></div>`;
        break;
      }
      case 'radio': {
        const symbol = el.checked ? '&#9673;' : '&#9678;';
        overlayHtml += `<div style="${baseStyle} display: flex; align-items: center; gap: 6px;"><span style="font-size: ${fontSize + 4}px; color: ${el.checked ? '#2563eb' : '#64748b'};">${symbol}</span><span>${escapeHtml(el.label || el.text || '')}</span></div>`;
        break;
      }
      case 'checkmark': {
        const size = el.size || 24;
        overlayHtml += `<div style="${baseStyle} font-size: ${size}px; font-weight: bold; color: ${color || '#16a34a'};">&#10004;</div>`;
        break;
      }
      case 'crossmark': {
        const size = el.size || 24;
        overlayHtml += `<div style="${baseStyle} font-size: ${size}px; font-weight: bold; color: ${color || '#dc2626'};">&#10006;</div>`;
        break;
      }
      case 'numeric': {
        const formatted = formatNumericValue(el.value ?? el.text, el.format);
        overlayHtml += `<div style="${baseStyle} padding: 4px 10px; background: rgba(255,255,255,0.9); border: 1px solid #cbd5e1; border-radius: 4px; font-variant-numeric: tabular-nums; font-weight: 600;">${escapeHtml(formatted)}</div>`;
        break;
      }
      case 'image': {
        const w = el.width || 120;
        const h = el.height || 120;
        if (el.dataUrl) {
          overlayHtml += `<div style="${baseStyle}"><img src="${el.dataUrl}" style="width: ${w}px; height: ${h}px; object-fit: contain; display: block;" /></div>`;
        }
        break;
      }
    }
  }

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Customized Letterhead Document</title>
<style>
  @page {
    size: letter portrait;
    margin: 0;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1a1a1a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    position: relative;
    min-height: 100vh;
    width: 8.5in;
  }
  .header-container { width: 100%; }
  .header-banner { width: 100%; display: block; }
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 65%;
    opacity: 0.15;
    z-index: 0;
    pointer-events: none;
  }
  .footer-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 10;
  }
  .footer-banner { width: 100%; display: block; }
  .document-body {
    position: relative;
    z-index: 1;
    padding: ${headerBase64 ? '20px' : '40px'} 54px 130px 54px;
    font-size: 14px;
    line-height: 1.65;
    min-height: 800px;
  }
  .interactive-canvas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 20;
  }
</style>
</head>
<body>
  ${headerBase64 ? `<div class="header-container"><img class="header-banner" src="${headerBase64}" alt="Header" /></div>` : ''}
  ${watermarkBase64 ? `<img class="watermark" src="${watermarkBase64}" alt="Watermark" />` : ''}

  <div class="document-body">
    ${bismillahBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img style="max-height: 48px;" src="${bismillahBase64}" alt="Bismillah" /></div>` : ''}
    ${baseContentHtml}
  </div>

  <div class="interactive-canvas-overlay">
    ${overlayHtml}
  </div>

  ${footerBase64 ? `<div class="footer-container"><img class="footer-banner" src="${footerBase64}" alt="Footer" /></div>` : ''}
</body>
</html>`;

  const outDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tempHtmlPath = path.resolve(`scratch/custom_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  try {
    const absPdfPath = path.resolve(outputPdfPath);
    execFileSync(browserPath, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      `--print-to-pdf=${absPdfPath}`,
      tempHtmlPath,
    ]);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
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

  const tempDocxDir = path.dirname(outputDocxPath);
  if (!fs.existsSync(tempDocxDir)) fs.mkdirSync(tempDocxDir, { recursive: true });

  const psMergeCustom = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$tempWork = Join-Path $env:TEMP ("lh_cust_" + [System.Guid]::NewGuid().ToString())
try {
  [System.IO.Compression.ZipFile]::ExtractToDirectory('${templateFile.replace(/\\/g, '/')}', $tempWork)
  $docXmlPath = Join-Path $tempWork "word\\document.xml"
  $docXml = Get-Content -LiteralPath $docXmlPath -Raw

  $tplSectMatch = [System.Text.RegularExpressions.Regex]::Match($docXml, '(<w:sectPr.*?</w:sectPr>)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $tplSectPr = $tplSectMatch.Groups[1].Value

  $userBody = ""
  ${userDocxPath && fs.existsSync(userDocxPath) ? `
  $tempUser = Join-Path $env:TEMP ("lh_usr_sub_" + [System.Guid]::NewGuid().ToString())
  try {
    [System.IO.Compression.ZipFile]::ExtractToDirectory('${userDocxPath.replace(/\\/g, '/')}', $tempUser)
    $uXml = Get-Content -LiteralPath (Join-Path $tempUser "word\\document.xml") -Raw
    $bMatch = [System.Text.RegularExpressions.Regex]::Match($uXml, '<w:body>(.*?)(<w:sectPr.*?</w:sectPr>)?</w:body>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if ($bMatch.Success) { $userBody = $bMatch.Groups[1].Value }
  } finally {
    if (Test-Path $tempUser) { Remove-Item -Recurse -Force $tempUser -ErrorAction SilentlyContinue }
  }
  ` : ''}

  $customElementsXml = @'
${customXmlElements}
'@

  $newDocXml = [System.Text.RegularExpressions.Regex]::Replace($docXml, '<w:body>.*?</w:body>', "<w:body>$userBody$customElementsXml$tplSectPr</w:body>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
  Set-Content -LiteralPath $docXmlPath -Value $newDocXml -NoNewline

  $outDir = Split-Path '${outputDocxPath.replace(/\\/g, '/')}' -Parent
  $outLeaf = Split-Path '${outputDocxPath.replace(/\\/g, '/')}' -Leaf
  if (Test-Path '${outputDocxPath.replace(/\\/g, '/')}') { Remove-Item -Force '${outputDocxPath.replace(/\\/g, '/')}' }
  [System.IO.Compression.ZipFile]::CreateFromDirectory($tempWork, (Join-Path (Resolve-Path $outDir).Path $outLeaf))
} finally {
  if (Test-Path $tempWork) { Remove-Item -Recurse -Force $tempWork -ErrorAction SilentlyContinue }
}
`;

  execFileSync('powershell', ['-NoProfile', '-Command', psMergeCustom], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  return {
    docxPath: outputDocxPath,
    pdfPath: outputPdfPath,
  };
}
