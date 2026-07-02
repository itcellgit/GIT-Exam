import nodemailer from 'nodemailer'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, SMTP_FROM } = process.env

let transporter = null
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

export function isMailConfigured() {
  return !!transporter
}

export async function sendResetEmail(to, resetUrl) {
  const from = SMTP_FROM || SMTP_USER
  const subject = 'GIT Examination Section — Password Reset'
  const text =
    'We received a request to reset your admin password.\n\n' +
    `Reset it using the link below (valid for 1 hour):\n${resetUrl}\n\n` +
    'If you did not request this, you can safely ignore this email.'
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#212121;line-height:1.6">
      <h2 style="color:#1a237e;margin:0 0 8px">Password Reset</h2>
      <p>We received a request to reset your admin password for the
         <strong>GIT Examination Section</strong> portal.</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#1a237e;color:#fff;text-decoration:none;
                  padding:10px 18px;border-radius:4px;font-weight:600">Reset Password</a>
      </p>
      <p style="font-size:0.85rem;color:#555">
        This link is valid for <strong>1 hour</strong>. If the button doesn't work, copy this URL:<br>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p style="font-size:0.85rem;color:#777">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>`

  // Fallback for local/dev without SMTP: print the link so the flow is testable.
  if (!transporter) {
    console.log('────── PASSWORD RESET (SMTP not configured) ──────')
    console.log(`  To:        ${to}`)
    console.log(`  Reset URL: ${resetUrl}`)
    console.log('  Configure SMTP_* env vars to send real emails.')
    console.log('──────────────────────────────────────────────────')
    return { delivered: false }
  }

  await transporter.sendMail({ from, to, subject, text, html })
  return { delivered: true }
}
