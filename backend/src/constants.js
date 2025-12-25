import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const EMAIL_HOST = process.env.EMAIL_HOST;
export const EMAIL_PORT = process.env.EMAIL_PORT;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
export const EMAIL_FROM = process.env.EMAIL_FROM;

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
export const PARCEL_STATUS_BN = {
  Pending: "পেন্ডিং (অপেক্ষমান)",
  "Picked Up": "সংগ্রহ করা হয়েছে",
  "In Transit": "পথে আছে",
  Delivered: "পৌঁছে দেওয়া হয়েছে",
  Failed: "ব্যর্থ হয়েছে",
};

export const PAYMENT_MODE = {
  COD: "COD",
  PREPAID: "Prepaid",
};
