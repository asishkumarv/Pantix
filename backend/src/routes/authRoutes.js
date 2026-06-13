import express from "express";
import { register, login, getMe, createAdmin, enableResellerMode, changePassword, addAddress, removeAddress } from "../controllers/authController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.post("/create-admin", authenticateToken, requireAdmin, createAdmin);
router.put("/reseller/enable", authenticateToken, enableResellerMode);
router.put("/change-password", authenticateToken, changePassword);

// Address Management
router.post("/addresses", authenticateToken, addAddress);
router.delete("/addresses/:id", authenticateToken, removeAddress);

export default router;

