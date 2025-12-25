import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useTranslation } from "react-i18next";

export default function BookParcel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  //   const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    pickupAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    pickupCoords: { lat: 23.8103, lng: 90.4125 }, // Default Dhaka
    deliveryCoords: { lat: 23.8103, lng: 90.4125 },
    parcelSize: "Small",
    parcelType: "Document",
    weight: "",
    paymentMode: "Prepaid",
    amount: "",
  });

  const handleChange = (e, section) => {
    const { name, value } = e.target;

    if (section) {
      setFormData({
        ...formData,
        [section]: { ...formData[section], [name]: value }, //ss:e
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/parcels/book", formData);
      navigate("/customer", {
        state: {
          message: `Parcel booked successfully! Booking ID: ${response.data.parcel.bookingId}`,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book parcel");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-bold">Book Parcel</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* Pickup Address */}
          <Card>
            <CardHeader>
              <CardTitle>Pickup Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickupStreet">Street Address</Label>
                <Input
                  id="pickupStreet"
                  name="street"
                  value={formData.pickupAddress.street}
                  onChange={(e) => handleChange(e, "pickupAddress")}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupCity">City</Label>
                  <Input
                    id="pickupCity"
                    name="city"
                    value={formData.pickupAddress.city}
                    onChange={(e) => handleChange(e, "pickupAddress")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupState">State/Division</Label>
                  <Input
                    id="pickupState"
                    name="state"
                    value={formData.pickupAddress.state}
                    onChange={(e) => handleChange(e, "pickupAddress")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupZip">Zip Code</Label>
                <Input
                  id="pickupZip"
                  name="zipCode"
                  value={formData.pickupAddress.zipCode}
                  onChange={(e) => handleChange(e, "pickupAddress")}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryStreet">Street Address</Label>
                <Input
                  id="deliveryStreet"
                  name="street"
                  value={formData.deliveryAddress.street}
                  onChange={(e) => handleChange(e, "deliveryAddress")}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryCity">City</Label>
                  <Input
                    id="deliveryCity"
                    name="city"
                    value={formData.deliveryAddress.city}
                    onChange={(e) => handleChange(e, "deliveryAddress")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryState">State/Division</Label>
                  <Input
                    id="deliveryState"
                    name="state"
                    value={formData.deliveryAddress.state}
                    onChange={(e) => handleChange(e, "deliveryAddress")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryZip">Zip Code</Label>
                <Input
                  id="deliveryZip"
                  name="zipCode"
                  value={formData.deliveryAddress.zipCode}
                  onChange={(e) => handleChange(e, "deliveryAddress")}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Parcel Details */}
          <Card>
            <CardHeader>
              <CardTitle>Parcel Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parcelSize">Parcel Size</Label>
                  <select
                    id="parcelSize"
                    name="parcelSize"
                    value={formData.parcelSize}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="Extra Large">Extra Large</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parcelType">Parcel Type</Label>
                <Input
                  id="parcelType"
                  name="parcelType"
                  placeholder="e.g., Electronics, Documents, Clothing"
                  value={formData.parcelType}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <select
                    id="paymentMode"
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="Prepaid">Prepaid</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (BDT)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/customer")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Booking..." : "Book Parcel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
