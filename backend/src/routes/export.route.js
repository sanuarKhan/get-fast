// Add to admin.route.js

import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  exportParcelsToCSV,
  exportParcelsToPDF,
  exportUsersToCSV,
  getExportSummary,
} from "../controllers/export.controller.js";

const router = express.Router();

// All routes require admin authorization
router.use(protect, authorize("admin"));

// Export Routes

// @route   GET /api/admin/export/parcels/csv
// @desc    Export parcels to CSV with filters
// @query   ?startDate=2024-01-01&endDate=2024-12-31&status=delivered&paymentMethod=cod
router.get("/export/parcels/csv", exportParcelsToCSV);

// @route   GET /api/admin/export/parcels/pdf
// @desc    Export parcels to PDF with filters
// @query   ?startDate=2024-01-01&endDate=2024-12-31&status=delivered
router.get("/export/parcels/pdf", exportParcelsToPDF);

// @route   GET /api/admin/export/users/csv
// @desc    Export users to CSV
// @query   ?role=customer
router.get("/export/users/csv", exportUsersToCSV);

// @route   GET /api/admin/export/summary
// @desc    Get count of records that will be exported (preview)
// @query   ?startDate=2024-01-01&endDate=2024-12-31
router.get("/export/summary", getExportSummary);

export default router;
