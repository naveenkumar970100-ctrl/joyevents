import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
const user = (process.env.SMTP_USER || "").trim();

console.log("SMTP_USER:", user);
console.log("SMTP_PASS length:", pass.length, "(should be 16)");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: { user, pass },
  tls: { minVersion: "TLSv1.2" },
  requireTLS: true,
});

console.log("Verifying SMTP connection...");
try {
  await transporter.verify();
  console.log("✅ SMTP connection OK");
} catch (e) {
  console.error("❌ SMTP verify failed:", e.message);
  process.exit(1);
}

console.log("Sending test email...");
try {
  const info = await transporter.sendMail({
    from: `"JoyEvents" <${user}>`,
    to: user,
    subject: "JoyEvents SMTP Test",
    text: "SMTP is working correctly with the new app password.",
  });
  console.log("✅ Email sent! MessageId:", info.messageId);
} catch (e) {
  console.error("❌ Send failed:", e.message);
}
