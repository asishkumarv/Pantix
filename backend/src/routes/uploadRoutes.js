import express from "express";
import multer from "multer";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

// Store files in memory buffer instead of disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.post(
  "/category-image",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer, "categories");
      res.status(201).json({
        path: result.secure_url,
        filename: result.public_id,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      res.status(500).json({ error: "Failed to upload image to Cloudinary" });
    }
  }
);

router.post(
  "/product-image",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer, "products");
      res.status(201).json({
        path: result.secure_url,
        filename: result.public_id,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      res.status(500).json({ error: "Failed to upload image to Cloudinary" });
    }
  }
);

export default router;

