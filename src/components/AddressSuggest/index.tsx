// src/components/AddressSuggest.tsx
import React, { useState } from "react";
import { Autocomplete } from "@react-google-maps/api";

interface AddressSuggestProps {
  label: string;
  placeholder?: string;
  onAddressSelect: (address: string) => void;
}

const AddressSuggest: React.FC<AddressSuggestProps> = ({ label, placeholder, onAddressSelect }) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        onAddressSelect(place.formatted_address);
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-600 mb-2">{label}</label>
      <Autocomplete
        onLoad={(autocompleteInstance: any) => setAutocomplete(autocompleteInstance)}
        onPlaceChanged={handlePlaceChanged}
      >
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={placeholder || "Escribe para autocompletar"}
            className="w-full border border-gray-400 rounded-lg p-2 pl-10 focus:border-blue-500"
          />
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </span>
        </div>
      </Autocomplete>
    </div>
  );
};

export default AddressSuggest;
