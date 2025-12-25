import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Phone, User } from "lucide-react";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
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

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Assigned: "bg-blue-100 text-blue-800",
  PickedUp: "bg-purple-100 text-purple-800",
  InTransit: "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
};

export default function TrackParcel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agentLocation, setAgentLocation] = useState(null);

  useEffect(() => {
    fetchParcel();
  }, [id]);

  useEffect(() => {
    if (socket && parcel) {
      socket.on("parcel:statusUpdate", (data) => {
        if (data.parcelId === id) {
          fetchParcel();
        }
      });

      socket.on("agent:locationUpdate", (data) => {
        if (parcel.agent && data.agentId === parcel.agent._id) {
          setAgentLocation(data.location);
        }
      });

      return () => {
        socket.off("parcel:statusUpdate");
        socket.off("agent:locationUpdate");
      };
    }
  }, [socket, parcel, id]);

  const fetchParcel = async () => {
    try {
      const response = await api.get(`/api/parcels/${id}`);
      setParcel(response.data.parcel);

      // Set initial agent location if available
      if (response.data.parcel.currentLocation) {
        setAgentLocation(response.data.parcel.currentLocation);
      }
    } catch (error) {
      console.error("Failed to fetch parcel:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Parcel not found</p>
          <Button onClick={() => navigate("/customer")}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Calculate map center - use agent location if available, otherwise midpoint
  const center = agentLocation || {
    lat: (parcel.pickupCoords.lat + parcel.deliveryCoords.lat) / 2,
    lng: (parcel.pickupCoords.lng + parcel.deliveryCoords.lng) / 2,
  };

  // Polyline path - pickup to delivery
  const routePath = [
    [parcel.pickupCoords.lat, parcel.pickupCoords.lng],
    [parcel.deliveryCoords.lat, parcel.deliveryCoords.lng],
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/customer")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Track Parcel</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Parcel Details */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Parcel Details</CardTitle>
                <Badge className={statusColors[parcel.status]}>
                  {parcel.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Booking ID</p>
                <p className="font-semibold">{parcel.bookingId}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Parcel Type</p>
                <p className="font-semibold">{parcel.parcelType}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-slate-600">Size</p>
                  <p className="font-semibold">{parcel.parcelSize}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Weight</p>
                  <p className="font-semibold">{parcel.weight}kg</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600">Payment</p>
                <p className="font-semibold">
                  {parcel.paymentMode} - ৳{parcel.amount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Addresses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <p className="text-sm font-medium">Pickup</p>
                </div>
                <p className="text-sm text-slate-600 ml-5">
                  {parcel.pickupAddress.street}, {parcel.pickupAddress.city}
                  <br />
                  {parcel.pickupAddress.state} - {parcel.pickupAddress.zipCode}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <p className="text-sm font-medium">Delivery</p>
                </div>
                <p className="text-sm text-slate-600 ml-5">
                  {parcel.deliveryAddress.street}, {parcel.deliveryAddress.city}
                  <br />
                  {parcel.deliveryAddress.state} -{" "}
                  {parcel.deliveryAddress.zipCode}
                </p>
              </div>
            </CardContent>
          </Card>

          {parcel.agent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="font-semibold">{parcel.agent.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-600" />
                  <span className="text-sm">{parcel.agent.phone}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {parcel.qrCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <img
                  src={parcel.qrCode}
                  alt="Parcel QR Code"
                  className="w-48 h-48"
                />
                <p className="text-sm text-slate-600 mt-2">
                  Scan for quick tracking
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {parcel.statusHistory?.map((history, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                      {index !== parcel.statusHistory.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{history.status}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(history.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-[700px]">
            <CardContent className="p-0 h-full">
              <MapContainer
                center={[center.lat, center.lng]}
                zoom={13}
                style={{ height: "100%", width: "100%", borderRadius: "8px" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Pickup Marker - Green */}
                <Marker
                  position={[parcel.pickupCoords.lat, parcel.pickupCoords.lng]}
                  icon={pickupIcon}
                >
                  <Popup>
                    <strong>Pickup Location</strong>
                    <br />
                    {parcel.pickupAddress.city}
                  </Popup>
                </Marker>

                {/* Delivery Marker - Red */}
                <Marker
                  position={[
                    parcel.deliveryCoords.lat,
                    parcel.deliveryCoords.lng,
                  ]}
                  icon={deliveryIcon}
                >
                  <Popup>
                    <strong>Delivery Location</strong>
                    <br />
                    {parcel.deliveryAddress.city}
                  </Popup>
                </Marker>

                {/* Agent Location - Blue (real-time) */}
                {agentLocation && (
                  <Marker
                    position={[agentLocation.lat, agentLocation.lng]}
                    icon={agentIcon}
                  >
                    <Popup>
                      <strong>Agent Current Location</strong>
                      <br />
                      {parcel.agent?.name}
                    </Popup>
                  </Marker>
                )}

                {/* Route Polyline */}
                <Polyline
                  positions={routePath}
                  pathOptions={{
                    color: "#0011dd",
                    weight: 5,
                    opacity: 1,
                    dashArray: "10, 10",
                  }}
                />
              </MapContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
