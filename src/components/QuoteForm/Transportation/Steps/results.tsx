import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import Image from 'next/image';

const Results = () => {
  const { isDialog, showPrices, form_id, schemes } = useSelector((state: RootState) => state.config);
  const formData = useSelector((state: RootState) => state.formData);
  const companyId = useSelector((state: RootState) => state.config.company?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [bestOption, setBestOption] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  const customButtonStyle = {
    backgroundColor: schemes?.btn_background || "bg-blue-600",
    color: schemes?.btn_color || "text-white",
  };

  useEffect(() => {
    setIsClient(true); 
  }, []);

  useEffect(() => {
    if (!isClient || !companyId || !formData || isLoading || bestOption) return;

    const fetchBestMatch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/transportation/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId: form_id, formData }),
        });
        const data = await response.json();
        if (data.success) {
          setBestOption(data);
        } else {
          console.error('Error fetching data:', data.error || data.errors);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestMatch();
  }, [isClient, companyId, formData, form_id, isLoading, bestOption]);

  const handleReturn = () => {
    if (isDialog) {
      window.close();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      {bestOption ? (
        <div>
          <h1 className="text-gray-600">Presupuesto {bestOption?.quotation?.id}</h1>
          <div className={`flex items-center justify-center space-x-4 border p-4 rounded-lg ${showPrices ? 'shadow-md' : ''}`}>
            {(!formData.needsVehicle || formData.additionalNotes === "" || !showPrices) && (
              <>
                <Image
                  src={bestOption?.vehicle?.photo_urls[0]}
                  alt={bestOption?.vehicle?.title || 'Vehicle Image'}
                  width={128}
                  height={128}
                  className="object-cover rounded-lg"
                />
                <div className="flex items-center">
                  <h2 className="text-gray-600 text-xl font-bold center">{bestOption?.vehicle?.title}</h2>
                  <p className="text-gray-600 center">{bestOption?.vehicle?.description}</p>
                  <h2 className="text-gray-600 text-xl font-bold center">
                    € {Number(bestOption?.quotation?.total?.toFixed(2)).toLocaleString('es-ES')} (iva incluido)
                  </h2>
                </div>
              </>
            )}
            {(formData.needsVehicle || formData.additionalNotes !== "" || !showPrices) && (
              <h3 className="text-l text-gray-600 font-bold center">
                Gracias por interés, en breve recibirás el presupuesto en tu email.
              </h3>
            )}
            {
              <button
                onClick={handleReturn}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                style={customButtonStyle}
              >
                {isDialog ? 'Cerrar' : 'Volver'}
              </button>
            }
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center space-x-4 border p-4 rounded-lg ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="125" height="125">
            <radialGradient id="a4" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
              <stop offset="0" stopColor="#9FDCFF"></stop>
              <stop offset=".3" stopColor="#9FDCFF" stopOpacity=".9"></stop>
              <stop offset=".6" stopColor="#9FDCFF" stopOpacity=".6"></stop>
              <stop offset=".8" stopColor="#9FDCFF" stopOpacity=".3"></stop>
              <stop offset="1" stopColor="#9FDCFF" stopOpacity="0"></stop>
            </radialGradient>
            <circle
              transform-origin="center"
              fill="none"
              stroke="url(#a4)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="200 1000"
              strokeDashoffset="0"
              cx="100"
              cy="100"
              r="70"
            >
              <animateTransform
                type="rotate"
                attributeName="transform"
                calcMode="spline"
                dur="2"
                values="360;0"
                keyTimes="0;1"
                keySplines="0 0 1 1"
                repeatCount="indefinite"
              ></animateTransform>
            </circle>
            <circle
              transform-origin="center"
              fill="none"
              opacity=".2"
              stroke="#9FDCFF"
              strokeWidth="7"
              strokeLinecap="round"
              cx="100"
              cy="100"
              r="70"
            ></circle>
          </svg>
        </div>
      )}
    </div>
  );
};

export default Results;
