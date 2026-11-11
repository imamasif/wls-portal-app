import nodemailer from 'nodemailer';
import fs from 'fs';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
  } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendPasswordResetEmail = async ({ to, userName, resetUrl }) => {
  const mailTransporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@iipccanada.com';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; color: #ffffff; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
        .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #0f766e; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2); }
        .footer { padding: 20px 28px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5; }
        .link-text { word-break: break-all; color: #0f766e; font-size: 12px; }
        .note-box { background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #134e4a; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>WLS Portal — Password Reset</h1>
        </div>
        <div class="content">
          <p class="greeting">Hello ${userName || 'there'},</p>
          <p class="message">
            We received a request to reset your password for your <strong>WLS Portal</strong> account.
            Click the secure button below to set a new password:
          </p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset My Password</a>
          </div>
          <div class="note-box">
            ⏰ <strong>Note:</strong> This link is secure and will expire in <strong>1 hour</strong>.
          </div>
          <p class="message" style="margin-top: 24px; font-size: 13px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" class="link-text">${resetUrl}</a>
          </p>
          <p class="message" style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
            If you did not request a password reset, you can safely ignore this email. Your current password remains unchanged.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} IIPC Canada — WLS Portal. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!mailTransporter) {
    console.log('\n=============================================================');
    console.log('📧 [DEV EMAIL SIMULATOR] Password Reset Email');
    console.log(`To: ${to} (${userName})`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('(SMTP credentials not configured in .env - Simulated sending)');
    console.log('=============================================================\n');
    return { success: true, simulated: true, resetUrl };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: `"WLS Portal Support" <${fromEmail}>`,
      to,
      subject: 'Password Reset Request — WLS Portal',
      html: htmlContent,
      text: `Hello ${userName || 'there'},\n\nYou requested a password reset for your WLS Portal account.\nPlease visit the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\nIf you did not request this, please ignore this email.`
    });
    console.log(`✅ Password reset email sent to ${to}: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId, resetUrl };
  } catch (err) {
    console.error(`❌ Failed to send password reset email to ${to}:`, err.message);
    return { success: false, simulated: true, error: err.message, resetUrl };
  }
};

export const sendBoardMeetingMinutesEmail = async ({
  to = ['info@iipccanada.com', 'accounts@iipccanada.com'],
  meetingDate = 'November 7th, 2026',
  meetingTime = '9:00 AM Eastern Time',
  title = 'Board Meeting Minutes',
  signatories = [],
  docxPath,
  pdfPath,
  docxName = 'Board_Meeting_Minutes.docx',
  pdfName = 'Board_Meeting_Minutes.pdf',
}) => {
  const mailTransporter = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@iipccanada.com';
  const recipients = Array.isArray(to) ? to.join(', ') : to;
  const subject = `Board Meeting Minutes : ${meetingDate} ${meetingTime}`;

  const allSignatories = signatories || [];
  const attendingSignatories = allSignatories.filter((s) => s.attending !== false);
  const absentSignatories = allSignatories.filter((s) => s.attending === false);

  const signatoriesHtml = attendingSignatories
    .map(
      (s) => `
        <li style="margin-bottom: 6px;">
          <strong>${s.role}:</strong> ${s.name} 
          <span style="color: #16a34a; font-weight: bold;">(Signed ${s.signDate || ''} ${s.signTime || ''})</span>
        </li>
      `
    )
    .join('');

  const absentHtml = absentSignatories.length > 0
    ? `
      <div style="margin-top: 14px; padding: 10px 14px; background: #f1f5f9; border-radius: 6px; font-size: 12.5px; color: #475569;">
        <strong style="color: #334155;">Officers Excused / Not Attending This Meeting:</strong><br/>
        ${absentSignatories.map((s) => `${s.name} (${s.role})`).join(', ')}
      </div>
    `
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
        .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; }
        .meta-box { background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
        .meta-box p { margin: 4px 0; font-size: 13.5px; }
        .signatories-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
        .footer { padding: 16px 24px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Islamic Information &amp; Predestination Centre (IIPC Canada)</h1>
          <p>Official Board of Directors Documentation</p>
        </div>
        <div class="content">
          <p>Dear IIPC Administration &amp; Accounts Team,</p>
          <p>Please find attached the official, ratified <strong>Board Meeting Minutes</strong> formatted with the official IIPC Canada letterhead and verified digital signatures of all attending directors and executive officers.</p>
          <div class="meta-box">
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Meeting Date:</strong> ${meetingDate}</p>
            <p><strong>Meeting Time:</strong> ${meetingTime}</p>
            <p><strong>Location:</strong> Online - Zoom</p>
          </div>
          <div class="signatories-box">
            <h4 style="margin: 0 0 10px 0; color: #0f766e;">Ratified Signatories:</h4>
            <ul style="padding-left: 20px; margin: 0;">
              ${signatoriesHtml}
            </ul>
            ${absentHtml}
          </div>
          <p style="font-size: 13px; color: #64748b;">
            📎 <strong>Attached Files:</strong><br/>
            1. <strong>${docxName}</strong> (Official Microsoft Word Document with Letterhead &amp; Signatures)<br/>
            2. <strong>${pdfName}</strong> (Official Print-Ready PDF with Letterhead &amp; Signatures)
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} IIPC Canada. All rights reserved. &bull; <a href="https://iipccanada.com" style="color: #0d9488;">iipccanada.com</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (docxPath && fs.existsSync(docxPath)) {
    attachments.push({ filename: docxName, path: docxPath });
  }
  if (pdfPath && fs.existsSync(pdfPath)) {
    attachments.push({ filename: pdfName, path: pdfPath });
  }

  if (!mailTransporter) {
    console.log('\n=============================================================');
    console.log('📧 [DEV EMAIL SIMULATOR] Board Meeting Minutes Email');
    console.log(`To: ${recipients}`);
    console.log(`Subject: ${subject}`);
    console.log(`Attachments: ${attachments.map((a) => a.filename).join(', ')}`);
    console.log('(SMTP credentials not configured in .env - Simulated sending)');
    console.log('=============================================================\n');
    return { success: true, simulated: true, subject, recipients };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: `"IIPC Board Secretary" <${fromEmail}>`,
      to: recipients,
      subject,
      html: htmlContent,
      attachments,
    });
    console.log(`✅ Board Meeting Minutes email successfully sent to ${recipients}: ${info.messageId}`);
    return { success: true, simulated: false, messageId: info.messageId, subject, recipients };
  } catch (err) {
    console.error(`❌ Failed to send Board Meeting Minutes email to ${recipients}:`, err.message);
    return { success: false, simulated: true, error: err.message, subject, recipients };
  }
};
