import React, { useEffect, useState } from "react";
import axios from "axios";

const AgentLocationUpdater = ({ parcelId, socket }) => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  // Update location to backend
  const updateLocationToBackend = async (locationData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/parcels/agent/location`,
        {
          parcelId,
          location: locationData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Emit socket event for real-time update
      if (socket) {
        socket.emit("agent-location-update", {
          parcelId,
          location: locationData,
        });
      }

      return response.data;
    } catch (err) {
      console.error("Failed to update location:", err);
      throw err;
    }
  };

  // Start tracking
  const startTracking = async () => {
    try {
      setError(null);
      setIsTracking(true);

      // Get initial location
      const initialLocation = await getCurrentLocation();
      setLocation(initialLocation);
      await updateLocationToBackend(initialLocation);

      // Watch position for continuous updates
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          async (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            };

            setLocation(newLocation);

            // Update every 30 seconds to avoid too many requests
            await updateLocationToBackend(newLocation);
          },
          (error) => {
            console.error("Error watching position:", error);
            setError(error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 30000,
          }
        );

        setWatchId(id);
      }
    } catch (err) {
      setError(err.message);
      setIsTracking(false);
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Location Tracking</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {location && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">
            <strong>Current Position:</strong>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Accuracy: ±{location.accuracy.toFixed(0)}m
          </p>
          <p className="text-xs text-gray-500">
            Last updated: {new Date(location.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Tracking
          </button>
        )}
      </div>

      {isTracking && (
        <div className="mt-3 flex items-center justify-center text-sm text-green-600">
          <span className="animate-pulse mr-2">●</span>
          Location tracking active
        </div>
      )}
    </div>
  );
};

export default AgentLocationUpdater;
