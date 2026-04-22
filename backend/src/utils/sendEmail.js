import nodemailer from "nodemailer";

const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendMerchantCredentials = async ({ name, email, password }) => {
  try {
    await getTransporter().sendMail({
      from: `"JoyEvents Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to JoyEvents! Your Merchant Account Created",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF5A00;">Welcome, ${name}!</h2>
          <p>Your merchant account has been successfully created by the administrator.</p>
          <p>Here are your login credentials:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="margin-top: 20px;">Please login at <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/login">JoyEvents</a> and change your password as soon as possible.</p>
          <p>Best regards,<br>The JoyEvents Team</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendMerchantCredentials error:", error.message);
    return false;
  }
};

export const sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  try {
    await getTransporter().sendMail({
      from: `"JoyEvents" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your Password — JoyEvents",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #FF5A00, #FF8C00); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="color: #555;">We received a request to reset your password. Click the button below to set a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #FF5A00, #FF8C00); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #aaa; font-size: 12px; text-align: center;">JoyEvents &mdash; Manage your events with ease</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendPasswordResetEmail error:", error.message);
    throw new Error("Failed to send reset email: " + error.message);
  }
};

export const sendContactMessage = async ({ senderName, senderEmail, message, merchantEmail, merchantName, itemTitle }) => {
  try {
    await getTransporter().sendMail({
      from: `"JoyEvents" <${process.env.SMTP_USER}>`,
      to: merchantEmail,
      replyTo: senderEmail,
      subject: `New enquiry about "${itemTitle}" — JoyEvents`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #FF5A00, #FF8C00); padding: 24px 30px;">
            <h1 style="color: white; margin: 0; font-size: 20px;">📩 New Customer Enquiry</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 15px;">Hi <strong>${merchantName}</strong>,</p>
            <p style="color: #555;">A customer has sent you a message about <strong>"${itemTitle}"</strong>.</p>
            <div style="background: #f9f9f9; border-left: 4px solid #FF5A00; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #888;">From: <strong style="color:#333">${senderName}</strong> &lt;${senderEmail}&gt;</p>
              <p style="margin: 0; font-size: 15px; color: #333; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #555; font-size: 13px;">You can reply directly to this email to respond to the customer.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #aaa; font-size: 12px; text-align: center;">JoyEvents &mdash; Connecting customers with great experiences</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendContactMessage error:", error.message);
    throw new Error("Failed to send message");
  }
};
