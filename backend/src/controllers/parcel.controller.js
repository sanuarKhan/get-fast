import Parcel from "../models/parcel.model.js";
import Agent from "../models/agent.model.js";
import { PARCEL_STATUS, ROLES } from "../constants.js";
import { generateQRCode } from "../utils/qrCode.js";
import {
  sendBookingConfirmation,
  sendStatusUpdate,
  sendDeliveryConfirmation,
} from "../utils/emailService.js";
import User from "../models/user.model.js";
import QRCode from "qrcode";

//Customer: Book a parcel

export const bookParcel = async (req, res) => {
  try {
    const {
      pickupAddress,
      deliveryAddress,
      parcelSize,
      parcelType,
      weight,
      paymentMethod,
      codAmount,
      notes,
    } = req.body;

    // Validation
    if (
      !pickupAddress?.address ||
      !pickupAddress?.city ||
      !pickupAddress?.coordinates?.lat ||
      !pickupAddress?.coordinates?.lng
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete pickup address with coordinates required",
      });
    }

    if (
      !deliveryAddress?.address ||
      !deliveryAddress?.city ||
      !deliveryAddress?.coordinates?.lat ||
      !deliveryAddress?.coordinates?.lng
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address with coordinates required",
      });
    }

    if (!parcelSize || !parcelType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Parcel size, type, and payment method are required",
      });
    }

    // Validate COD amount
    if (paymentMethod === "cod" && (!codAmount || codAmount <= 0)) {
      return res.status(400).json({
        success: false,
        message: "COD amount is required for cash on delivery",
      });
    }

    // Create parcel with properly formatted location data
    const parcel = await Parcel.create({
      customer: req.user._id,
      pickupAddress: {
        ...pickupAddress,
        location: {
          type: "Point",
          coordinates: [
            pickupAddress.coordinates.lng,
            pickupAddress.coordinates.lat,
          ], // [lng, lat]
        },
      },
      deliveryAddress: {
        ...deliveryAddress,
        location: {
          type: "Point",
          coordinates: [
            deliveryAddress.coordinates.lng,
            deliveryAddress.coordinates.lat,
          ], // [lng, lat]
        },
      },
      parcelSize: parcelSize.toLowerCase(),
      parcelType,
      weight,
      paymentMethod,
      codAmount: paymentMethod === "cod" ? codAmount : 0,
      notes,
      status: "pending",
    });

    // Generate QR Code
    const qrData = {
      parcelId: parcel._id,
      trackingNumber: parcel.trackingNumber,
      customer: req.user._id,
      createdAt: parcel.createdAt,
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    parcel.qrCode = qrCodeDataURL;
    await parcel.save();

    // Populate customer details
    await parcel.populate("customer", "name email phone");

    // Send email confirmation
    try {
      await sendBookingConfirmation(parcel, req.user.email);
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      // Don't fail the request if email fails
    }

    // Emit socket event if io is available
    if (req.app.get("io")) {
      req.app.get("io").emit("parcel:booked", {
        parcelId: parcel._id,
        trackingNumber: parcel.trackingNumber,
        status: parcel.status,
      });
    }

    res.status(201).json({
      success: true,
      message: "Parcel booked successfully",
      data: parcel,
    });
  } catch (error) {
    console.error("Error booking parcel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to book parcel",
      error: error.message,
    });
  }
};

//Customer:Get my booking

