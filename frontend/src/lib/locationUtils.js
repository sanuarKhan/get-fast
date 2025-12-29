export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = "Failed to get location";
        switch (error.code) {
          case 1:
            message = "Location permission denied";
            break;
          case 2:
            message = "Location unavailable";
            break;
          case 3:
            message = "Location timeout";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  });
};

export const geocodeAddress = async (addressObj) => {
  const { address, city, state, zipCode } = addressObj;

  if (!address || !city) {
    throw new Error("Address and city are required");
  }

  const fullAddress = `${address}, ${city}, ${state || ""}, ${zipCode || ""}`;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      fullAddress
    )}&limit=1`,
    {
      headers: {
        "User-Agent": "ParcelDeliveryApp/1.0", // Required by Nominatim
      },
    }
  );

  if (!response.ok) {
    throw new Error("Geocoding service unavailable");
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error("Address not found. Please check details.");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
};
