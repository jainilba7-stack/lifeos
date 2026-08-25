const nodemailer = require('nodemailer');

const isSMTPConfigured = () => {
  return (
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS &&
    process.env.SMTP_USER !== 'your_email@gmail.com'
  );
};

const createTransporter = () => {
  if (isSMTPConfigured()) {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465,
      auth: {
        user: (process.env.SMTP_USER || 'jsshah136@gmail.com').trim(),
        pass: (process.env.SMTP_PASS || 'gncrkvrcvjjuxtiu').trim()
      }
    });
  }
  return null;
};

module.exports = {
  createTransporter,
  isSMTPConfigured
};
