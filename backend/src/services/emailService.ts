import { env } from '../config/env';

export interface SendEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendTransactionalEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; mocked?: boolean; error?: string }> {
  const { toEmail, toName, subject, htmlContent, textContent } = options;
  const safeRecipient = toEmail && toEmail.includes('@') ? `${toEmail.substring(0, 3)}...${toEmail.substring(toEmail.indexOf('@'))}` : toEmail;
  console.log(`[BREVO_EMAIL_START] Recipient: ${safeRecipient}, Subject: "${subject}"`);
  console.log(`[BREVO_EMAIL_CONFIG] Key Configured: ${Boolean(env.BREVO_API_KEY)}, Sender: "${env.BREVO_SENDER_NAME}" <${env.BREVO_SENDER_EMAIL}>`);

  // If no Brevo API key is configured or during test mode, log and mock gracefully
  if (!env.BREVO_API_KEY || env.isTest) {
    if (env.isDevelopment && !env.isTest) {
      console.log(`[BREVO_EMAIL_MOCKED] No BREVO_API_KEY set. Simulating delivery.`);
    }
    return { success: true, mocked: true, messageId: `mock-msg-${Date.now()}` };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: env.BREVO_SENDER_NAME,
          email: env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: toEmail,
            name: toName || toEmail.split('@')[0],
          },
        ],
        subject,
        htmlContent,
        textContent: textContent || subject,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`[BREVO_EMAIL_RESPONSE] HTTP Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const statusCode = response.status;
      const rawMessage = (errorData as any)?.message || `Brevo API request failed with status ${statusCode}`;
      console.error(`[Brevo Email Delivery Failed] HTTP ${statusCode}: ${rawMessage}`);

      let userFacingError = 'Failed to deliver email message. Please try again.';
      if (statusCode === 400) {
        userFacingError = 'Invalid email recipient address or mail request.';
      } else if (statusCode === 401 || statusCode === 403) {
        userFacingError = 'Email service authentication error. Please contact administrator.';
      } else if (statusCode === 429) {
        userFacingError = 'Email rate limit exceeded. Please wait a moment before retrying.';
      }

      return {
        success: false,
        error: userFacingError,
      };
    }

    const data = await response.json();
    return { success: true, messageId: (data as any)?.messageId || `brevo-msg-${Date.now()}` };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('[Brevo Email Timeout] Network request timed out after 10 seconds');
      return { success: false, error: 'Email service request timed out. Please try again.' };
    }
    console.error('[Brevo Email Exception]', err.message || err);
    return { success: false, error: 'Network error connecting to email service.' };
  }
}

// ----------------- TEMPLATES -----------------

// ----------------- CLEAN PROFESSIONAL EMAIL TEMPLATES (MIRO UI STYLE) -----------------

const POINTX_LOGO_CDN = 'https://res.cloudinary.com/dmrajgls8/image/upload/v1787681020/pointx/brand/pointx-logo-email.png';
const POINTX_OFFICIAL_URL = 'https://pointx.in/';

interface EmailLayoutOptions {
  title: string;
  recipientName?: string;
  greeting?: string;
  bodyParagraphs: string[];
  otpCode?: string;
  ctaText?: string;
  ctaUrl?: string;
  disclaimerText?: string;
}

export function renderPointXEmailLayout(options: EmailLayoutOptions): string {
  const {
    title,
    recipientName = 'Organizer',
    greeting,
    bodyParagraphs,
    otpCode,
    ctaText,
    ctaUrl = POINTX_OFFICIAL_URL,
    disclaimerText = "If you didn't create an account in PointX, please ignore this message.",
  } = options;

  const formattedGreeting = greeting || `Hello ${recipientName},`;
  const formattedOtp = otpCode ? otpCode.split('').join('  ') : '';

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td, div, p, a, h1, h2, h3 { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f4f6fa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f6fa;
      padding: 24px 0 40px 0;
    }
    .main-card {
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
    }
    .header-cell {
      padding: 28px 28px 16px 28px;
    }
    .logo-img {
      height: 28px;
      width: auto;
      max-width: 130px;
      display: block;
      border: 0;
    }
    .nav-btn {
      display: inline-block;
      padding: 6px 14px;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      color: #2563eb !important;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }
    .content-cell {
      padding: 0 28px 32px 28px;
    }
    .email-title {
      font-size: 26px;
      font-weight: 800;
      color: #0b0c2a;
      margin: 8px 0 14px 0;
      letter-spacing: -0.5px;
      line-height: 1.25;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 12px 0;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.6;
      color: #5c667a;
      margin: 0 0 16px 0;
    }
    .otp-box {
      background-color: #f1f4fa;
      border-radius: 8px;
      padding: 24px 16px;
      text-align: center;
      margin: 20px 0 16px 0;
    }
    .otp-digits {
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 36px;
      font-weight: 800;
      color: #0b0c2a;
      letter-spacing: 10px;
      margin: 0;
      word-break: break-all;
    }
    .sub-note {
      font-size: 13px;
      color: #64748b;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
    .cta-label {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 10px 0;
    }
    .cta-btn {
      background-color: #2563eb;
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      display: inline-block;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
    }
    .disclaimer {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 20px 0 0 0;
    }
    .footer-cell {
      max-width: 540px;
      margin: 20px auto 0 auto;
      text-align: center;
      padding: 0 16px;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <!-- MAIN CARD -->
          <table width="100%" class="main-card" cellpadding="0" cellspacing="0" border="0">
            
            <!-- HEADER ROW: SINGLE ROW GUARANTEED -->
            <tr>
              <td class="header-cell">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" valign="middle" style="white-space: nowrap;">
                      <a href="${POINTX_OFFICIAL_URL}" target="_blank" style="text-decoration: none; display: inline-block;">
                        <img src="${POINTX_LOGO_CDN}" alt="PointX" class="logo-img" />
                      </a>
                    </td>
                    <td align="right" valign="middle" style="white-space: nowrap;">
                      <a href="${POINTX_OFFICIAL_URL}" target="_blank" class="nav-btn">Go to PointX</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CARD CONTENT -->
            <tr>
              <td class="content-cell">
                <h1 class="email-title">${title}</h1>
                <p class="greeting">${formattedGreeting}</p>

                ${bodyParagraphs.map(p => `<p class="paragraph">${p}</p>`).join('')}

                ${otpCode ? `
                <!-- OTP CARD CONTAINER -->
                <div class="otp-box">
                  <div class="otp-digits">${formattedOtp}</div>
                </div>
                <p class="sub-note">From your mobile device or browser, use the 6-digit code to confirm email (valid for 5 minutes).</p>
                ` : ''}

                ${ctaText ? `
                <!-- PRIMARY CTA BUTTON -->
                <p class="cta-label">Or click this button to confirm your email:</p>
                <div style="margin: 0 0 20px 0;">
                  <a href="${ctaUrl}" target="_blank" class="cta-btn">${ctaText}</a>
                </div>
                ` : ''}

                <p class="disclaimer">${disclaimerText}</p>
              </td>
            </tr>
          </table>

          <!-- OUTER FOOTER -->
          <div class="footer-cell">
            <div class="footer-text">
              You have received this notification because you initiated an account action on PointX — professional esports tournament operating system.<br />
              &copy; ${new Date().getFullYear()} <a href="${POINTX_OFFICIAL_URL}" target="_blank" class="footer-link">PointX (pointx.in)</a> &bull; <a href="mailto:support@pointx.gg" class="footer-link">Support</a>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}

export function getSignupOtpEmailTemplate(name: string, otp: string): { subject: string; html: string } {
  const subject = `🔐 ${otp} is your PointX verification code`;
  const html = renderPointXEmailLayout({
    title: 'Complete registration',
    recipientName: name,
    bodyParagraphs: [
      'Please enter this confirmation code in the window where you started creating your account:',
    ],
    otpCode: otp,
    ctaText: 'Confirm your email',
    ctaUrl: POINTX_OFFICIAL_URL,
    disclaimerText: "If you didn't create an account in PointX, please ignore this message.",
  });
  return { subject, html };
}

export function getForgotPasswordEmailTemplate(name: string, otp: string): { subject: string; html: string } {
  const subject = `🔑 Password Reset Code: ${otp}`;
  const html = renderPointXEmailLayout({
    title: 'Reset password',
    recipientName: name,
    bodyParagraphs: [
      'Please enter this confirmation code in the window where you requested a password reset:',
    ],
    otpCode: otp,
    ctaText: 'Reset your password',
    ctaUrl: POINTX_OFFICIAL_URL,
    disclaimerText: "If you didn't request a password reset in PointX, please ignore this message.",
  });
  return { subject, html };
}

export function getPasswordChangedConfirmationEmailTemplate(name: string): { subject: string; html: string } {
  const subject = `🛡 Security Alert: PointX Password Successfully Changed`;
  const html = renderPointXEmailLayout({
    title: 'Password changed',
    recipientName: name,
    bodyParagraphs: [
      `This is confirmation that your PointX account password was successfully updated on ${new Date().toUTCString()}.`,
      'If you performed this change, no further action is required.',
    ],
    ctaText: 'Go to PointX',
    ctaUrl: POINTX_OFFICIAL_URL,
    disclaimerText: 'If you did NOT perform this change, please immediately contact support@pointx.in.',
  });
  return { subject, html };
}

export function getSupportTicketEmailTemplate(ticket: {
  senderName: string;
  senderEmail: string;
  organizationName?: string;
  category?: string;
  subject: string;
  message: string;
  tournamentTitle?: string;
}): { subject: string; html: string } {
  const subject = `[PointX Support Ticket] ${ticket.category ? `[${ticket.category}] ` : ''}${ticket.subject}`;
  const html = renderPointXEmailLayout({
    title: 'New Organizer Support Query',
    recipientName: 'PointX Admin Team',
    bodyParagraphs: [
      `A new support inquiry was submitted by <strong>${ticket.senderName}</strong> (&lt;${ticket.senderEmail}&gt;)${ticket.organizationName ? ` from <strong>${ticket.organizationName}</strong>` : ''}.`,
      `<strong>Topic:</strong> ${ticket.category || 'General Support'}<br/><strong>Subject:</strong> ${ticket.subject}`,
      `<strong>Message Details:</strong><br/><div style="background-color: #f8fafc; border-left: 4px solid #ffd000; padding: 14px 18px; margin: 12px 0; font-family: inherit; font-size: 14px; line-height: 1.6; color: #1e293b; border-radius: 4px;">${ticket.message.replace(/\n/g, '<br/>')}</div>`,
      `<strong>Submitted at:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`
    ],
    ctaText: `Reply Directly to ${ticket.senderName}`,
    ctaUrl: `mailto:${ticket.senderEmail}?subject=Re: ${encodeURIComponent(ticket.subject)}`,
    disclaimerText: 'This message was delivered automatically to all PointX platform administrators.',
  });
  return { subject, html };
}
