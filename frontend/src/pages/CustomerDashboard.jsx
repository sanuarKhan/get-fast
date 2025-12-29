import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, MapPin } from "lucide-react";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Assigned: "bg-blue-100 text-blue-800",
  PickedUp: "bg-purple-100 text-purple-800",
  InTransit: "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
};

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      toast.success(location.state.message);
      setTimeout(() => setMessage(""), 5000);
    }
    fetchParcels();
  }, [location]);

  useEffect(() => {
    if (socket) {
      // Listen for status updates
      socket.on("parcel:statusUpdate", (data) => {
        if (data.customerId === user.id) {
          toast.info(`Parcel status updated to: ${data.status}`);
          fetchParcels();
        }
      });

      // Listen for assignment
      socket.on("parcel:assigned", (data) => {
        toast.info("Agent assigned to your parcel!");
        fetchParcels();
      });

      return () => {
        socket.off("parcel:statusUpdate");
        socket.off("parcel:assigned");
      };
    }
  }, [socket, user]);

  const fetchParcels = async () => {
    try {
      const response = await api.get("/api/parcels/my-bookings");
      setParcels(response.data.parcels);
    } catch (error) {
      console.error("Failed to fetch parcels:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <nav className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Customer Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </nav> */}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Bookings</h2>
          <Button onClick={() => navigate("/customer/book")}>
            <Plus className="h-4 w-4 mr-2" />
            Book Parcel
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : parcels.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">No parcels booked yet</p>
              <Button
                className="mt-4"
                onClick={() => navigate("/customer/book")}
              >
                Book Your First Parcel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {parcels.map((parcel) => (
              <Card key={parcel._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {parcel.bookingId}
                        </h3>
                        <Badge className={statusColors[parcel.status]}>
                          {parcel.status}
                        </Badge>
                      </div>

                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            From: {parcel.pickupAddress.city},{" "}
                            {parcel.pickupAddress.state}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            To: {parcel.deliveryAddress.city},{" "}
                            {parcel.deliveryAddress.state}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">
                          Size: {parcel.parcelSize}
                        </span>
                        <span className="text-slate-600">
                          Weight: {parcel.weight}kg
                        </span>
                        <span className="text-slate-600">
                          {parcel.paymentMode}: BDT {parcel.amount}
                        </span>
                      </div>

                      {parcel.agent && (
                        <div className="text-sm text-slate-600">
                          Agent: {parcel.agent.name} ({parcel.agent.phone})
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/customer/track/${parcel._id}`)}
                    >
                      Track
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
