import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, MapPin, XCircle, Truck, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Assigned: "bg-blue-100 text-blue-800",
  PickedUp: "bg-purple-100 text-purple-800",
  InTransit: "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
};

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [updating, setUpdating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchParcels();
  }, []);
  // const updateTestLocation = async () => {
  //   try {
  //     await api.patch("/api/parcels/agent/location", {
  //       lat: 23.8103 + (Math.random() - 0.9) * 0.2,
  //       lng: 90.4125 + (Math.random() - 0.9) * 0.2,
  //     });
  //   } catch (error) {
  //     console.error("Failed to update location");
  //   }
  // };

  const fetchParcels = async () => {
    try {
      const response = await api.get("/api/parcels/agent/assigned");
      setParcels(response.data.parcels);
    } catch (error) {
      console.error("Failed to fetch parcels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (parcelId) => {
    if (!newStatus) return;

    setUpdating(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === "Failed" && failureReason) {
        payload.failureReason = failureReason;
      }

      await api.put(`/api/parcels/${parcelId}/status`, payload);
      fetchParcels();
      setSelectedParcel(null);
      setNewStatus("");
      setFailureReason("");
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      Assigned: ["PickedUp"],
      PickedUp: ["InTransit", "Failed"],
      InTransit: ["Delivered", "Failed"],
    };
    return statusFlow[currentStatus] || [];
  };
  const statusLabels = {
    PickedUp: "Picked Up",
    InTransit: "In Transit",
    Delivered: "Delivered",
    Failed: "Failed",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Agent Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Assigned Parcels</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate("/agent/scan")}>
                <Camera className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-slate-600" />
                <span className="font-semibold">{parcels.length} Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-slate-600" />
            <span className="font-semibold">{parcels.length} Active</span>
          </div>
        </div>

        {parcels.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">No parcels assigned yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {parcels.map((parcel) => (
              <Card key={parcel._id}>
                <CardContent className="p-6">
                  {console.log(parcel)}
                  <div className="space-y-4">
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

                        <div className="space-y-1 text-sm text-slate-600">
                          <p className="font-medium">
                            Customer: {parcel.customer?.name}
                          </p>
                          <p>Phone: {parcel.customer?.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Pickup Address</p>
                          <p className="text-sm text-slate-600">
                            {parcel.pickupAddress.street},{" "}
                            {parcel.pickupAddress.city},{" "}
                            {parcel.pickupAddress.state} -{" "}
                            {parcel.pickupAddress.zipCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-red-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Delivery Address
                          </p>
                          <p className="text-sm text-slate-600">
                            {parcel.deliveryAddress.street},{" "}
                            {parcel.deliveryAddress.city},{" "}
                            {parcel.deliveryAddress.state} -{" "}
                            {parcel.deliveryAddress.zipCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-600 pt-2">
                        <span>Size: {parcel.parcelSize}</span>
                        <span>Weight: {parcel.weight}kg</span>
                        <span className="font-medium">
                          {parcel.paymentMode}: ৳{parcel.amount}
                        </span>
                      </div>
                    </div>

                    {selectedParcel === parcel._id ? (
                      <div className="border-t pt-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Update Status</Label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="">Select new status</option>
                            {getNextStatuses(parcel.status).map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status] || status}
                              </option>
                            ))}
                          </select>
                        </div>

                        {newStatus === "Failed" && (
                          <div className="space-y-2">
                            <Label>Failure Reason</Label>
                            <Textarea
                              placeholder="Enter reason for failed delivery..."
                              value={failureReason}
                              onChange={(e) => setFailureReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateStatus(parcel._id)}
                            disabled={!newStatus || updating}
                            className="flex-1"
                          >
                            {updating ? "Updating..." : "Update Status"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedParcel(null);
                              setNewStatus("");
                              setFailureReason("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t pt-4">
                        <Button
                          onClick={() => setSelectedParcel(parcel._id)}
                          className="w-full"
                        >
                          Update Status
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* <Button size="sm" onClick={updateTestLocation}>
          Update Location (Test)
        </Button> */}
      </div>
    </div>
  );
}
