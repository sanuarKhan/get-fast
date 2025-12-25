import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export const Polyline = (props) => {
  const map = useMap(); // Access the map instance
  const polylineRef = useRef(null);

  useEffect(() => {
    // Wait for the map instance from the APIProvider
    if (!map) return;

    // Initialize the Polyline using the global window.google object
    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline({
        map: map,
      });
    }

    const polyline = polylineRef.current;

    // Update the polyline properties without triggering a React re-render
    polyline.setOptions({
      path: props.path,
      strokeColor: props.strokeColor || "#FF000",
      strokeWeight: props.strokeWeight || 2,
      strokeOpacity: props.strokeOpacity || 1.0,
      ...props,
    });

    // Cleanup: Remove from map when component unmounts
    return () => {
      polyline.setMap(null);
    };
  }, [map, props]);

  return null;
};
