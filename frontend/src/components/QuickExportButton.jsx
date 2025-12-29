import React, { useState } from "react";
import axios from "axios";

const QuickExportButton = ({
  filters = {},
  type = "parcels",
  label = "Export",
  variant = "default", // 'default', 'icon', 'small'
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setShowMenu(false);

      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const url = `${
        import.meta.env.VITE_API_URL
      }/api/admin/export/${type}/${format}?${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/pdf",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${type}-export-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={exporting}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Export"
        >
          {exporting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : (
            <svg
              className="w-5 h-5"
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
          )}
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            ></div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center text-sm"
              >
                <span className="mr-2">📊</span> Export as CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center text-sm border-t"
              >
                <span className="mr-2">📄</span> Export as PDF
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === "small") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={exporting}
          className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {exporting ? "Exporting..." : label}
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            ></div>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-t"
              >
                PDF
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Exporting...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 mr-2"
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
            {label}
          </>
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={() => handleExport("csv")}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center border-t"
            >
              <svg
                className="w-5 h-5 mr-2 text-red-600"
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
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickExportButton;

// Usage Examples:
/*
// Default button
<QuickExportButton 
  filters={{ status: 'delivered', startDate: '2024-01-01' }}
  type="parcels"
  label="Export Report"
/>

// Icon button (for toolbars)
<QuickExportButton 
  filters={{ status: 'delivered' }}
  type="parcels"
  variant="icon"
/>

// Small button
<QuickExportButton 
  filters={{}}
  type="users"
  variant="small"
  label="Export"
/>
*/
