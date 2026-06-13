import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllCategories);
router.post("/", authenticateToken, requireAdmin, createCategory);
router.put("/:id", authenticateToken, requireAdmin, updateCategory);
router.delete("/:id", authenticateToken, requireAdmin, deleteCategory);

export default router;
