import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const pickupIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const deliveryIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const agentIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to fit map bounds to markers
function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);

  return null;
}

const TrackingMap = ({ parcel, agentLocation, socket }) => {
  const [currentAgentLocation, setCurrentAgentLocation] =
    useState(agentLocation);

  useEffect(() => {
    if (socket && parcel?._id) {
      // Listen for real-time agent location updates
      socket.on(`agent-location-${parcel._id}`, (location) => {
        setCurrentAgentLocation(location);
      });

      return () => {
        socket.off(`agent-location-${parcel._id}`);
      };
    }
  }, [socket, parcel]);

  if (!parcel) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No parcel data available</p>
      </div>
    );
  }

  const { pickupAddress, deliveryAddress } = parcel;

  // Parse coordinates (assuming they come as strings or objects)
  const pickupCoords =
    pickupAddress?.coordinates || pickupAddress?.location?.coordinates;
  const deliveryCoords =
    deliveryAddress?.coordinates || deliveryAddress?.location?.coordinates;

  // Extract lat/lng
  const pickupPos = pickupCoords
    ? [pickupCoords.lat || pickupCoords[1], pickupCoords.lng || pickupCoords[0]]
    : null;

  const deliveryPos = deliveryCoords
    ? [
        deliveryCoords.lat || deliveryCoords[1],
        deliveryCoords.lng || deliveryCoords[0],
      ]
    : null;

  const agentPos = currentAgentLocation
    ? [currentAgentLocation.lat, currentAgentLocation.lng]
    : null;

  // Collect all valid positions
  const allPositions = [pickupPos, deliveryPos, agentPos].filter(Boolean);

  if (allPositions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">
          No location data available for this parcel
        </p>
      </div>
    );
  }

  // Calculate center
  const center = allPositions[0];

  // Polyline positions (pickup -> agent -> delivery)
  const polylinePositions = [];
  if (pickupPos) polylinePositions.push(pickupPos);
  if (agentPos) polylinePositions.push(agentPos);
  if (deliveryPos) polylinePositions.push(deliveryPos);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Location Marker */}
        {pickupPos && (
          <Marker position={pickupPos} icon={pickupIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-green-600">Pickup Location</strong>
                <p className="mt-1">
                  {pickupAddress?.address || "Pickup Address"}
                </p>
                {pickupAddress?.city && (
                  <p className="text-xs text-gray-600">{pickupAddress.city}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Delivery Location Marker */}
        {deliveryPos && (
          <Marker position={deliveryPos} icon={deliveryIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-red-600">Delivery Location</strong>
                <p className="mt-1">
                  {deliveryAddress?.address || "Delivery Address"}
                </p>
                {deliveryAddress?.city && (
                  <p className="text-xs text-gray-600">
                    {deliveryAddress.city}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Agent Current Location Marker */}
        {agentPos && (
          <Marker position={agentPos} icon={agentIcon}>
            <Popup>
              <div className="text-sm">
                <strong className="text-blue-600">Delivery Agent</strong>
                <p className="mt-1">Current Location</p>
                <p className="text-xs text-gray-600">
                  Status: {parcel.status || "In Transit"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Polyline connecting all points */}
        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* Auto-fit bounds */}
        <FitBounds positions={allPositions} />
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
