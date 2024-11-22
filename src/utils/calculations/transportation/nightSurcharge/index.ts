// src/utils/calculation/calculateNightSurcharge.ts
export const calculateNightSurcharge = (serviceHours: number, hoursPerDriver: number, nightDriverSurcharge: number) => {
    return serviceHours > hoursPerDriver ? nightDriverSurcharge : 0;
    
};
  