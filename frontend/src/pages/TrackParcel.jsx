import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "@/context/SocketContext";
import api from "@/lib/api";
// import {
//   APIProvider,
//   Map,
//   Marker,
//   AdvancedMarker,
//   Pin,
// } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Package, Phone, User } from "lucide-react";
// import { Polyline } from "@/components/Polyline";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RecenterMap from "@/components/RecenterMap";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
        if (parcel?.agent?._id && data.agentId === parcel.agent._id) {
          console.log("New Location Received:", data.location);
          setAgentLocation(data.location);
        }
      });
      return () => {
        socket.off("parcel:statusUpdate");
        socket.off("agent:locationUpdate");
      };
    }
  }, [socket, parcel?.agent?._id, id]);

  const fetchParcel = async () => {
    try {
      const response = await api.get(`/api/parcels/${id}`);
      setParcel(response.data.parcel);
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

  const center = {
    lat: parcel.pickupCoords?.lat || 23.8103,
    lng: parcel.pickupCoords?.lng || 90.4125,
  };

  const path = [
    {
      lat: parcel.pickupCoords?.lat || 23.8103,
      lng: parcel.pickupCoords?.lng || 90.4125,
    },
    {
      lat: parcel.deliveryCoords?.lat || 23.8103,
      lng: parcel.deliveryCoords?.lng || 90.4125,
    },
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
        {/* Parcel Details */}
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
          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Addresses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Pickup</p>
                </div>
                <p className="text-sm text-slate-600">
                  {parcel.pickupAddress.street}, {parcel.pickupAddress.city}
                  <br />
                  {parcel.pickupAddress.state} - {parcel.pickupAddress.zipCode}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium">Delivery</p>
                </div>
                <p className="text-sm text-slate-600">
                  {parcel.deliveryAddress.street}, {parcel.deliveryAddress.city}
                  <br />
                  {parcel.deliveryAddress.state} -{" "}
                  {parcel.deliveryAddress.zipCode}
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Agent Info */}
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
          {/* QR Code */}
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
          {/* Status Timeline */}
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
          <Card className="h-150">
            <CardContent className="p-0 h-full">
              <MapContainer
                center={[center.lat, center.lng]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://github.com/sanuarKhan">GetFastBySanuarkhan</a>'
                />
                <RecenterMap location={agentLocation} />

                {/* Pickup Marker */}
                <Marker
                  position={[
                    parcel.pickupCoords?.lat || 23.8103,
                    parcel.pickupCoords?.lng || 90.4125,
                  ]}
                >
                  <Popup>Pickup Location</Popup>
                </Marker>

                {/* Delivery Marker */}
                <Marker
                  position={[
                    parcel.deliveryCoords?.lat || 23.8103,
                    parcel.deliveryCoords?.lng || 90.4125,
                  ]}
                >
                  <Popup>Delivery Location</Popup>
                </Marker>
                {console.log(agentLocation, parcel)}
                {/* Agent Location */}
                {agentLocation && (
                  <Marker position={[agentLocation.lat, agentLocation.lng]}>
                    <Popup>Agent Current Location</Popup>
                  </Marker>
                )}

                {/* Route Line */}
                <Polyline
                  positions={path.map((p) => [p.lat, p.lng])}
                  color="#2563eb"
                  weight={3}
                  opacity={0.7}
                />
              </MapContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
