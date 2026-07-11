import express from "express";
import multer from "multer";
import path from "path";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import pool from "../config/db.js";

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
      const ext = path.extname(req.file.originalname) || ".jpg";
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `categories/${Date.now()}-${base}${ext}`;

      await pool.query(
        "INSERT INTO uploads (filename, mime_type, data) VALUES ($1, $2, $3)",
        [filename, req.file.mimetype, req.file.buffer]
      );

      res.status(201).json({
        path: `/uploads/${filename}`,
        filename: filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (err) {
      console.error("Database upload error:", err);
      res.status(500).json({ error: "Failed to upload image to database" });
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
      const ext = path.extname(req.file.originalname) || ".jpg";
      const base = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `products/${Date.now()}-${base}${ext}`;

      await pool.query(
        "INSERT INTO uploads (filename, mime_type, data) VALUES ($1, $2, $3)",
        [filename, req.file.mimetype, req.file.buffer]
      );

      res.status(201).json({
        path: `/uploads/${filename}`,
        filename: filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (err) {
      console.error("Database upload error:", err);
      res.status(500).json({ error: "Failed to upload image to database" });
    }
  }
);

export default router;

