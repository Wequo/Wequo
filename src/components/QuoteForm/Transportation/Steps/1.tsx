import React, {useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from '@/app/store';
import { updateFormData } from '@/app/store/transportation/formSlice';
import AddressSuggest from "@/components/AddressSuggest";
import { useTranslation } from 'next-i18next';
import DatePicker from "react-datepicker";
import { registerLocale } from 'react-datepicker';

import "react-datepicker/dist/react-datepicker.css";
import {es} from 'date-fns/locale/es'; 
import {enUS as en} from 'date-fns/locale/en-US'; 

import utc from "dayjs/plugin/utc";
dayjs.extend(utc);


registerLocale('es', es);
registerLocale('en', en);

import dayjs from "dayjs"
interface FormErrors {
  startDate: boolean;
  startTime: boolean;
  endDate: boolean;
  endTime: boolean;
}



const Step1 = () => {
  const { t } = useTranslation('form'); 

  const dispatch = useDispatch();
  const lang = useSelector((state: RootState) => state.config.language);
  const conf = useSelector((state: RootState) => state.config);

  const formData = useSelector((state: RootState) => state.formData);

  const [formErrors, setFormErrors] = useState<FormErrors>({
    startDate: false,
    startTime: false,
    endDate: false,
    endTime: false,
  });
  
  console.log(formData)

  const handleChange = (field: keyof typeof formData, value: any) => {
    dispatch(updateFormData({ [field]: value }));
  };

  const handleAddressSelect = async (field: "departureAddress" | "arrivalAddress", address: string) => {

    handleChange(field, address);


  };

  const handleStartDateChange = (selectedDate: string) => {
    const date = dayjs(selectedDate).utc().startOf("day").toISOString(); // Solo almacena la fecha en UTC
    const today = dayjs().utc().startOf("day");

      if (dayjs(selectedDate).isBefore(today)) {
          setFormErrors((prev) => ({ ...prev, startDate: true }));
      } else {
          setFormErrors((prev) => ({ ...prev, startDate: false }));
      }
      handleChange("startDate", date);
  }
    
  const handleStartTimeChange = (selectedTime: Date) => {
    const time = dayjs(selectedTime).format("HH:mm"); // Formato de hora local
    const currentDate = dayjs();
    const currentTimeString = currentDate.format("HH:mm");
  
    if (time < currentTimeString && dayjs().isSame(formData.startDate, 'day')) {
      setFormErrors((prev) => ({ ...prev, startTime: true }));
    } else {
      setFormErrors((prev) => ({ ...prev, startTime: false }));
    }
    handleChange("startTime", time);
  };

const handleEndDateChange = (selectedDate: string) => {
  const date = dayjs(selectedDate).utc().startOf("day").toISOString();

    if (dayjs(selectedDate).isBefore(dayjs(formData.startDate))) {
        setFormErrors((prev) => ({ ...prev, endDate: true }));
    } else {
        setFormErrors((prev) => ({ ...prev, endDate: false }));
    }
    handleChange("endDate", date);
};
  
const handleEndTimeChange = (selectedTime: Date) => {
  const time = dayjs(selectedTime).format("HH:mm"); // Formato de hora local

  const startDateTime = dayjs(`${formData.startDate}T${formData.startTime}`);
  const endDateTime = dayjs(`${formData.endDate}T${time}`);

  const timeDifference = endDateTime.diff(startDateTime, "hour", true);

  if (formData.endDate === formData.startDate && timeDifference < 2) {
    setFormErrors((prev) => ({ ...prev, endTime: true }));
  } else {
    setFormErrors((prev) => ({ ...prev, endTime: false }));
  }

  handleChange("endTime", time);
};
  


 

  return (
    <>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-600 mb-1">{t('step1.travel_type')} *</label>
          <select
            value={formData.tripType}
            onChange={(e) => handleChange("tripType", e.target.value)}
            className="w-full border border-gray-400 rounded-lg p-2 focus:border-blue-500"
          >
            <option value="oneWay">{t('step1.one_way')}</option>
            <option value="roundTrip">{t('step1.round_trip')}</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-gray-600 mb-1">{t('step1.start_date')}*</label>
            <div className="input-container">
            <DatePicker
              dateFormat="dd/MM/yyyy"
              locale={lang}
              selected={formData.startDate ? dayjs(formData.startDate).toDate() : null}

              placeholderText={t('step1.arrival_date')}
              onChange={(date:any) => { 
                handleStartDateChange(date)
              }}

              
              minDate={new Date()} 
              className={`w-full border rounded-lg p-2 focus:border-blue-500 ${
                formErrors.startDate ? "border-red-500" : "border-gray-400"
              }`}
            />
            
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
            </div>
          </div>
      

          <div className="w-30">
            <label className="block text-gray-600 mb-1">{t('step1.time')}*</label>
            <div className="input-container time-container">

            
            <DatePicker
              locale={lang}
              value={formData.startTime}
              onChange={(date:any) => handleStartTimeChange(date)}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15} 
              timeFormat="HH:mm" 
              dateFormat="HH:mm" 
              className={`w-full border rounded-lg p-2 focus:border-blue-500 ${
                formErrors.startTime ? "border-red-500" : "border-gray-400"
              }`}
            />
            <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </span>
            </div>
          </div>
        </div>

        {formData.tripType === "roundTrip" && (
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-gray-600 mb-1">{t('step1.end_date')}*</label>
              <div className="input-container">
              <DatePicker
                required
                locale={lang}
                selected={formData.endDate ? dayjs(formData.endDate).toDate() : null}
                dateFormat="dd-MM-yyyy"
                placeholderText={t('step1.return_date')}
                minDate={formData.startDate ? dayjs(formData.startDate).utc(true).toDate() : new Date()} // Conversión a UTC
                onChange={(date: any) => {
                  handleEndDateChange(date);
                }}
                className={`w-full border rounded-lg p-2 focus:border-blue-500 ${
                  formErrors.endDate ? "border-red-500" : "border-gray-400"
                }`}
              />
                          <span className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
              </div>
            </div>
            <div className="w-30">
              <label className="block text-gray-600 mb-1">{t('step1.time')}*</label>
              <div className="input-container time-container" >

                  <DatePicker
                  value={formData.endTime}
                  onChange={(date:any) => handleEndTimeChange(date)}
                  showTimeSelect
                  locale={lang}
                  showTimeSelectOnly
                  timeIntervals={15} 
                  timeFormat="HH:mm" 
                  className={`w-full border rounded-lg p-2 focus:border-blue-500 ${
                    formErrors.endTime ? "border-red-500" : "border-gray-400"
                  }`}
                />

               <span className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-600 mb-1">{t('step1.passengers')}</label>
          <div className="flex-1 relative">
            <input
            required
              type="number"
              min="8"
              max="60"
              value={formData.passengers}
              onChange={(e) => handleChange("passengers", Number(e.target.value))}
              className="w-full border border-gray-400 rounded-lg p-2 pl-10 focus:border-blue-500"
            />
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" ><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
          </div>
        </div>

        <AddressSuggest
          placeholder={t('step1.autocomplete')}
          label={t('step1.departure_address')}
          onAddressSelect={(address) => handleAddressSelect("departureAddress", address)}
        />

        <AddressSuggest
          placeholder={t('step1.autocomplete')}
          label={t('step1.arrival_address')}
          onAddressSelect={(address) => handleAddressSelect("arrivalAddress", address)}
          />
      </div>

 
    </>
  );
};



export default Step1;
