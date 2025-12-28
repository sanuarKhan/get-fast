// // Add these routes to your parcel.route.js file

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  bookParcel,
  getParcelQRCode,
  verifyQRCode,
  scanQRAndUpdateStatus
} from '../controllers/parcel.controller.js';

const router = express.Router();

// QR Code Routes

// @route   POST /api/parcels/book
// @desc    Book a parcel (generates QR code automatically)
// @access  Private (Customer)
router.post('/book', protect, authorize('customer'), bookParcel);

// @route   GET /api/parcels/:id/qrcode
// @desc    Get QR code for a specific parcel
// @access  Private (Customer, Agent, Admin)
router.get('/:id/qrcode', protect, getParcelQRCode);

// @route   POST /api/parcels/verify-qr
// @desc    Verify QR code and get parcel details
// @access  Private (Agent, Admin)
router.post('/verify-qr', protect, authorize('agent', 'admin'), verifyQRCode);

// @route   POST /api/parcels/scan-qr
// @desc    Scan QR code and update parcel status
// @access  Private (Agent only)
router.post('/scan-qr', protect, authorize('agent'), scanQRAndUpdateStatus);

export default router;