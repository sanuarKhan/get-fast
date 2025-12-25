import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";
export const NODE_ENV = process.env.NODE_ENV || "development";

export const ROLES = {
  ADMIN: "admin",
  AGENT: "agent",
  CUSTOMER: "customer",
};

export const PARCEL_STATUS = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  PICKED_UP: "PickedUp",
  IN_TRANSIT: "InTransit",
  DELIVERED: "Delivered",
  FAILED: "Failed",
};

export const PAYMENT_MODE = {
  COD: "COD",
  PREPAID: "Prepaid",
};
