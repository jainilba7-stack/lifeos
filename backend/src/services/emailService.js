const { createTransporter, isSMTPConfigured } = require('../config/nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (transporter && isSMTPConfigured()) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"LifeOS" <no-reply@lifeos.app>',
        to,
        subject,
        text,
        html
      });
      console.log(`[Email Service] Sent email to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`[Email Service] Failed to send email to ${to}:`, err.message);
      return false;
    }
  } else {
    // Development / Fallback print
    console.log(`
==================================================
[DEMO / CONSOLE EMAIL DISPATCH]
To: ${to}
Subject: ${subject}
Content:
${text || html}
==================================================
    `);
    return true;
  }
};

const sendOTPEmail = async (email, otp, name = 'User') => {
  const subject = 'Your LifeOS Email Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
      <h2 style="color: #38bdf8; margin-top: 0;">Welcome to LifeOS! 🚀</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your one-time email verification OTP code is:</p>
      <div style="background: #1e293b; color: #38bdf8; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #94a3b8; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;
  return await sendEmail({ to: email, subject, html, text: `Your LifeOS OTP code is: ${otp}` });
};

const sendPasswordResetEmail = async (email, otp, name = 'User') => {
  const subject = 'LifeOS Password Reset Verification';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px;">
      <h2 style="color: #ef4444; margin-top: 0;">Reset Your Password 🔐</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Use the following OTP code to reset your LifeOS account password:</p>
      <div style="background: #1e293b; color: #ef4444; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #94a3b8; font-size: 14px;">This OTP will expire in 10 minutes. Never share this code with anyone.</p>
    </div>
  `;
  return await sendEmail({ to: email, subject, html, text: `Your LifeOS Password Reset OTP is: ${otp}` });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail
};
