import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentLocation: {
      lat: Number,
      lng: Number,
    },
    assignedParcels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parcel",
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    successfulDeliveries: {
      type: Number,
      default: 0,
    },
    failedDeliveries: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Agent", agentSchema);
