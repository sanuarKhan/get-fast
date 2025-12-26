import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import TrackingMap from "../components/TrackingMap";
import AgentLocationUpdater from "../components/AgentLocationUpdater";

const TrackingPage = () => {
  const { parcelId } = useParams();
  const [parcel, setParcel] = useState(null);
  const [agentLocation, setAgentLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAgent = user.role === "agent";

  useEffect(() => {
    // Initialize Socket.IO
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    fetchParcelDetails();
    fetchAgentLocation();
  }, [parcelId]);

  const fetchParcelDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/parcels/${parcelId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setParcel(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch parcel details");
      console.error("Error fetching parcel:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentLocation = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/parcels/${parcelId}/agent-location`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.data) {
        setAgentLocation(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching agent location:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parcel details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      picked_up: "bg-purple-100 text-purple-800",
      in_transit: "bg-indigo-100 text-indigo-800",
      out_for_delivery: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatStatus = (status) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Track Parcel</h1>
          <p className="mt-2 text-gray-600">
            Tracking Number:{" "}
            <span className="font-semibold">{parcel?.trackingNumber}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Live Tracking</h2>
              <TrackingMap
                parcel={parcel}
                agentLocation={agentLocation}
                socket={socket}
              />
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Timeline</h2>
              {parcel?.statusHistory && parcel.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {parcel.statusHistory.reverse().map((history, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            index === 0 ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        >
                          <span className="text-white text-xs">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-gray-900">
                          {formatStatus(history.status)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(history.timestamp).toLocaleString()}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No status updates yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Current Status</h3>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  parcel?.status
                )}`}
              >
                {formatStatus(parcel?.status)}
              </span>
            </div>

            {/* Agent Location Updater (Only for Agents) */}
            {isAgent && (
              <AgentLocationUpdater parcelId={parcelId} socket={socket} />
            )}

            {/* Parcel Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Parcel Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Size</dt>
                  <dd className="text-sm text-gray-900 capitalize">
                    {parcel?.parcelSize}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-sm text-gray-900">
                    {parcel?.parcelType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment</dt>
                  <dd className="text-sm text-gray-900 uppercase">
                    {parcel?.paymentMethod}
                  </dd>
                </div>
                {parcel?.paymentMethod === "cod" && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      COD Amount
                    </dt>
                    <dd className="text-sm text-gray-900">
                      ৳{parcel?.codAmount}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Addresses</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Pickup
                  </p>
                  <p className="text-sm text-gray-900">
                    {parcel?.pickupAddress?.address}
                  </p>
                  {parcel?.pickupAddress?.city && (
                    <p className="text-xs text-gray-600">
                      {parcel.pickupAddress.city}
                    </p>
                  )}
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Delivery
                  </p>
                  <p className="text-sm text-gray-900">
                    {parcel?.deliveryAddress?.address}
                  </p>
                  {parcel?.deliveryAddress?.city && (
                    <p className="text-xs text-gray-600">
                      {parcel.deliveryAddress.city}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
