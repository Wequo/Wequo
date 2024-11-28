export const findBestMatch = (vehicles: any[], formData: any) => {
    const conditions = {
      capacity: (vehicle: any) => vehicle.passager_limit >= formData.passengers,
      equipment: (vehicle: any) => formData.equipments.every((equipment: string) => vehicle[equipment]),
    };
  
    const applyConditions = (vehicle: any) => {
      return Object.values(conditions).every(condition => condition(vehicle));
    };
  
    const filteredVehicles = vehicles.filter(applyConditions);
    const fallbackVehicles = vehicles.filter(conditions.capacity);

    const vehicleList = filteredVehicles.length === 0 ? fallbackVehicles : filteredVehicles;
  
    return vehicleList.sort((a, b) => a.passager_limit - b.passager_limit)[0] || null;
  };