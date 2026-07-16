import pool from "../config/db.js";
import crypto from "crypto";

export const createRazorpayOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === "rzp_test_your_key_id") {
      return res.status(500).json({ error: "Razorpay credentials not configured" });
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"),
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // amount in paisa
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Razorpay order creation error:", data);
      return res.status(response.status).json({ error: data.error?.description || "Razorpay API error" });
    }

    res.json(data);
  } catch (err) {
    console.error("CreateRazorpayOrder error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Payment credentials required for verification" });
  }

  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({ error: "Razorpay secret not configured" });
    }

    const payload = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ error: "Signature mismatch. Verification failed." });
    }
  } catch (err) {
    console.error("VerifyRazorpayPayment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
