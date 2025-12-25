import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], map.getZoom());
    }
  }, [location, map]);
  return null;
}
