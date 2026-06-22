import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

// Force IPv4 resolution to prevent ENETUNREACH errors on platforms like Render that don't support outbound IPv6
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.titan.email",
  port: 465,
  secure: true,
  family: 4, // Force IPv4 routing
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Pantix" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Your Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2 style="color: #333;">Password Reset</h2>
        <p style="color: #666; font-size: 16px;">You requested a password reset. Here is your 6-digit verification code:</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #b8860b;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};
