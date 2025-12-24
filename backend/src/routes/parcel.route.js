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
} from "../controllers/parcel.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { ROLES } from "../constants.js";

const router = express.Router();

// Customer routes
router.post("/book", protect, restrictTo(ROLES.CUSTOMER), bookParcel);
router.get("/my-bookings", protect, restrictTo(ROLES.CUSTOMER), getMyBookings);

// Shared routes
router.get("/:id", protect, getParcel);

// Admin routes
router.get("/", protect, restrictTo(ROLES.ADMIN), getAllParcels);
router.put("/:id/assign", protect, restrictTo(ROLES.ADMIN), assignAgent);
router.get(
  "/stats/dashboard",
  protect,
  restrictTo(ROLES.ADMIN),
  getDashboardStats
);

// Agent routes
router.get(
  "/agent/assigned",
  protect,
  restrictTo(ROLES.AGENT),
  getAssignedParcels
);
router.put("/:id/status", protect, restrictTo(ROLES.AGENT), updateParcelStatus);
router.patch(
  "/agent/location",
  protect,
  restrictTo(ROLES.AGENT),
  updateAgentLocation
);

export default router;
