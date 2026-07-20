import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  createProductReview,
  deleteProductReview,
  updateProductReview,
} from "../controllers/productController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", authenticateToken, requireAdmin, createProduct);
router.put("/:id", authenticateToken, requireAdmin, updateProduct);
router.delete("/:id", authenticateToken, requireAdmin, deleteProduct);

// Reviews routes
router.get("/:productId/reviews", getProductReviews);
router.post("/:productId/reviews", createProductReview);
router.delete("/:productId/reviews/:reviewId", authenticateToken, deleteProductReview);
router.put("/:productId/reviews/:reviewId", authenticateToken, updateProductReview);

export default router;
