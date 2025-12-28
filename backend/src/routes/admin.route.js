import express from "express";
import {
  getAllUsers,
  getBookingsChartData,
  getRecentActivities,
  getRevenueAnalytics,
  getTopAgents,
} from "../controllers/admin.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { ROLES } from "../constants.js";
import {
  getDashboardStats,
  getStatusDistribution,
} from "../controllers/parcel.controller.js";

const router = express.Router();

router.use(protect, restrictTo(ROLES.ADMIN));

router.get("/users", getAllUsers);
router.get(
  "dashboard/stats",

  getDashboardStats
);
router.get(
  "/dashboard/booking-chart",

  getBookingsChartData
);
router.get(
  "/status-distribution",

  getStatusDistribution
);
router.get(
  "/dashboard/top-agents",

  getTopAgents
);

router.get(
  "/dashboard/revenue",

  getRevenueAnalytics
);
router.get(
  "/dashboard/recent-activities",

  getRecentActivities
);

export default router;
