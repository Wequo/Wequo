"use client";

import React from "react";
import { LoadScript } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string}
      libraries={libraries}
      id="google-maps-script"
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;