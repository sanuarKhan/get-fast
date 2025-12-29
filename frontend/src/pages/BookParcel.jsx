import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { getCurrentPosition, geocodeAddress } from "@/lib/locationUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AddressCard from "@/components/AdressCard";
import ParcelDetailsCard from "@/components/ParcelDetailsCard";

const INITIAL_FORM_STATE = {
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
};

export default function BookParcel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState({
    pickup: false,
    delivery: false,
  });
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // Auto-geocode delivery address
  useEffect(() => {
    const { address, city, state, zipCode, coordinates } =
      formData.deliveryAddress;
    if (address && city && state && zipCode && !coordinates.lat) {
      const debounce = setTimeout(() => handleGeocodeDelivery(), 1000);
      return () => clearTimeout(debounce);
    }
  }, [
    formData.deliveryAddress.address,
    formData.deliveryAddress.city,
    formData.deliveryAddress.state,
    formData.deliveryAddress.zipCode,
  ]);

  const handleGetCurrentLocation = async (type) => {
    setGettingLocation((prev) => ({ ...prev, [type]: true }));
    try {
      const coords = await getCurrentPosition();
      setFormData((prev) => ({
        ...prev,
        [`${type}Address`]: { ...prev[`${type}Address`], coordinates: coords },
      }));
      toast.success(`${type} location set`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGettingLocation((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleGeocodeDelivery = async () => {
    setGettingLocation((prev) => ({ ...prev, delivery: true }));
    try {
      const coords = await geocodeAddress(formData.deliveryAddress);
      setFormData((prev) => ({
        ...prev,
        deliveryAddress: { ...prev.deliveryAddress, coordinates: coords },
      }));
      toast.success("Delivery coordinates found");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGettingLocation((prev) => ({ ...prev, delivery: false }));
    }
  };

  const handleChange = (e, section) => {
    const { name, value } = e.target;
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (
      !formData.pickupAddress.coordinates.lat ||
      !formData.deliveryAddress.coordinates.lat
    ) {
      toast.error("Please set location coordinates");
      return false;
    }
    if (formData.paymentMethod === "cod" && formData.codAmount <= 0) {
      toast.error("Please enter COD amount");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
        <div className="space-y-6">
          <AddressCard
            title="Pickup Address"
            type="pickup"
            address={formData.pickupAddress}
            loading={gettingLocation.pickup}
            onLocationClick={() => handleGetCurrentLocation("pickup")}
            onChange={(e) => handleChange(e, "pickupAddress")}
          />

          <AddressCard
            title="Delivery Address"
            type="delivery"
            address={formData.deliveryAddress}
            loading={gettingLocation.delivery}
            onLocationClick={handleGeocodeDelivery}
            onChange={(e) => handleChange(e, "deliveryAddress")}
          />

          <ParcelDetailsCard formData={formData} onChange={handleChange} />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/customer")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Booking..." : "Book Parcel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
