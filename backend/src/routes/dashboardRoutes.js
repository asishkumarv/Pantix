import express from "express";
import {
  getStats,
  getRevenueReport,
  getNotifications,
} from "../controllers/dashboardController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", authenticateToken, requireAdmin, getStats);
router.get(
  "/revenue-report",
  authenticateToken,
  requireAdmin,
  getRevenueReport
);
router.get(
  "/notifications",
  authenticateToken,
  requireAdmin,
  getNotifications
);

export default router;
