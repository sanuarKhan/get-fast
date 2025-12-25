import QRCode from "qrcode";

export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data);
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw error;
  }
};
