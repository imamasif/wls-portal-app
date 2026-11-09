import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import JSZip from 'jszip';
import { getBrowserPath, escapeHtml } from './letterhead.service.js';
import { MeetingMinutes } from './meetingMinutes.model.js';
import { sendBoardMeetingMinutesEmail } from '../../common/services/email.service.js';

export const DEFAULT_BOARD_MEETING_MINUTES = {
  title: 'MEETING MINUTES — IIPC Canada 2026 3rd Quarter Meeting',
  meetingDate: 'November 7th, 2026',
  meetingTime: '9:00 AM Eastern Time',
  location: 'Online- Zoom',
  callToOrder: 'IIPC Canada 2026 3rd Quarter Meeting',
  contentHtml: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.65; color: #1e293b;">
      <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 14px 0 6px 0;">Meeting to Discuss</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12.5px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 6px 10px; width: 40px; text-align: center;">#</th>
            <th style="border: 1px solid #cbd5e1; padding: 6px 10px;">Agenda Items</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; font-weight: bold;">1</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">IIPC Canada’s School Progress Update</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; font-weight: bold;">2</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Marketing Initiatives</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px; text-align: center; font-weight: bold;">3</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px;">Financial Update &amp; Strategies</td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 14px 0 6px 0;">Attendee Names</h3>
      <p style="margin: 4px 0; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #0d9488;">
        Alam Mohammad, Fawad Gilani, Moin ur Rehman, Eisha Omar, Asif Imam, Adnan Kaleemi, Aazim Omer.
      </p>

      <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 14px 0 6px 0;">Volunteers/Guests Names</h3>
      <p style="margin: 4px 0; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #6366f1;">
        Nasir Khan, Yahya Khan, Syed Imran &amp; Naveed Qureshi
      </p>

      <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 16px 0 6px 0;">Proceedings</h3>
      <p style="margin: 6px 0;">The MD determined and reported that the notice of the meeting had been properly given or waved by directors in accordance with the By-Laws. The meeting was called to order. It was determined that a quorum was present online (in accordance with the By-Laws), and the meeting could conduct business.</p>
      <p style="margin: 6px 0;">The meeting began and the last board meeting minutes were reviewed and approved.</p>

      <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 16px 0 6px 0;">Meeting Agendas &amp; Resolutions</h3>
      <p style="margin: 6px 0;">Following agendas, that were identified over previous discussions with MD and other concerned members and associates in person, over Telephonic and Email communications, were highlighted and timelines set (where possible) for execution, or related motions passed and ratified.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 35px; text-align: center;">#</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 220px;">Agenda Title</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px;">Proceedings, Resolutions &amp; Timelines</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-weight: bold;">1</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: 600; color: #1e293b;">IIPC Canada's School Progress Update</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">
              <p style="margin: 0 0 6px 0;"><strong>Arabic Translation and Online Learning Portal Development:</strong> A total of 11 Urdu booklets and 9 English booklets have been recorded for Arabic translation. Additionally, 4 lectures with literal translations and 2 quizzes have been uploaded to the school forum, with further videos to be developed based on the newly updated Color Coded booklets.</p>
              <p style="margin: 0 0 6px 0;">The team identified Brother Asif’s nearly completed custom-built learning portal as a superior replacement for the existing paid Tutor LMS. The new portal offers enhanced functionality, including WLS integration, session management, user tracking, lecture categorization, greater administrative control, and a reference-memorization game. Through WLS integration, administrators can assign specific lecture parts to users, who then upload their video presentations to Google Drive for assessment.</p>
              <p style="margin: 0 0 6px 0;">The team plans to migrate the online school from Tutor LMS to the custom-built portal, either through API integration with the existing learning portal or by rebuilding the LMS functionality within the new system. The target timeline for integration and migration is 1–2 months. A small group of administrators and students will test the portal before its full rollout.</p>
              <p style="margin: 0;"><strong>User Registration and Security:</strong> The portal will require users to register using a government-issued identification document (e.g. driver's license) to prevent fake accounts. For security and privacy, submitted IDs will be downloaded and subsequently deleted from the online server.</p>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-weight: bold;">2</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: 600; color: #1e293b;">Marketing Initiatives</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">
              <strong>Digital Marketing:</strong> Br Yahya has been given the responsibility and appointed as the single point of contact for IIPC Canada’s digital marketing, overseeing YouTube, TikTok, and other social media platforms, with particular emphasis on promoting English content to address its comparatively lower viewership than Urdu content.
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; font-weight: bold;">3</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px; font-weight: 600; color: #1e293b;">Financial Update &amp; Strategies</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 10px;">
              <strong>Fundraising and Financial Sustainability:</strong> The organization has approximately $40,000 in monthly expenditures, primarily covering basic salaries, creating an ongoing need for additional funding. The new fundraising strategy will prioritize targeted, project-based appeals for specific needs, such as construction and operational costs, rather than general fundraising appeals. All board and administrative members are tasked with collectively raising $10,000 per month through relationship-building and direct phone outreach. Additionally, the team will identify and approach corporate and nonprofit organizations to explore potential grant opportunities.
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 16px 0 6px 0;">Other Motions/Ratifications</h3>
      <p style="margin: 6px 0; color: #64748b; font-style: italic;">No additional motions recorded.</p>

      <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 16px 0 6px 0;">Adjournment</h3>
      <p style="margin: 6px 0;">There was no further business, and upon motion made, seconded, and unanimously carried, it was <strong>RESOLVED</strong>, that all the items and documents have been examined by all the directors, and are approved and adopted, and that all actions taken thus far have been ratified and approved by the directors of the Charity.</p>
      <p style="margin: 6px 0;">There being no further business, upon motion made and carried, the meeting was adjourned.</p>
    </div>
  `,
  signatories: [
    { role: 'SECRETARY', name: 'AAZIM KAMAL OMER', isSigned: false },
    { role: 'EXECUTIVE DIRECTOR', name: 'ALAM MOHAMMAD', isSigned: false },
    { role: 'MANAGING DIRECTOR', name: 'FAWAD GILANI', isSigned: false },
    { role: 'DIRECTOR', name: 'MOIN UR REHMAN', isSigned: false },
    { role: 'DIRECTOR', name: 'EISHA OMAR', isSigned: false },
    { role: 'DIRECTOR', name: 'ASIF IMAM', isSigned: false },
    { role: 'DIRECTOR', name: 'ADNAN KALEEMI', isSigned: false },
  ],
};

/**
 * Ensures at least one active Board Meeting Minutes record exists in DB.
 */
export async function ensureDefaultMeetingMinutes() {
  let doc = await MeetingMinutes.findOne().sort({ createdAt: -1 });
  if (!doc) {
    doc = await MeetingMinutes.create({
      ...DEFAULT_BOARD_MEETING_MINUTES,
      status: 'PENDING_SIGNATURES',
    });
  }
  return doc;
}

/**
 * Compiles official Meeting Minutes document with IIPC Letterhead and all signatories.
 */
export async function generateBoardMeetingMinutesDocument({
  meetingMinute,
  outputDocxPath,
  outputPdfPath,
}) {
  const assetsDir = path.resolve('server/src/features/letterheads/assets');

  let headerBase64 = '';
  let footerBase64 = '';
  let bismillahBase64 = '';

  if (fs.existsSync(path.join(assetsDir, 'iipc_header.jpg'))) {
    headerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_header.jpg')).toString('base64')}`;
  }
  if (fs.existsSync(path.join(assetsDir, 'iipc_footer.jpg'))) {
    footerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_footer.jpg')).toString('base64')}`;
  }
  if (fs.existsSync(path.join(assetsDir, 'iipc_bismillah.jpg'))) {
    bismillahBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, 'iipc_bismillah.jpg')).toString('base64')}`;
  }

  const signatories = meetingMinute.signatories || [];

  // Build Signatures HTML Grid (2-column layout for clean, official alignment)
  const sigBlocksHtml = signatories
    .map((s) => {
      const isSigned = s.isSigned && s.signatureDataUrl;
      const sigImg = isSigned
        ? `<img src="${s.signatureDataUrl}" style="max-height: 52px; max-width: 170px; object-fit: contain; display: block; margin: 0 auto;" alt="Signature" />`
        : `<div style="color: #94a3b8; font-style: italic; font-size: 11px; padding: 14px 0; text-align: center;">(Signature &amp; Date)</div>`;

      return `
        <div style="width: 48%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 14px; background: #f8fafc; margin-bottom: 14px; page-break-inside: avoid; display: inline-block; vertical-align: top;">
          <div style="font-weight: 700; font-size: 11.5px; color: #1e3a8a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">
            ${escapeHtml(s.role)}:
          </div>
          <div style="height: 54px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #94a3b8; margin-bottom: 6px;">
            ${sigImg}
          </div>
          <div style="font-weight: 700; font-size: 12.5px; color: #0f172a; text-transform: uppercase;">
            ${escapeHtml(s.name)}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
            <strong>Date:</strong> ${escapeHtml(s.signDate || meetingMinute.meetingDate || '')} &bull; <strong>Time:</strong> ${escapeHtml(s.signTime || meetingMinute.meetingTime || '')}
          </div>
        </div>
      `;
    })
    .join('');

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
    font-size: 13px;
    line-height: 1.6;
  }
  .header-img { width: 100%; display: block; }
  .footer-img { width: 100%; display: block; }
  .content-wrap {
    padding: 24px 44px;
    position: relative;
    z-index: 5;
    min-height: 600px;
    padding-bottom: 140px;
  }
  .bismillah-wrap { text-align: center; margin: 0 0 16px 0; }
  .bismillah-img { max-height: 44px; }
  h1 { font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; margin: 12px 0 6px 0; letter-spacing: 0.5px; }
  h2 { font-size: 15px; font-weight: 700; color: #1e3a8a; margin: 16px 0 8px 0; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; }
  .meta-grid { display: flex; flex-wrap: wrap; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px; }
  .meta-item { width: 48%; margin: 3px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 7px 10px; vertical-align: top; text-align: left; }
  th { background-color: #f1f5f9; font-weight: 700; color: #0f172a; }
  .sign-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20px; }
  .footer-fixed { position: fixed; bottom: 0; left: 0; width: 100%; }
</style>
</head>
<body>
  ${headerBase64 ? `<img src="${headerBase64}" class="header-img"/>` : ''}
  <div class="content-wrap">
    ${bismillahBase64 ? `<div class="bismillah-wrap"><img src="${bismillahBase64}" class="bismillah-img"/></div>` : ''}
    
    <h1>${escapeHtml(meetingMinute.title || 'BOARD MEETING MINUTES')}</h1>
    
    <div class="meta-grid">
      <div class="meta-item"><strong>DATE:</strong> ${escapeHtml(meetingMinute.meetingDate || '')}</div>
      <div class="meta-item"><strong>TIME:</strong> ${escapeHtml(meetingMinute.meetingTime || '')}</div>
      <div class="meta-item"><strong>LOCATION:</strong> ${escapeHtml(meetingMinute.location || 'Online- Zoom')}</div>
      <div class="meta-item"><strong>CALL TO ORDER:</strong> ${escapeHtml(meetingMinute.callToOrder || '')}</div>
    </div>

    ${meetingMinute.contentHtml || ''}

    <h2>BOARD OF DIRECTORS RATIFICATION &amp; SIGNATURES</h2>
    <div class="sign-grid">
      ${sigBlocksHtml}
    </div>
  </div>
  ${footerBase64 ? `<div class="footer-fixed"><img src="${footerBase64}" class="footer-img"/></div>` : ''}
</body>
</html>`;

  // Render PDF
  const outDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const tempHtmlPath = path.resolve(`server/uploads/bmm_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
  fs.writeFileSync(tempHtmlPath, fullPdfHtml, 'utf8');

  try {
    const browserPath = getBrowserPath();
    if (browserPath) {
      const absPdfPath = path.resolve(outputPdfPath);
      execFileSync(browserPath, [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
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

  // Generate DOCX with IIPC Template & JSZip
  const templatePath = path.join(assetsDir, 'iipc_template.docx');
  const tplData = fs.readFileSync(templatePath);
  const tplZip = await JSZip.loadAsync(tplData);

  // Convert signatories into OpenXML paragraphs
  let sigDocxXml = '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="28"/><w:color w:val="1E3A8A"/></w:rPr><w:t>BOARD OF DIRECTORS RATIFICATION &amp; SIGNATURES</w:t></w:r></w:p>';

  for (const s of signatories) {
    const sDate = s.signDate || meetingMinute.meetingDate || '';
    const sTime = s.signTime || meetingMinute.meetingTime || '';
    sigDocxXml += `
      <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/><w:color w:val="1E3A8A"/></w:rPr><w:t>${escapeHtml(s.role)}:</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:rFonts w:ascii="Brush Script MT"/><w:i/><w:sz w:val="32"/><w:color w:val="0F172A"/></w:rPr><w:t>${s.isSigned ? 'Signed digitally by: ' + escapeHtml(s.name) : '(Signature &amp; Date)'}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>${escapeHtml(s.name)}</w:t></w:r></w:p>
      <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>Date: ${escapeHtml(sDate)} | Time: ${escapeHtml(sTime)}</w:t></w:r></w:p>
      <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CBD5E1"/></w:pBdr></w:pPr></w:p>
    `;
  }

  // Convert Meeting Minutes Text / Meta into OpenXML
  let meetingBodyXml = `
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr><w:t>${escapeHtml(meetingMinute.title || 'BOARD MEETING MINUTES')}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/></w:rPr><w:t>DATE: ${escapeHtml(meetingMinute.meetingDate || '')}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/></w:rPr><w:t>TIME: ${escapeHtml(meetingMinute.meetingTime || '')}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/></w:rPr><w:t>LOCATION: ${escapeHtml(meetingMinute.location || 'Online- Zoom')}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:b/><w:sz w:val="22"/><w:color w:val="1E3A8A"/></w:rPr><w:t>CALL TO ORDER: ${escapeHtml(meetingMinute.callToOrder || '')}</w:t></w:r></w:p>
  `;

  if (meetingMinute.contentHtml) {
    const rawParagraphs = meetingMinute.contentHtml
      .replace(/<table[\s\S]*?<\/table>/gi, '')
      .split(/<\/(?:p|h[1-6]|li)>/gi)
      .map((p) => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    for (const p of rawParagraphs) {
      meetingBodyXml += `<w:p><w:r><w:rPr><w:rFonts w:ascii="Segoe UI"/><w:sz w:val="22"/></w:rPr><w:t>${escapeHtml(p)}</w:t></w:r></w:p>`;
    }
  }

  const tplDocXmlFile =
    tplZip.file('word/document.xml') ||
    Object.values(tplZip.files).find((f) => f.name.replace(/\\/g, '/').toLowerCase() === 'word/document.xml');

  const docXml = tplDocXmlFile ? await tplDocXmlFile.async('text') : '';
  const tplSectMatch = docXml.match(/(<w:sectPr[\s\S]*?<\/w:sectPr>)/s);
  const tplSectPr = tplSectMatch ? tplSectMatch[1] : '';

  const newDocXml = docXml.replace(/<w:body>[\s\S]*?<\/w:body>/s, `<w:body>${meetingBodyXml}${sigDocxXml}${tplSectPr}</w:body>`);
  tplZip.file('word/document.xml', newDocXml);

  const outDocxBuffer = await tplZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.mkdirSync(path.dirname(outputDocxPath), { recursive: true });
  fs.writeFileSync(outputDocxPath, outDocxBuffer);

  return {
    docxPath: outputDocxPath,
    pdfPath: outputPdfPath,
  };
}
