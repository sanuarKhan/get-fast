import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AgentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [assignedParcels, setAssignedParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const [statsRes, parcelsRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL}/api/parcels/agent/stats`,
          config
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL}/api/parcels/agent/assigned`,
          config
        ),
      ]);

      setStats(statsRes.data.data || calculateStats(parcelsRes.data.data));
      setAssignedParcels(parcelsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching agent data:", error);
      // If stats endpoint doesn't exist, calculate from parcels
      if (assignedParcels.length > 0) {
        setStats(calculateStats(assignedParcels));
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (parcels) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: parcels.length,
      pending: parcels.filter((p) => p.status === "assigned").length,
      pickedUp: parcels.filter((p) => p.status === "picked_up").length,
      inTransit: parcels.filter((p) => p.status === "in_transit").length,
      outForDelivery: parcels.filter((p) => p.status === "out_for_delivery")
        .length,
      delivered: parcels.filter((p) => p.status === "delivered").length,
      failed: parcels.filter((p) => p.status === "failed").length,
      todayDelivered: parcels.filter(
        (p) =>
          p.status === "delivered" && new Date(p.actualDeliveryDate) >= today
      ).length,
      totalCOD: parcels
        .filter((p) => p.status === "delivered" && p.paymentMethod === "cod")
        .reduce((sum, p) => sum + p.codAmount, 0),
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: "bg-blue-100 text-blue-800",
      picked_up: "bg-purple-100 text-purple-800",
      in_transit: "bg-indigo-100 text-indigo-800",
      out_for_delivery: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Track your deliveries and performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Assigned"
            value={stats?.total || 0}
            icon="📦"
            color="blue"
          />
          <StatCard
            title="Pending Pickup"
            value={stats?.pending || 0}
            icon="⏳"
            color="yellow"
          />
          <StatCard
            title="In Progress"
            value={
              (stats?.pickedUp || 0) +
              (stats?.inTransit || 0) +
              (stats?.outForDelivery || 0)
            }
            icon="🚚"
            color="indigo"
          />
          <StatCard
            title="Delivered Today"
            value={stats?.todayDelivered || 0}
            icon="✅"
            color="green"
          />
        </div>

        {/* Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium opacity-90">Total Deliveries</p>
              <span className="text-3xl">🎯</span>
            </div>
            <p className="text-4xl font-bold">{stats?.delivered || 0}</p>
            <p className="text-sm opacity-75 mt-2">
              Success Rate:{" "}
              {stats?.total
                ? ((stats.delivered / stats.total) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium opacity-90">COD Collected</p>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-4xl font-bold">
              ৳{(stats?.totalCOD || 0).toLocaleString()}
            </p>
            <p className="text-sm opacity-75 mt-2">From delivered parcels</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/agent/scanner"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-4xl mb-3">📷</div>
            <h3 className="font-semibold text-gray-900 mb-1">Scan QR Code</h3>
            <p className="text-sm text-gray-600">Update parcel status</p>
          </Link>

          <Link
            to="/agent/parcels"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-semibold text-gray-900 mb-1">View Parcels</h3>
            <p className="text-sm text-gray-600">See all assignments</p>
          </Link>

          <Link
            to="/agent/route"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="font-semibold text-gray-900 mb-1">View Route</h3>
            <p className="text-sm text-gray-600">Optimized delivery path</p>
          </Link>
        </div>

        {/* Recent Parcels */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Assignments
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {assignedParcels.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No parcels assigned yet
              </div>
            ) : (
              assignedParcels.slice(0, 10).map((parcel) => (
                <div
                  key={parcel._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-semibold text-gray-900 mr-3">
                          {parcel.trackingNumber}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                            parcel.status
                          )}`}
                        >
                          {parcel.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {parcel.deliveryAddress?.address}
                      </p>
                      {parcel.paymentMethod === "cod" && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          COD: ৳{parcel.codAmount}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link
                        to={`/parcel/${parcel._id}/track`}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    indigo: "bg-indigo-500",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
