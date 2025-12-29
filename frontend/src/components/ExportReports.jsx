import React, { useState, useEffect } from "react";
import axios from "axios";

const ExportReportsPage = () => {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    paymentMethod: "",
  });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.status) params.append("status", filters.status);
      if (filters.paymentMethod)
        params.append("paymentMethod", filters.paymentMethod);

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/admin/export/summary?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSummary(response.data.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, dataType = "parcels") => {
    try {
      setExporting(true);
      setExportType(`${type}-${dataType}`);

      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.status) params.append("status", filters.status);
      if (filters.paymentMethod)
        params.append("paymentMethod", filters.paymentMethod);

      const url = `${
        import.meta.env.VITE_API_URL
      }/api/admin/export/${dataType}/${type}?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: type === "csv" ? "text/csv" : "application/pdf",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${dataType}-report-${Date.now()}.${type}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      alert(`${type.toUpperCase()} file downloaded successfully!`);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Failed to export. Please try again.");
    } finally {
      setExporting(false);
      setExportType("");
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "",
      paymentMethod: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Export Reports</h1>
          <p className="mt-2 text-gray-600">
            Generate and download reports in CSV or PDF format
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Filters
              </h2>

              {/* Date Range */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    handleFilterChange("paymentMethod", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Methods</option>
                  <option value="cod">COD</option>
                  <option value="prepaid">Prepaid</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>

              {/* Summary */}
              {summary && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    Records to Export
                  </p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {summary.recordCount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parcel Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mr-4">
                  📦
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Parcel Reports
                  </h2>
                  <p className="text-sm text-gray-600">
                    Export parcel data with detailed information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport("csv", "parcels")}
                  disabled={exporting || !summary || summary.recordCount === 0}
                  className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {exporting && exportType === "csv-parcels" ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export as CSV
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExport("pdf", "parcels")}
                  disabled={exporting || !summary || summary.recordCount === 0}
                  className="flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {exporting && exportType === "pdf-parcels" ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      Export as PDF
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>CSV includes:</strong> All parcel details, customer
                  info, agent info, dates, and status
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>PDF includes:</strong> Summary statistics and parcel
                  details (limited to 50 parcels for performance)
                </p>
              </div>
            </div>

            {/* User Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mr-4">
                  👥
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    User Reports
                  </h2>
                  <p className="text-sm text-gray-600">
                    Export user data (customers, agents, admins)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport("csv", "users")}
                  disabled={exporting}
                  className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {exporting && exportType === "csv-users" ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Exporting...
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export Users as CSV
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Export Presets */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Export Presets
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PresetButton
                  title="Today's Deliveries"
                  icon="📅"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    setFilters({
                      startDate: today,
                      endDate: today,
                      status: "delivered",
                      paymentMethod: "",
                    });
                  }}
                />

                <PresetButton
                  title="This Month COD"
                  icon="💰"
                  onClick={() => {
                    const firstDay = new Date();
                    firstDay.setDate(1);
                    const today = new Date();
                    setFilters({
                      startDate: firstDay.toISOString().split("T")[0],
                      endDate: today.toISOString().split("T")[0],
                      status: "delivered",
                      paymentMethod: "cod",
                    });
                  }}
                />

                <PresetButton
                  title="Failed Deliveries"
                  icon="❌"
                  onClick={() => {
                    setFilters({
                      startDate: "",
                      endDate: "",
                      status: "failed",
                      paymentMethod: "",
                    });
                  }}
                />

                <PresetButton
                  title="All Pending"
                  icon="⏳"
                  onClick={() => {
                    setFilters({
                      startDate: "",
                      endDate: "",
                      status: "pending",
                      paymentMethod: "",
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PresetButton = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
  >
    <span className="text-2xl mr-3">{icon}</span>
    <span className="font-medium text-gray-900">{title}</span>
  </button>
);

export default ExportReportsPage;
