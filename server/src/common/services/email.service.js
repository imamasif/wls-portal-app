import nodemailer from 'nodemailer';

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
