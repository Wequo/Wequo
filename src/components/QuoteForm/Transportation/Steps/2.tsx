import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from '@/app/store';
import { updateFormData, toggleEquipment } from '@/app/store/transportation/formSlice';
import { useTranslation } from 'next-i18next';


const Step2 = () => {
  const { t } = useTranslation('form'); 

  const dispatch = useDispatch();
  const formData = useSelector((state: RootState) => state.formData);
  const handleChange = (field: keyof typeof formData, value: any) => {
    dispatch(updateFormData({ [field]: value }));
  };

  const handleToggleEquipment = (equipment: string) => {
    dispatch(toggleEquipment(equipment));
  };

  console.log(formData)


  const equipmentOptions = [
    { label: t('step2.equipments.mic'), value: "mic" },
    { label: t('step2.equipments.pmr_accessory'), value: "pmr_accessory" },
    { label: t('step2.equipments.video'), value: "video" },
    { label: t('step2.equipments.electric_outlets') , value: "electric_outlets" },
    { label: t('step2.equipments.bathroom'), value: "bathroom" },
  ];


  const luggageOptions = [
    { label: t('step2.luggage.typeofluggage'), value: "" },
    { label: t('step2.luggage.none'), value: "none" },
    { label: t('step2.luggage.classic'), value: "classic" },
    { label: t('step2.luggage.large'), value: "large" },
    { label: t('step2.luggage.bulky'), value: "bulky" },
  ];

  const travelPurposeOptions = [
    { label: t('step2.travel_purpose.typeOfTravelPurpose'), value: "" },
    { label: t('step2.travel_purpose.wedding'), value: "wedding" },
    { label: t('step2.travel_purpose.bachelor_party'), value: "bachelor_party" },
    { label: t('step2.travel_purpose.sports_trip'), value: "sports_trip" },
    { label: t('step2.travel_purpose.business_trip'), value: "business_trip" },
    { label: t('step2.travel_purpose.cultural_trip'), value: "cultural_trip" },
    { label: t('step2.travel_purpose.airport_transfer'), value: "airport_transfer" },
    { label: t('step2.travel_purpose.school_group'), value: "school_group" },
    { label: t('step2.travel_purpose.seniors_group'), value: "seniors_group" },
    { label: t('step2.travel_purpose.musicians_group'), value: "musicians_group" },
  ];


  return (
<>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-600 mb-1">{t('step2.needsVehicle')}</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="needsVehicle"
                value="yes"
                checked={formData.needsVehicle}
                onChange={() => handleChange("needsVehicle", true)}
                required
              />
              <span className="ml-2">{t('step2.yes')}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="needsVehicle"
                value="no"
                checked={!formData.needsVehicle}
                onChange={() => handleChange("needsVehicle", false)}
                required
              />
              <span className="ml-2">{t('step2.no')}</span>
            </label>
          </div>
        </div>
        {formData.needsVehicle && (
          <div>
            <label className="block text-gray-600 mb-1">{t('step2.additional_details')} </label>
            <input
              type="text"
              value={formData.needsVehicleDescription || ""}
              onChange={(e) => handleChange("needsVehicleDescription", e.target.value)}
              placeholder="Especifica los detalles de uso del vehículo"
              className="w-full border border-gray-400 rounded-lg p-2 focus:border-blue-500"
            />
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-1">{t('step2.desired_equipment')}</label>
            <div className="space-y-2">
              {equipmentOptions.map((equipment) => (
                <label key={equipment.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.equipments.includes(equipment.value)}
                    onChange={() => handleToggleEquipment(equipment.value)}
                    className="mr-2"
                  />
                  <span>{equipment.label}</span>
                </label>
              ))}
            </div>
        </div>

          <div>
            <label className="block text-gray-600 mb-1">{t('step2.luggage.title')}*</label>
            <select
              value={formData.luggage || ""}
              onChange={(e) => handleChange("luggage", e.target.value)}
              className="w-full border border-gray-400 rounded-lg p-2 focus:border-blue-500"
              required
            >
              {luggageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">{t('step2.travel_purpose.title')}*</label>
            <select
              value={formData.travelPurpose || ""}
              onChange={(e) => handleChange("travelPurpose", e.target.value)}
              className="w-full border border-gray-400 rounded-lg p-2 focus:border-blue-500"
              required
            >
              {travelPurposeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">{t('step2.notes_placeholder')}</label>
            <textarea
              value={formData.additionalNotes || ""}
              onChange={(e) => handleChange("additionalNotes", e.target.value)}
              placeholder={t('step2.notes_placeholder')}
              className="w-full border border-gray-400 rounded-lg p-2 focus:border-blue-500"
            />

          </div>
        </div>

      </div>
    </>
  );
};

export default Step2;