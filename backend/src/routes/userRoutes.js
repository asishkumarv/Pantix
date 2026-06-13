import express from "express";
import {
  getAllUsers,
  updateUserStatus,
} from "../controllers/userController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, requireAdmin, getAllUsers);
router.put("/:id/status", authenticateToken, requireAdmin, updateUserStatus);

export default router;
