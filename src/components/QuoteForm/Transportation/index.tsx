import React, { useEffect} from "react";
import { Step1, Step2, Step3, Results } from "./Steps";

import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc";
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


interface TransportationFormProps {
  currentStep: number;
  onValidate: (isValid: boolean) => void;
}

const TransportationForm: React.FC<TransportationFormProps> = ({ currentStep, onValidate }) => {
  const formData = useSelector((state: RootState) => state.formData);
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };



  const validateStep = () => {
    if (currentStep === 1) {
      const { tripType, startDate, startTime, passengers, departureAddress, arrivalAddress, endDate, endTime } = formData;
      const today = dayjs().utc().startOf("day");
      
      if (
        tripType &&
        startDate &&
        startTime &&
        passengers >= 8 &&
        passengers <= 60 &&
        departureAddress &&
        arrivalAddress &&
        (tripType === "oneWay" || (endDate && endTime)) &&
        dayjs(startDate).isSameOrAfter(today) && 
        (tripType === "oneWay" || !endDate || dayjs(startDate).isSameOrBefore(dayjs(endDate)))
      ) {
        return true;
      }
      return false;
    }
    if (currentStep === 2) {
      const { travelPurpose, luggage, } = formData;
      if (
        travelPurpose !== '' &&
        luggage !== '' 
      ) {
        return true;
      }
      return false;
    }
    if (currentStep === 3) {
      const { email } = formData;
      const cleanedEmail = email?.trim() || ""; 
      if (cleanedEmail && validateEmail(cleanedEmail)) {
        return true;
      }
      return false;
    }

    return true;
  };

  useEffect(() => {
    onValidate(validateStep());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, currentStep]);

  const stepTemplate: Record<number, React.FC> = {
    1: Step1,
    2: Step2,
    3: Step3,
    4: Results
  };

  const SelectedStep = stepTemplate[currentStep];

  return <SelectedStep />;
};

export default TransportationForm;
