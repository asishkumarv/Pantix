import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authenticateToken, createRazorpayOrder);
router.post("/verify", authenticateToken, verifyRazorpayPayment);

export default router;
