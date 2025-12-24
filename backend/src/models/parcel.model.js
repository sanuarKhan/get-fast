import mongoose from "mongoose";
import { PARCEL_STATUS, PAYMENT_MODE } from "../constants.js";

const parcelSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pickupAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "Bangladesh" },
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "Bangladesh" },
    },
    pickupCoords: {
      lat: Number,
      lng: Number,
    },
    deliveryCoords: {
      lat: Number,
      lng: Number,
    },
    currentLocation: {
      lat: Number,
      lng: Number,
    },
    parcelSize: {
      type: String,
      enum: ["Small", "Medium", "Large", "Extra Large"],
      required: true,
    },
    parcelType: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: Object.values(PAYMENT_MODE),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PARCEL_STATUS),
      default: PARCEL_STATUS.PENDING,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    qrCode: String,
    deliveryDate: Date,
    failureReason: String,
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

parcelSchema.pre("validate", function () {
  if (!this.bookingId) {
    this.bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
});

export default mongoose.model("Parcel", parcelSchema);
