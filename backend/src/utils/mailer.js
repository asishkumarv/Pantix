import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

// Force IPv4 resolution to prevent ENETUNREACH errors on platforms like Render that don't support outbound IPv6
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4, // Force IPv4 routing
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Pantix" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Pantix Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #D4AF37;">Pantix Password Reset</h2>
        <p>You requested a password reset. Use the code below to reset your password. This code will expire in 15 minutes.</p>
        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
          ${otp}
        </div>
        <p style="margin-top: 20px; color: #6c757d; font-size: 14px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending OTP to ${to}:`, error);
    throw error;
  }
};
