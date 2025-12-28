import React, { useState } from "react";
import QRScanner from "../components/QRScanner";

const AgentScannerPage = () => {
  const [scanHistory, setScanHistory] = useState([]);

  const handleScanSuccess = (data, result) => {
    // Add to scan history
    setScanHistory((prev) => [
      {
        data,
        timestamp: new Date(),
        success: true,
      },
      ...prev.slice(0, 9),
    ]); // Keep last 10 scans
  };

  const handleScanError = (error) => {
    setScanHistory((prev) => [
      {
        error,
        timestamp: new Date(),
        success: false,
      },
      ...prev.slice(0, 9),
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Scan Parcel QR Code
          </h1>
          <p className="mt-2 text-gray-600">
            Use your camera to scan parcel QR codes and update delivery status
          </p>
        </div>

        {/* Scanner */}
        <div className="mb-8">
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How to Use
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Click "Start Scanning" to activate your camera</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Point your camera at the parcel's QR code</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Wait for automatic detection and verification</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>
                Review parcel details and select the appropriate status
              </span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">5.</span>
              <span>Add optional notes and confirm the status update</span>
            </li>
          </ol>
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Scans
            </h3>
            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    scan.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {scan.success ? (
                        <p className="text-sm text-green-800 font-medium">
                          ✓ Scan successful
                        </p>
                      ) : (
                        <p className="text-sm text-red-800 font-medium">
                          ✗ {scan.error}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {scan.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Tips for Best Results
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Ensure good lighting for faster scanning</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Hold your device steady and at the correct distance</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Make sure the QR code is not damaged or obscured</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Grant camera permissions when prompted</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AgentScannerPage;
