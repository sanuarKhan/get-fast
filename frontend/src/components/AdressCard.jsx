import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MapPin } from "lucide-react";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "./ui/input";

function AddressCard({
  title,
  type,
  address,
  loading,
  onLocationClick,
  onChange,
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLocationClick}
          disabled={
            loading ||
            (type === "delivery" && (!address.address || !address.city))
          }
        >
          {loading ? (
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
            value={address.address}
            onChange={onChange}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              name="city"
              value={address.city}
              onChange={onChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>State/Division</Label>
            <Input
              name="state"
              value={address.state}
              onChange={onChange}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Zip Code</Label>
          <Input
            name="zipCode"
            value={address.zipCode}
            onChange={onChange}
            required
          />
        </div>
        {address.coordinates.lat && (
          <p className="text-xs text-green-600">
            📍 {address.coordinates.lat.toFixed(4)},{" "}
            {address.coordinates.lng.toFixed(4)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default AddressCard;
