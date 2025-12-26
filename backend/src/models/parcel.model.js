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
      // GeoJSON format for MongoDB geospatial queries
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
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

    // NEW FIELD: Agent's current location during delivery
    agentCurrentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
      accuracy: Number,
      timestamp: Date,
    },

    trackingNumber: {
      type: String,
      unique: true,
      required: true,
    },

    estimatedDeliveryDate: Date,

    actualDeliveryDate: Date,

    deliveryAttempts: {
      type: Number,
      default: 0,
    },

    failureReason: String,

    notes: String,

    qrCode: String, // Base64 QR code for scanning

    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        location: {
          type: {
            type: String,
            enum: ["Point"],
          },
          coordinates: [Number],
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create geospatial indexes for location-based queries
parcelSchema.index({ "pickupAddress.location": "2dsphere" });
parcelSchema.index({ "deliveryAddress.location": "2dsphere" });
parcelSchema.index({ agentCurrentLocation: "2dsphere" });

// Index for efficient queries
parcelSchema.index({ customer: 1, status: 1 });
parcelSchema.index({ assignedAgent: 1, status: 1 });
parcelSchema.index({ trackingNumber: 1 });
parcelSchema.index({ createdAt: -1 });

// Generate tracking number before saving
parcelSchema.pre("save", async function (next) {
  if (this.isNew && !this.trackingNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.trackingNumber = `GF${timestamp}${random}`;
  }

  // Sync coordinates with GeoJSON location
  if (this.pickupAddress && this.pickupAddress.coordinates) {
    this.pickupAddress.location = {
      type: "Point",
      coordinates: [
        this.pickupAddress.coordinates.lng,
        this.pickupAddress.coordinates.lat,
      ],
    };
  }

  if (this.deliveryAddress && this.deliveryAddress.coordinates) {
    this.deliveryAddress.location = {
      type: "Point",
      coordinates: [
        this.deliveryAddress.coordinates.lng,
        this.deliveryAddress.coordinates.lat,
      ],
    };
  }

  next();
});

// Add status to history when status changes
parcelSchema.pre("save", function (next) {
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this._currentUser || null,
    });
  }
  next();
});

// Virtual for delivery distance (in kilometers)
parcelSchema.virtual("deliveryDistance").get(function () {
  if (!this.pickupAddress?.location || !this.deliveryAddress?.location) {
    return null;
  }

  const R = 6371; // Earth's radius in km
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
  const distance = R * c;

  return Math.round(distance * 100) / 100;
});

const Parcel = mongoose.model("Parcel", parcelSchema);

export default Parcel;
