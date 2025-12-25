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

//Customer: Book a parcel

export const bookParcel = async (req, res) => {
  try {
    const {
      pickupAddress,
      deliveryAddress,
      pickupCoords,
      deliveryCoords,
      parcelSize,
      parcelType,
      weight,
      paymentMode,
      amount,
    } = req.body;

    const parcel = await Parcel.create({
      customer: req.user._id,
      pickupAddress,
      deliveryAddress,
      pickupCoords,
      deliveryCoords,
      parcelSize,
      parcelType,
      weight,
      paymentMode,
      amount,
      statusHistory: [
        {
          status: PARCEL_STATUS.PENDING,
          updatedBy: req.user._id,
        },
      ],
    });

    // Generate QR Code with booking ID
    const qrCode = await generateQRCode(parcel.bookingId);
    parcel.qrCode = qrCode;
    await parcel.save();

    // Send confirmation email
    const customer = await User.findById(req.user._id);
    await sendBookingConfirmation(parcel, customer);

    // Emit socket event
    const io = req.app.get("io");
    io.emit("parcel:new", parcel);

    res.json({ success: true, parcel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      agentId: req.user._id,
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
