const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your CampusHub email",
    text: `Your CampusHub verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2>Verify your CampusHub email</h2>
        <p>Use this code to complete your registration:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:8px">${otp}</p>
        <p>This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
