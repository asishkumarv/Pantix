import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { createEnquiry, getAllEnquiries } from "../controllers/enquiryController.js";

const router = Router();

router.post("/", createEnquiry);
router.get("/", authenticateToken, requireAdmin, getAllEnquiries);

export default router;
