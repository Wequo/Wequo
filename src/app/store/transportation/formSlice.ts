// src/app/store/transportation/formDataSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {FormData} from "./types"

const initialState: FormData = {
  tripType: "roundTrip",
  startDate: "",
  startTime: "",
  passengers: 20,
  departureAddress: "",
  arrivalAddress: "",
  needsVehicle: false,
  needsVehicleDescription: "",
  distance: null,
  equipments: [], 
  email: "",
  phoneNumber:"",
  luggage:"",
  travelPurpose:"",
  additionalNotes:""
};

const formSlice = createSlice({
  name: "formData",
  initialState,
  reducers: {
    updateFormData(state:FormData, action: PayloadAction<Partial<FormData>>) {
      return { ...state, ...action.payload };
    },
    toggleEquipment(state:FormData, action: PayloadAction<string>) {
      const equipment = action.payload;
      if (state.equipments.includes(equipment)) {
        state.equipments = state.equipments.filter((item) => item !== equipment);
      } else {
        state.equipments.push(equipment);
      }
    },
    setDistance: (state:FormData, action: PayloadAction<number | null>) => {
      state.distance = action.payload;
    },
  },
});

export const { updateFormData, toggleEquipment, setDistance } = formSlice.actions;
export default formSlice.reducer;

