const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'noreply@goodcreator.in';
const APP_NAME = 'GoodCreator';

const sendOtpEmail = async (email, otp, type = 'verify') => {
  const isReset = type === 'reset';

  const subject = isReset
    ? `Reset your ${APP_NAME} password`
    : `Verify your ${APP_NAME} email`;

  const heading = isReset
    ? 'Reset Your Password'
    : 'Verify Your Email';

  const message = isReset
    ? 'You requested a password reset. Use the OTP below to reset your password.'
    : 'Thanks for signing up! Use the OTP below to verify your email address.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:40px auto;padding:0 20px;">

        <!-- logo -->
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:24px;font-weight:900;color:#101828;">Good</span><span style="font-size:24px;font-weight:900;color:#155DFC;">Creator</span>
        </div>

        <!-- card -->
        <div style="background:white;border-radius:20px;padding:40px 32px;border:1px solid #E5E7EB;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <h2 style="font-size:22px;font-weight:900;color:#101828;margin:0 0 8px;">${heading}</h2>
          <p style="font-size:14px;color:#6B7280;margin:0 0 32px;line-height:1.6;">${message}</p>

          <!-- OTP box -->
          <div style="background:#F8FAFC;border:1.5px solid #E5E7EB;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Your OTP</div>
            <div style="font-size:48px;font-weight:900;color:#101828;letter-spacing:12px;">${otp}</div>
          </div>

          <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0 0 24px;">
            This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>

          <div style="height:1px;background:#F0F0F0;margin:0 0 24px;"></div>

          <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>

        <!-- footer -->
        <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:24px;">
          India's Creator Marketplace 🇮🇳 · <a href="https://goodcreator.in" style="color:#155DFC;text-decoration:none;">goodcreator.in</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error('[EMAIL] Resend error:', error);
    throw new Error('Failed to send email');
  }

  console.log('[EMAIL] Sent to:', email, '| ID:', data?.id);
  return data;
};

const sendAdminEmail = async (email, subject, message) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:40px auto;padding:0 20px;">

        <!-- logo -->
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:24px;font-weight:900;color:#101828;">Good</span><span style="font-size:24px;font-weight:900;color:#155DFC;">Creator</span>
        </div>

        <!-- card -->
        <div style="background:white;border-radius:20px;padding:40px 32px;border:1px solid #E5E7EB;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <h2 style="font-size:20px;font-weight:900;color:#101828;margin:0 0 16px;">${subject}</h2>
          <div style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</div>
        </div>

        <!-- footer -->
        <p style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:24px;">
          India's Creator Marketplace 🇮🇳 · <a href="https://goodcreator.in" style="color:#155DFC;text-decoration:none;">goodcreator.in</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error('[EMAIL] Admin email error:', error);
    throw new Error('Failed to send email');
  }

  console.log('[EMAIL] Admin email sent to:', email, '| ID:', data?.id);
  return data;
};

module.exports = { sendOtpEmail, sendAdminEmail };
