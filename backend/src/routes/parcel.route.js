import express from "express";
import {
  bookParcel,
  getMyBookings,
  getParcel,
  getAllParcels,
  assignAgent,
  getAssignedParcels,
  updateParcelStatus,
  updateAgentLocation,
  getDashboardStats,
  getParcelQRCode,
  verifyQRCode,
  scanQRAndUpdateStatus,
} from "../controllers/parcel.controller.js";
import {
  protect,
  restrictTo,
} from "../middleware/auth.middleware.js";
import { ROLES } from "../constants.js";

const router = express.Router();

// Specific routes FIRST
router.get(
  "/stats/dashboard",
  protect,
  restrictTo(ROLES.ADMIN),
  getDashboardStats
);
router.get("/my-bookings", protect, restrictTo(ROLES.CUSTOMER), getMyBookings);

router.get(
  "/agent/assigned",
  protect,
  restrictTo(ROLES.AGENT),
  getAssignedParcels
);
// router.post("/book", protect, restrictTo(ROLES.CUSTOMER), bookParcel);
router.post("/book", protect, restrictTo(ROLES.CUSTOMER), bookParcel);

router.patch(
  "/agent/location",
  protect,
  restrictTo(ROLES.AGENT),
  updateAgentLocation
);

// Admin routes
router.get("/", protect, restrictTo(ROLES.ADMIN), getAllParcels);
router.put("/:id/assign", protect, restrictTo(ROLES.ADMIN), assignAgent);

// Agent routes
router.put("/:id/status", protect, restrictTo(ROLES.AGENT), updateParcelStatus);

// Shared routes
router.get("/:id", protect, getParcel);

//QR Code Routes
router.get("/:id/qrcode", protect, getParcelQRCode);
router.post("/verify-qr", protect, restrictTo(ROLES.AGENT), verifyQRCode);
router.post(
  "/scan-qr",
  protect,
  restrictTo(ROLES.AGENT),
  scanQRAndUpdateStatus
);

export default router;
