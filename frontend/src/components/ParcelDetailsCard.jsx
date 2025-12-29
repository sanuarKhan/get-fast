import { Label } from "@radix-ui/react-dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

function ParcelDetailsCard({ formData, onChange }) {
  return (
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
              onChange={onChange}
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
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Parcel Type</Label>
          <Input
            name="parcelType"
            placeholder="e.g., Electronics"
            value={formData.parcelType}
            onChange={onChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={onChange}
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
                onChange={onChange}
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
            onChange={onChange}
            placeholder="Special instructions"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default ParcelDetailsCard;
