import nodemailer from "nodemailer";
import {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM,
} from "../constants.js";

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export const sendBookingConfirmation = async (parcel, email) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: `Booking Confirmed - ${parcel.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Booking Confirmed</h2>
        <p>Dear ${parcel.customer.name},</p>
        <p>Your parcel has been booked successfully!</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <p><strong>Booking ID:</strong> ${parcel.bookingId}</p>
          <p><strong>Pickup:</strong> ${parcel.pickupAddress.city}, ${parcel.pickupAddress.state}</p>
          <p><strong>Delivery:</strong> ${parcel.deliveryAddress.city}, ${parcel.deliveryAddress.state}</p>
          <p><strong>Size:</strong> ${parcel.parcelSize}</p>
          <p><strong>Payment:</strong> ${parcel.paymentMode} - ৳${parcel.amount}</p>
        </div>
        
        <p>You will receive updates as your parcel moves through our system.</p>
        <p>Thank you for choosing our service!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Booking confirmation email sent");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export const sendStatusUpdate = async (parcel, customer, status) => {
  const statusMessages = {
    Assigned: "A delivery agent has been assigned to your parcel.",
    PickedUp: "Your parcel has been picked up by our agent.",
    InTransit: "Your parcel is on the way to delivery.",
    Delivered: "Your parcel has been delivered successfully!",
    Failed: "Delivery attempt failed. We will try again soon.",
  };

  const mailOptions = {
    from: EMAIL_FROM,
    to: customer.email,
    subject: `Status Update - ${parcel.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Parcel Status Update</h2>
        <p>Dear ${customer.name},</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking ID:</strong> ${parcel.bookingId}</p>
          <p><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${status}</span></p>
          <p>${statusMessages[status]}</p>
        </div>
        
        ${
          parcel.agent
            ? `<p><strong>Agent:</strong> ${parcel.agent.name} (${parcel.agent.phone})</p>`
            : ""
        }
        ${
          status === "Failed" && parcel.failureReason
            ? `<p><strong>Reason:</strong> ${parcel.failureReason}</p>`
            : ""
        }
        
        <p>Track your parcel for real-time updates.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Status update email sent");
  } catch (error) {
    console.error("Email error:", error);
  }
};

export const sendDeliveryConfirmation = async (parcel, customer) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to: customer.email,
    subject: `Delivered - ${parcel.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Delivery Confirmed ✓</h2>
        <p>Dear ${customer.name},</p>
        <p>Great news! Your parcel has been delivered successfully.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <p><strong>Booking ID:</strong> ${parcel.bookingId}</p>
          <p><strong>Delivered on:</strong> ${new Date(
            parcel.deliveryDate
          ).toLocaleString()}</p>
          ${
            parcel.paymentMode === "COD"
              ? `<p><strong>COD Amount:</strong> ৳${parcel.amount}</p>`
              : ""
          }
        </div>
        
        <p>Thank you for using our courier service!</p>
        <p>We hope to serve you again soon.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Delivery confirmation email sent");
  } catch (error) {
    console.error("Email error:", error);
  }
};
