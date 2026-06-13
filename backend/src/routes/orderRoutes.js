import express from "express";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getAllOrders);
router.get("/:id", getOrderById);
router.post("/", authenticateToken, createOrder);
router.put("/:id/status", authenticateToken, requireAdmin, updateOrderStatus);

export default router;
