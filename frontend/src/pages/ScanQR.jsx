import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrReader } from "react-qr-scanner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ScanQR() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [parcel, setParcel] = useState(null);

  const handleScan = async (result) => {
    if (result?.text && scanning) {
      setScanning(false);

      try {
        // Search for parcel by booking ID
        const response = await api.get(`/api/parcels?search=${result.text}`);

        if (response.data.parcels?.length > 0) {
          const foundParcel = response.data.parcels[0];
          setParcel(foundParcel);
          toast.success("Parcel found!");
        } else {
          toast.error("Parcel not found");
          setScanning(true);
        }
      } catch (error) {
        console.error("Error scanning QR:", error);
        toast.error("Failed to scan QR code");
        setScanning(true);
      }
    }
  };

  const handleError = (error) => {
    console.error("QR Scanner error:", error);
    toast.error("Camera access denied or error occurred");
  };

  const confirmPickup = async () => {
    try {
      await api.put(`/api/parcels/${parcel._id}/status`, {
        status: "PickedUp",
      });
      toast.success("Parcel pickup confirmed!");
      navigate("/agent");
    } catch (error) {
      toast.error("Failed to confirm pickup");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/agent")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Scan QR Code</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {scanning ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Scan Parcel QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg overflow-hidden">
                <QrReader
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: "100%" }}
                  constraints={{
                    video: { facingMode: "environment" },
                  }}
                />
              </div>
              <p className="text-sm text-slate-600 text-center mt-4">
                Point camera at QR code to scan
              </p>
            </CardContent>
          </Card>
        ) : parcel ? (
          <Card>
            <CardHeader>
              <CardTitle>Parcel Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Booking ID</p>
                <p className="font-semibold text-lg">{parcel.bookingId}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Customer</p>
                <p className="font-semibold">{parcel.customer?.name}</p>
                <p className="text-sm">{parcel.customer?.phone}</p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Pickup Address</p>
                <p className="text-sm">
                  {parcel.pickupAddress.street}, {parcel.pickupAddress.city}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">Delivery Address</p>
                <p className="text-sm">
                  {parcel.deliveryAddress.street}, {parcel.deliveryAddress.city}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={confirmPickup} className="flex-1">
                  Confirm Pickup
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setParcel(null);
                    setScanning(true);
                  }}
                  className="flex-1"
                >
                  Scan Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
