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
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: "jsshah136@gmail.com",
        pass: " gncr kvrc vjju xtiu"
      }
    });
  }
  return null;
};

module.exports = {
  createTransporter,
  isSMTPConfigured
};
