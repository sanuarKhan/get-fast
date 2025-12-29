import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BookParcel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState({
    pickup: false,
    delivery: false,
  });

  const [formData, setFormData] = useState({
    pickupAddress: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      coordinates: { lat: null, lng: null },
    },
    deliveryAddress: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      coordinates: { lat: null, lng: null },
    },
    parcelSize: "small",
    parcelType: "",
    weight: "",
    paymentMethod: "prepaid",
    codAmount: 0,
    notes: "",
  });

  const getCurrentLocation = (type) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setGettingLocation((prev) => ({ ...prev, [type]: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          [`${type}Address`]: {
            ...prev[`${type}Address`],
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          },
        }));
        setGettingLocation((prev) => ({ ...prev, [type]: false }));
        toast.success(`${type} location set`);
      },
      (error) => {
        setGettingLocation((prev) => ({ ...prev, [type]: false }));
        let msg = "Failed to get location";
        if (error.code === 1) msg = "Location permission denied";
        else if (error.code === 2) msg = "Location unavailable";
        else if (error.code === 3) msg = "Location timeout";
        toast.error(msg);
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );
  };

  // Convert address text to coordinates using OpenStreetMap API
  const geocodeAddress = async (addressObj, type) => {
    const { address, city, state, zipCode } = addressObj;
    if (!address || !city) {
      toast.error("Please fill address and city first");
      return;
    }

    try {
      setGettingLocation((prev) => ({ ...prev, [type]: true }));

      const fullAddress = `${address}, ${city}, ${state || ""}, ${
        zipCode || ""
      }`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullAddress
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          [`${type}Address`]: {
            ...prev[`${type}Address`],
            coordinates: {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            },
          },
        }));
        toast.success(`Coordinates found for ${type} address`);
      } else {
        toast.error("Address not found. Please check details.");
      }
    } catch (error) {
      toast.error("Failed to find address location");
      console.error("Geocoding error:", error);
    } finally {
      setGettingLocation((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleChange = (e, section) => {
    const { name, value } = e.target;
    if (section) {
      setFormData({
        ...formData,
        [section]: { ...formData[section], [name]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.pickupAddress.coordinates.lat ||
      !formData.deliveryAddress.coordinates.lat
    ) {
      toast.error("Please set location coordinates");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/parcels/book", formData);
      toast.success(`Booked! Tracking: ${response.data.data.trackingNumber}`);
      navigate("/customer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book parcel");
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
          {/* Pickup Address */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pickup Address</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => getCurrentLocation("pickup")}
                disabled={gettingLocation.pickup}
              >
                {gettingLocation.pickup ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input
                  name="address"
                  value={formData.pickupAddress.address}
                  onChange={(e) => handleChange(e, "pickupAddress")}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    name="city"
                    value={formData.pickupAddress.city}
                    onChange={(e) => handleChange(e, "pickupAddress")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State/Division</Label>
                  <Input
                    name="state"
                    value={formData.pickupAddress.state}
                    onChange={(e) => handleChange(e, "pickupAddress")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input
                  name="zipCode"
                  value={formData.pickupAddress.zipCode}
                  onChange={(e) => handleChange(e, "pickupAddress")}
                  required
                />
              </div>
              {formData.pickupAddress.coordinates.lat && (
                <p className="text-xs text-green-600">
                  📍 Location:{" "}
                  {formData.pickupAddress.coordinates.lat.toFixed(4)},{" "}
                  {formData.pickupAddress.coordinates.lng.toFixed(4)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Delivery Address</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  geocodeAddress(formData.deliveryAddress, "delivery")
                }
                disabled={
                  gettingLocation.delivery ||
                  !formData.deliveryAddress.address ||
                  !formData.deliveryAddress.city
                }
              >
                {gettingLocation.delivery ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input
                  name="address"
                  value={formData.deliveryAddress.address}
                  onChange={(e) => handleChange(e, "deliveryAddress")}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    name="city"
                    value={formData.deliveryAddress.city}
                    onChange={(e) => handleChange(e, "deliveryAddress")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State/Division</Label>
                  <Input
                    name="state"
                    value={formData.deliveryAddress.state}
                    onChange={(e) => handleChange(e, "deliveryAddress")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input
                  name="zipCode"
                  value={formData.deliveryAddress.zipCode}
                  onChange={(e) => handleChange(e, "deliveryAddress")}
                  required
                />
              </div>
              {formData.deliveryAddress.coordinates.lat && (
                <p className="text-xs text-green-600">
                  📍 Location:{" "}
                  {formData.deliveryAddress.coordinates.lat.toFixed(4)},{" "}
                  {formData.deliveryAddress.coordinates.lng.toFixed(4)}
                </p>
              )}
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
                  <Label>Parcel Size</Label>
                  <select
                    name="parcelSize"
                    value={formData.parcelSize}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra-large">Extra Large</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
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
                <Label>Parcel Type</Label>
                <Input
                  name="parcelType"
                  placeholder="e.g., Electronics, Documents"
                  value={formData.parcelType}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="prepaid">Prepaid</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>
                {formData.paymentMethod === "cod" && (
                  <div className="space-y-2">
                    <Label>COD Amount (BDT)</Label>
                    <Input
                      name="codAmount"
                      type="number"
                      value={formData.codAmount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any special instructions"
                />
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
