import mongoose from "mongoose";

const parcelSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pickupAddress: {
      address: { type: String, required: true },
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },

    deliveryAddress: {
      address: { type: String, required: true },
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },

    parcelSize: {
      type: String,
      enum: ["small", "medium", "large", "extra-large"],
      required: true,
    },

    parcelType: {
      type: String,
      required: true,
    },

    weight: Number,

    paymentMethod: {
      type: String,
      enum: ["cod", "prepaid"],
      required: true,
      default: "prepaid",
    },

    codAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed",
        "cancelled",
      ],
      default: "pending",
    },

    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    agentCurrentLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
      accuracy: Number,
      timestamp: Date,
    },

    trackingNumber: {
      type: String,
      unique: true,
      // REMOVED required: true to let pre-save hook generate it
    },

    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    deliveryAttempts: { type: Number, default: 0 },
    failureReason: String,
    notes: String,
    qrCode: String,

    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        location: {
          type: { type: String, enum: ["Point"] },
          coordinates: [Number],
        },
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

// Indexes
parcelSchema.index({ "pickupAddress.location": "2dsphere" });
parcelSchema.index({ "deliveryAddress.location": "2dsphere" });
parcelSchema.index({ agentCurrentLocation: "2dsphere", sparse: true }); // sparse: true allows null values
parcelSchema.index({ customer: 1, status: 1 });
parcelSchema.index({ assignedAgent: 1, status: 1 });
parcelSchema.index({ trackingNumber: 1 });
parcelSchema.index({ createdAt: -1 });

// Generate tracking number
parcelSchema.pre("save", function () {
  if (this.isNew && !this.trackingNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.trackingNumber = `GF${timestamp}${random}`;
  }
  // next();
});

// Add status to history
parcelSchema.pre("save", function () {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this._currentUser || null,
    });
  }
  // next();
});

// Virtual for delivery distance
parcelSchema.virtual("deliveryDistance").get(function () {
  if (!this.pickupAddress?.location || !this.deliveryAddress?.location)
    return null;

  const R = 6371;
  const lat1 = this.pickupAddress.location.coordinates[1];
  const lon1 = this.pickupAddress.location.coordinates[0];
  const lat2 = this.deliveryAddress.location.coordinates[1];
  const lon2 = this.deliveryAddress.location.coordinates[0];

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
});

const Parcel = mongoose.model("Parcel", parcelSchema);
export default Parcel;
