// Install: npm install json2csv pdfkit

import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import Parcel from "../models/Parcel.js";
import User from "../models/User.js";

// @desc    Export parcels to CSV
// @route   GET /api/admin/export/parcels/csv
// @access  Private (Admin)
export const exportParcelsToCSV = async (req, res) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;

    // Build query
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Fetch parcels
    const parcels = await Parcel.find(query)
      .populate("customer", "name email phone")
      .populate("assignedAgent", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Transform data for CSV
    const csvData = parcels.map((parcel) => ({
      "Tracking Number": parcel.trackingNumber,
      "Customer Name": parcel.customer?.name || "N/A",
      "Customer Email": parcel.customer?.email || "N/A",
      "Customer Phone": parcel.customer?.phone || "N/A",
      "Pickup Address": parcel.pickupAddress?.address || "N/A",
      "Pickup City": parcel.pickupAddress?.city || "N/A",
      "Delivery Address": parcel.deliveryAddress?.address || "N/A",
      "Delivery City": parcel.deliveryAddress?.city || "N/A",
      "Parcel Size": parcel.parcelSize,
      "Parcel Type": parcel.parcelType,
      "Weight (kg)": parcel.weight || "N/A",
      "Payment Method": parcel.paymentMethod.toUpperCase(),
      "COD Amount (BDT)": parcel.paymentMethod === "cod" ? parcel.codAmount : 0,
      Status: parcel.status,
      "Assigned Agent": parcel.assignedAgent?.name || "Not Assigned",
      "Agent Email": parcel.assignedAgent?.email || "N/A",
      "Agent Phone": parcel.assignedAgent?.phone || "N/A",
      "Booking Date": new Date(parcel.createdAt).toLocaleDateString(),
      "Booking Time": new Date(parcel.createdAt).toLocaleTimeString(),
      "Estimated Delivery": parcel.estimatedDeliveryDate
        ? new Date(parcel.estimatedDeliveryDate).toLocaleDateString()
        : "N/A",
      "Actual Delivery Date": parcel.actualDeliveryDate
        ? new Date(parcel.actualDeliveryDate).toLocaleDateString()
        : "N/A",
      "Delivery Attempts": parcel.deliveryAttempts || 0,
      "Failure Reason": parcel.failureReason || "N/A",
      Notes: parcel.notes || "N/A",
    }));

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=parcels-report-${Date.now()}.csv`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data to CSV",
      error: error.message,
    });
  }
};

// @desc    Export parcels to PDF
// @route   GET /api/admin/export/parcels/pdf
// @access  Private (Admin)
export const exportParcelsToPDF = async (req, res) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;

    // Build query
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Fetch parcels and stats
    const [parcels, stats] = await Promise.all([
      Parcel.find(query)
        .populate("customer", "name email phone")
        .populate("assignedAgent", "name email")
        .sort({ createdAt: -1 })
        .limit(1000) // Limit for PDF performance
        .lean(),

      Parcel.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalParcels: { $sum: 1 },
            totalCOD: {
              $sum: {
                $cond: [{ $eq: ["$paymentMethod", "cod"] }, "$codAmount", 0],
              },
            },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const summary = stats[0] || {
      totalParcels: 0,
      totalCOD: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
    };

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=parcels-report-${Date.now()}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("GetFast Courier Service", { align: "center" });
    doc.fontSize(16).text("Parcels Report", { align: "center" });
    doc.moveDown();

    // Report metadata
    doc.fontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
    if (startDate)
      doc.text(`From: ${new Date(startDate).toLocaleDateString()}`, {
        align: "right",
      });
    if (endDate)
      doc.text(`To: ${new Date(endDate).toLocaleDateString()}`, {
        align: "right",
      });
    doc.moveDown();

    // Summary Statistics
    doc.fontSize(14).text("Summary Statistics", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    const summaryY = doc.y;

    // Left column
    doc.text(`Total Parcels: ${summary.totalParcels}`, 50, summaryY);
    doc.text(`Delivered: ${summary.delivered}`, 50, summaryY + 15);
    doc.text(`Failed: ${summary.failed}`, 50, summaryY + 30);

    // Right column
    doc.text(`Pending: ${summary.pending}`, 300, summaryY);
    doc.text(
      `Total COD: ৳${summary.totalCOD.toLocaleString()}`,
      300,
      summaryY + 15
    );
    doc.text(
      `Success Rate: ${
        summary.totalParcels
          ? ((summary.delivered / summary.totalParcels) * 100).toFixed(1)
          : 0
      }%`,
      300,
      summaryY + 30
    );

    doc.moveDown(3);

    // Table Header
    doc.fontSize(12).text("Parcel Details", { underline: true });
    doc.moveDown(0.5);

    // Table
    const tableTop = doc.y;
    const itemHeight = 20;
    let currentY = tableTop;

    // Table headers
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("Tracking #", 50, currentY, { width: 80 });
    doc.text("Customer", 135, currentY, { width: 80 });
    doc.text("Delivery Address", 220, currentY, { width: 120 });
    doc.text("Status", 345, currentY, { width: 60 });
    doc.text("COD", 410, currentY, { width: 50 });
    doc.text("Date", 465, currentY, { width: 80 });

    doc
      .moveTo(50, currentY + 12)
      .lineTo(550, currentY + 12)
      .stroke();
    currentY += itemHeight;

    // Table rows
    doc.font("Helvetica").fontSize(7);

    parcels.slice(0, 50).forEach((parcel, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;

        // Repeat headers on new page
        doc.fontSize(8).font("Helvetica-Bold");
        doc.text("Tracking #", 50, currentY, { width: 80 });
        doc.text("Customer", 135, currentY, { width: 80 });
        doc.text("Delivery Address", 220, currentY, { width: 120 });
        doc.text("Status", 345, currentY, { width: 60 });
        doc.text("COD", 410, currentY, { width: 50 });
        doc.text("Date", 465, currentY, { width: 80 });
        doc
          .moveTo(50, currentY + 12)
          .lineTo(550, currentY + 12)
          .stroke();
        currentY += itemHeight;
        doc.font("Helvetica").fontSize(7);
      }

      doc.text(parcel.trackingNumber, 50, currentY, { width: 80 });
      doc.text(parcel.customer?.name || "N/A", 135, currentY, { width: 80 });
      doc.text(parcel.deliveryAddress?.city || "N/A", 220, currentY, {
        width: 120,
      });
      doc.text(parcel.status, 345, currentY, { width: 60 });
      doc.text(
        parcel.paymentMethod === "cod" ? `৳${parcel.codAmount}` : "-",
        410,
        currentY,
        { width: 50 }
      );
      doc.text(new Date(parcel.createdAt).toLocaleDateString(), 465, currentY, {
        width: 80,
      });

      currentY += itemHeight;
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, {
          align: "center",
        });
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data to PDF",
      error: error.message,
    });
  }
};

// @desc    Export users to CSV
// @route   GET /api/admin/export/users/csv
// @access  Private (Admin)
export const exportUsersToCSV = async (req, res) => {
  try {
    const { role } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const csvData = users.map((user) => ({
      Name: user.name,
      Email: user.email,
      Phone: user.phone || "N/A",
      Role: user.role,
      Address: user.address || "N/A",
      "Registration Date": new Date(user.createdAt).toLocaleDateString(),
      "Last Updated": new Date(user.updatedAt).toLocaleDateString(),
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users-report-${Date.now()}.csv`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting users to CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export users to CSV",
      error: error.message,
    });
  }
};

// @desc    Get export summary (for UI)
// @route   GET /api/admin/export/summary
// @access  Private (Admin)
export const getExportSummary = async (req, res) => {
  try {
    const { startDate, endDate, status, paymentMethod } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const count = await Parcel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        recordCount: count,
        filters: { startDate, endDate, status, paymentMethod },
      },
    });
  } catch (error) {
    console.error("Error getting export summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get export summary",
      error: error.message,
    });
  }
};