export const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { customer: req.user._id };
    if (status) query.status = status;

    const parcels = await Parcel.find(query)
      .populate("agent", "name phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Parcel.countDocuments(query);
    res.json({
      success: true,
      parcels,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single parcel
export const getParcel = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate("customer", "name phone email")
      .populate("agent", "name phone");

    if (!parcel) {
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });
    }

    // Check authorization
    const isCustomer =
      parcel.customer._id.toString() === req.user._id.toString();
    const isAgent =
      parcel.agent && parcel.agent._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isCustomer && !isAgent && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, parcel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all parcels
export const getAllParcels = async (req, res) => {
  try {
    const { status, agent, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (agent) query.agent = agent;
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { "pickupAddress.city": { $regex: search, $options: "i" } },
        { "deliveryAddress.city": { $regex: search, $options: "i" } },
      ];
    }

    const parcels = await Parcel.find(query)
      .populate("customer", "name phone email")
      .populate("agent", "name phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Parcel.countDocuments(query);

    res.json({
      success: true,
      parcels,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Assign agent to parcel
export const assignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;
    const parcelId = req.params.id;

    const agent = await Agent.findOne({ user: agentId });
    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found" });
    }

    const parcel = await Parcel.findByIdAndUpdate(
      parcelId,
      {
        agent: agentId,
        status: PARCEL_STATUS.ASSIGNED,
        $push: {
          statusHistory: {
            status: PARCEL_STATUS.ASSIGNED,
            updatedBy: req.user._id,
          },
        },
      },
      { new: true }
    ).populate("agent", "name phone");

    // Update agent's assigned parcels
    await Agent.findByIdAndUpdate(agent._id, {
      $push: { assignedParcels: parcelId },
    });

    // Send email notification
    const customer = await User.findById(parcel.customer);
    await sendStatusUpdate(parcel, customer, PARCEL_STATUS.ASSIGNED);

    // Emit socket event
    const io = req.app.get("io");
    io.emit("parcel:assigned", { parcelId, agentId });

    res.json({ success: true, parcel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Agent: Get assigned parcels
export const getAssignedParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find({
      agent: req.user._id,
      status: { $nin: [PARCEL_STATUS.DELIVERED, PARCEL_STATUS.FAILED] },
    })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, parcels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Agent: Update parcel status
export const updateParcelStatus = async (req, res) => {
  try {
    const { status, failureReason, currentLocation } = req.body;
    const parcelId = req.params.id;

    const parcel = await Parcel.findById(parcelId);

    if (!parcel) {
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });
    }

    if (parcel.agent.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const updateData = {
      status,
      $push: {
        statusHistory: {
          status,
          updatedBy: req.user._id,
        },
      },
    };

    if (currentLocation) {
      updateData.currentLocation = currentLocation;
    }

    if (status === PARCEL_STATUS.FAILED && failureReason) {
      updateData.failureReason = failureReason;
    }

    if (status === PARCEL_STATUS.DELIVERED) {
      updateData.deliveryDate = new Date();

      // Update agent stats
      await Agent.findOneAndUpdate(
        { user: req.user._id },
        {
          $inc: { totalDeliveries: 1, successfulDeliveries: 1 },
          $pull: { assignedParcels: parcelId },
        }
      );
    }

    if (status === PARCEL_STATUS.FAILED) {
      await Agent.findOneAndUpdate(
        { user: req.user._id },
        {
          $inc: { totalDeliveries: 1, failedDeliveries: 1 },
          $pull: { assignedParcels: parcelId },
        }
      );
    }

    const updatedParcel = await Parcel.findByIdAndUpdate(parcelId, updateData, {
      new: true,
    }).populate("customer", "name phone email");

    // Send email based on status
    const customer = updatedParcel.customer;

    if (status === PARCEL_STATUS.DELIVERED) {
      await sendDeliveryConfirmation(updatedParcel, customer);
    } else {
      await sendStatusUpdate(updatedParcel, customer, status);
    }

    // Emit socket event
    const io = req.app.get("io");
    io.emit("parcel:statusUpdate", {
      parcelId,
      status,
      customerId: updatedParcel.customer._id,
    });

    res.json({ success: true, parcel: updatedParcel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Agent: Update location
export const updateAgentLocation = async (req, res) => {
  try {
    const { lat, lng, parcelId } = req.body;

    await Agent.findOneAndUpdate(
      { user: req.user._id },
      { currentLocation: { lat, lng } }
    );

    if (parcelId) {
      await Parcel.findOneAndUpdate({ currentLocation: { lat, lng } });
    }

    // Emit socket event
    const io = req.app.get("io");
    io.emit("agent:locationUpdate", {
      agentId: req.user._id.toString(),
      location: { lat, lng },
    });

    res.json({ success: true, message: "Location updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalParcels,
      todayBookings,
      pendingParcels,
      deliveredToday,
      failedDeliveries,
      codAmount,
    ] = await Promise.all([
      Parcel.countDocuments(),
      Parcel.countDocuments({ createdAt: { $gte: today } }),
      Parcel.countDocuments({ status: PARCEL_STATUS.PENDING }),
      Parcel.countDocuments({
        status: PARCEL_STATUS.DELIVERED,
        deliveryDate: { $gte: today },
      }),
      Parcel.countDocuments({ status: PARCEL_STATUS.FAILED }),
      Parcel.aggregate([
        {
          $match: {
            paymentMode: "COD",
            status: PARCEL_STATUS.DELIVERED,
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalParcels,
        todayBookings,
        pendingParcels,
        deliveredToday,
        failedDeliveries,
        codAmount: codAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getParcelQRCode = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id).select(
      "qrCode trackingNumber customer assignedAgent"
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
        message: "Not authorized to access this QR code",
      });
    }

    if (!parcel.qrCode) {
      // Generate QR code if not exists
      const qrData = {
        parcelId: parcel._id,
        trackingNumber: parcel.trackingNumber,
        customer: parcel.customer,
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 0.95,
        margin: 1,
        width: 300,
      });

      parcel.qrCode = qrCodeDataURL;
      await parcel.save();
    }

    res.status(200).json({
      success: true,
      data: {
        qrCode: parcel.qrCode,
        trackingNumber: parcel.trackingNumber,
      },
    });
  } catch (error) {
    console.error("Error fetching QR code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch QR code",
      error: error.message,
    });
  }
};

export const verifyQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: "QR data is required",
      });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code format",
      });
    }

    // Find parcel
    const parcel = await Parcel.findById(parsedData.parcelId)
      .populate("customer", "name email phone")
      .populate("assignedAgent", "name email phone");

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }

    // Verify tracking number matches
    if (parcel.trackingNumber !== parsedData.trackingNumber) {
      return res.status(400).json({
        success: false,
        message: "QR code data mismatch",
      });
    }

    res.status(200).json({
      success: true,
      message: "QR code verified successfully",
      data: parcel,
    });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify QR code",
      error: error.message,
    });
  }
};

export const scanQRAndUpdateStatus = async (req, res) => {
  try {
    const { qrData, status, notes } = req.body;

    if (!qrData || !status) {
      return res.status(400).json({
        success: false,
        message: "QR data and status are required",
      });
    }

    // Valid statuses for agent scanning
    const validStatuses = [
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "failed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code format",
      });
    }

    // Find parcel assigned to this agent
    const parcel = await Parcel.findOne({
      _id: parsedData.parcelId,
      assignedAgent: req.user._id,
    }).populate("customer", "name email phone");

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found or not assigned to you",
      });
    }

    // Update status
    parcel.status = status;
    if (notes) parcel.notes = notes;

    if (status === "delivered") {
      parcel.actualDeliveryDate = new Date();
    } else if (status === "failed") {
      parcel.deliveryAttempts += 1;
      if (notes) parcel.failureReason = notes;
    }

    parcel._currentUser = req.user._id; // For status history
    await parcel.save();

    // Emit socket event
    if (req.app.get("io")) {
      req.app.get("io").emit(`parcel-status-${parcel._id}`, {
        status: parcel.status,
        timestamp: new Date(),
      });
    }

    // Send notification to customer
    // await sendStatusUpdateEmail(parcel.customer.email, parcel);

    res.status(200).json({
      success: true,
      message: `Parcel status updated to ${status}`,
      data: parcel,
    });
  } catch (error) {
    console.error("Error scanning QR and updating status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update parcel status",
      error: error.message,
    });
  }
};
