export const calculateExtraHoursCost = (serviceHours: number, maxServiceHours: number, baseCost: number, extraPerHourDriver: number) => {
    if (serviceHours <= maxServiceHours) return 0;
  
    const extraHours = serviceHours - maxServiceHours;
    const extraCost = (extraHours * extraPerHourDriver / 100) * baseCost;
  
    return extraCost;
  };