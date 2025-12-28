import User from "../models/user.model.js";
import Parcel from "../models/parcel.model.js";

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Admin: Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel queries for better performance
    const [
      totalParcels,
      dailyBookings,
      pendingParcels,
      inTransitParcels,
      deliveredParcels,
      failedDeliveries,
      totalCODAmount,
      dailyCODAmount,
      totalRevenue,
      totalCustomers,
      totalAgents,
      activeAgents,
    ] = await Promise.all([
      // Total parcels
      Parcel.countDocuments(),

      // Today's bookings
      Parcel.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      }),

      // Pending parcels
      Parcel.countDocuments({ status: "pending" }),

      // In transit
      Parcel.countDocuments({
        status: { $in: ["picked_up", "in_transit", "out_for_delivery"] },
      }),

      // Delivered parcels
      Parcel.countDocuments({ status: "delivered" }),

      // Failed deliveries
      Parcel.countDocuments({ status: "failed" }),

      // Total COD amount (all time)
      Parcel.aggregate([
        { $match: { paymentMethod: "cod", status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$codAmount" } } },
      ]),

      // Daily COD amount
      Parcel.aggregate([
        {
          $match: {
            paymentMethod: "cod",
            status: "delivered",
            actualDeliveryDate: { $gte: today, $lt: tomorrow },
          },
        },
        { $group: { _id: null, total: { $sum: "$codAmount" } } },
      ]),

      // Total revenue (you can adjust this based on your pricing model)
      Parcel.countDocuments({ status: "delivered" }),

      // Total customers
      User.countDocuments({ role: "customer" }),

      // Total agents
      User.countDocuments({ role: "agent" }),

      // Active agents (agents with assigned parcels)
      Parcel.distinct("assignedAgent", {
        assignedAgent: { $ne: null },
        status: { $in: ["picked_up", "in_transit", "out_for_delivery"] },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        parcels: {
          total: totalParcels,
          daily: dailyBookings,
          pending: pendingParcels,
          inTransit: inTransitParcels,
          delivered: deliveredParcels,
          failed: failedDeliveries,
        },
        financials: {
          totalCODAmount: totalCODAmount[0]?.total || 0,
          dailyCODAmount: dailyCODAmount[0]?.total || 0,
          // Assuming 100 BDT per delivery as base rate
          totalRevenue: totalRevenue * 100,
          dailyRevenue: dailyBookings * 100,
        },
        users: {
          totalCustomers,
          totalAgents,
          activeAgents: activeAgents.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

export const getBookingsChartData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const bookingsData = await Parcel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: bookingsData,
    });
  } catch (error) {
    console.error("Error fetching bookings chart data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chart data",
      error: error.message,
    });
  }
};

export const getStatusDistribution = async (req, res) => {
  try {
    const distribution = await Parcel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Error fetching status distribution:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch status distribution",
      error: error.message,
    });
  }
};

export const getTopAgents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topAgents = await Parcel.aggregate([
      {
        $match: {
          assignedAgent: { $ne: null },
          status: "delivered",
        },
      },
      {
        $group: {
          _id: "$assignedAgent",
          deliveredCount: { $sum: 1 },
          totalCOD: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "cod"] }, "$codAmount", 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      {
        $unwind: "$agent",
      },
      {
        $project: {
          agentId: "$_id",
          name: "$agent.name",
          email: "$agent.email",
          deliveredCount: 1,
          totalCOD: 1,
        },
      },
      {
        $sort: { deliveredCount: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    res.status(200).json({
      success: true,
      data: topAgents,
    });
  } catch (error) {
    console.error("Error fetching top agents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top agents",
      error: error.message,
    });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const period = req.query.period || "monthly"; // daily, weekly, monthly

    let groupFormat;
    let startDate = new Date();

    switch (period) {
      case "daily":
        groupFormat = "%Y-%m-%d";
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "weekly":
        groupFormat = "%Y-W%V";
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "monthly":
      default:
        groupFormat = "%Y-%m";
        startDate.setMonth(startDate.getMonth() - 12);
        break;
    }

    const revenueData = await Parcel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "delivered",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$actualDeliveryDate" },
          },
          deliveredCount: { $sum: 1 },
          codRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "cod"] }, "$codAmount", 0],
            },
          },
          prepaidRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "prepaid"] }, 100, 0],
            },
          },
        },
      },
      {
        $addFields: {
          totalRevenue: { $add: ["$codRevenue", "$prepaidRevenue"] },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: error.message,
    });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const activities = await Parcel.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate("customer", "name email")
      .populate("assignedAgent", "name")
      .select("trackingNumber status customer assignedAgent updatedAt");

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities",
      error: error.message,
    });
  }
};
