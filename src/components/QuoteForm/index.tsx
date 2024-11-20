"use client";

import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { fetchConfig, selectConfig } from "@/app/store/config/configSlice";
import LanguageSelector from "@/components/LanguageSelector";

import TransportationForm from "@/components/QuoteForm/Transportation"
import i18n from '@/i18n';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';


interface QuoteFormProps {
  formId: string;
  isDialog?:boolean;
  showPrices?:boolean;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ formId, isDialog=false}) => {
  const { t } = useTranslation('form'); 

  const [currentStep, setCurrentStep] = useState(1);
  const [isStepValid, setIsStepValid] = useState(false);


  const dispatch = useDispatch<any>();
  const config = useSelector(selectConfig);


  const nextStep = () => {
    if (isStepValid) setCurrentStep((prevStep) => prevStep + 1);
  };

  const prevStep = () => {
    setCurrentStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };


  useEffect(() => {
    if (formId) {
      dispatch(fetchConfig({ formId }));
    }
  }, [formId, dispatch]);
  
  useEffect(() => {
    if (formId) {
      dispatch(fetchConfig({ formId, isDialog }));
    }
  }, [formId, isDialog, dispatch]);
  

  
 

  useEffect(() => {
    i18n.changeLanguage(config.language); 
    i18n.loadNamespaces(['form']);
    i18n.services.backendConnector.backend.options.loadPath = `/locales/TransportationForm/{{lng}}/{{ns}}.json`;
    i18n.reloadResources(); 
  }, [config]);


  if (!formId) {
    return <p>Form Id invalido</p>;
  }

  if (config.sector_id === 0) {
    return <p>Cargando...</p>;
  }


  interface FormComponentProps {
    currentStep: number;
    onValidate: (isValid: boolean) => void;
  }

  const formDrive: Record<number, React.FC<FormComponentProps>> = {
    1: TransportationForm
  };

  const SelectedForm = formDrive[config.sector_id];


  if (!SelectedForm) {
    return <p>Sector no soportado</p>;
  }


  const nextButtonStyles = `py-2 px-4 rounded-lg ${
    isStepValid ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-400 text-gray-500 cursor-not-allowed"
  }`;

  const backbutton = `py-2 px-4 rounded-lg ${"bg-blue-600 hover:bg-blue-700 text-white"}`;
  const backStyles = {
      backgroundColor: config?.schemes?.btn_background || "bg-blue-600",
      color: config?.schemes?.btn_color || "text-white",
    };

  const customButtonStyle = isStepValid
    ? {
        backgroundColor: config?.schemes?.btn_background || "bg-blue-600",
        color: config?.schemes?.btn_color || "text-white",
      }
    : {};
  

  const configStep = [t('steps.step1'), t('steps.step2'), t('steps.step3'), t('steps.results')]


  return (
 
    <div className="flex justify-center flex-col items-center min-h-screen bg-gray-100"         
    style={{
      backgroundColor: config?.schemes?.background_color,
      color: config?.schemes?.text_color,
    }}>

      <div
        className="bg-white shadow-lg rounded-lg p-6 border border-gray-300 w-full max-w-lg"
      >
        <Image
          src={config?.company?.logo || ''} 
          alt={`${config?.company?.name} logo`}
          width={96} 
          height={96}
          className="mb-4 mx-auto"
        />

        {currentStep < configStep.length && (
          <h2 className="text-xl font-semibold mb-4 text-left">
            {t('steps.step')} {currentStep}/3: {configStep[currentStep-1]}
          </h2>
        )
        }
     

        <SelectedForm currentStep={currentStep} onValidate={setIsStepValid} />


        <div className="flex justify-between mt-6">
          {currentStep > 1 && currentStep < configStep.length && (
              <button
                onClick={prevStep}
                disabled={false}
                className={backbutton}
                style={backStyles}
              >
                {t('btns.back')}
              </button>
            )}
            {currentStep < configStep.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid}
                className={nextButtonStyles}
                style={customButtonStyle}
              >
                {t('btns.next')}
              </button>
            ) : currentStep === configStep.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid}
                className={nextButtonStyles}
                style={customButtonStyle}
              >
                {t('btns.finish')}
              </button>
            ) : null}
        </div>
        
      </div>
      <LanguageSelector/>

    </div>

  );
};

export default QuoteForm;
