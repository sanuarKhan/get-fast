// Add to your parcel.route.js or create agentLocation.route.js

import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import Parcel from "../models/Parcel.js";

const router = express.Router();

// @route   PATCH /api/parcels/agent/location
// @desc    Update agent's current location for a parcel
// @access  Private (Agent only)
router.patch(
  "/agent/location",
  protect,
  authorize("agent"),
  async (req, res) => {
    try {
      const { parcelId, location } = req.body;

      // Validation
      if (!parcelId || !location || !location.lat || !location.lng) {
        return res.status(400).json({
          success: false,
          message: "Parcel ID and location (lat, lng) are required",
        });
      }

      // Find parcel assigned to this agent
      const parcel = await Parcel.findOne({
        _id: parcelId,
        assignedAgent: req.user._id,
      });

      if (!parcel) {
        return res.status(404).json({
          success: false,
          message: "Parcel not found or not assigned to you",
        });
      }

      // Update agent location
      parcel.agentCurrentLocation = {
        type: "Point",
        coordinates: [location.lng, location.lat], // GeoJSON format: [lng, lat]
        accuracy: location.accuracy,
        timestamp: location.timestamp || new Date(),
      };

      await parcel.save();

      // Emit socket event to notify customer
      if (req.app.get("io")) {
        req.app.get("io").emit(`agent-location-${parcelId}`, {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          timestamp: parcel.agentCurrentLocation.timestamp,
        });
      }

      res.status(200).json({
        success: true,
        message: "Location updated successfully",
        data: {
          parcelId: parcel._id,
          location: {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            timestamp: parcel.agentCurrentLocation.timestamp,
          },
        },
      });
    } catch (error) {
      console.error("Error updating agent location:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update location",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/parcels/:id/agent-location
// @desc    Get current agent location for a parcel
// @access  Private (Customer, Agent, Admin)
router.get("/:id/agent-location", protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id).select(
      "agentCurrentLocation assignedAgent status"
    );

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }

    // Check authorization
    const isOwner = parcel.customer?.toString() === req.user._id.toString();
    const isAgent =
      parcel.assignedAgent?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAgent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this parcel location",
      });
    }

    if (!parcel.agentCurrentLocation) {
      return res.status(200).json({
        success: true,
        message: "No location data available yet",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        lat: parcel.agentCurrentLocation.coordinates[1],
        lng: parcel.agentCurrentLocation.coordinates[0],
        accuracy: parcel.agentCurrentLocation.accuracy,
        timestamp: parcel.agentCurrentLocation.timestamp,
      },
    });
  } catch (error) {
    console.error("Error fetching agent location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch location",
      error: error.message,
    });
  }
});

export default router;
