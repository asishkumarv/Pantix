import express from "express";
import {
  getStats,
  getRevenueReport,
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

export default router;
