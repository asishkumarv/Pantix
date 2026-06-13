import express from "express";
import {
  getAllResellers,
  createReseller,
  updateReseller,
  updateResellerStatus,
  deleteReseller,
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus,
  getMyReferrals,
  getMyStats,
} from "../controllers/resellerController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, requireAdmin, getAllResellers);
router.post("/", authenticateToken, requireAdmin, createReseller);
router.put("/:id", authenticateToken, requireAdmin, updateReseller);
router.put(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  updateResellerStatus
);
router.delete("/:id", authenticateToken, requireAdmin, deleteReseller);

// Withdrawal endpoints
router.post("/withdrawals", authenticateToken, requestWithdrawal);
router.get("/withdrawals", authenticateToken, getMyWithdrawals);
router.get("/admin/withdrawals", authenticateToken, requireAdmin, getAllWithdrawals);
router.put("/admin/withdrawals/:id/status", authenticateToken, requireAdmin, updateWithdrawalStatus);

// Referrals & stats endpoints
router.get("/referrals", authenticateToken, getMyReferrals);
router.get("/stats", authenticateToken, getMyStats);

export default router;

