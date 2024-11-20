export const calculateBaseCost = (
  distance: number,
  pricingRules: any[],
  vehicleDetail: any,
) => {
  let basePrice = 0;
  let finalPrice = 0;
  let excessKm = 0;
  const errors: Record<string, string> = {};

  if (pricingRules && distance != null) {
    const sortedPricingRules = pricingRules.sort((a, b) => a.to_km - b.to_km);

    const applicableRule = sortedPricingRules.find(
      rule => distance >= rule.from_km && distance <= rule.to_km
    ) || sortedPricingRules[sortedPricingRules.length - 1]; 

    if (applicableRule) {
      basePrice = applicableRule.price;
      finalPrice = basePrice;

      const isExcess = distance > applicableRule.to_km && applicableRule === sortedPricingRules[sortedPricingRules.length - 1];
      excessKm = isExcess ? distance - applicableRule.to_km : 0;

      if (excessKm > 0) {
        const extraCostPerKm = vehicleDetail.price_per_km;
        finalPrice += excessKm * extraCostPerKm;
      }

   
    } else {
      errors.pricingRulesError = 'No se encontró una regla de precios aplicable para la distancia proporcionada';
    }
  } else {
    errors.pricingRulesError = 'No se encontraron reglas de precios o la distancia es inválida';
  }

  return { basePrice, finalPrice, excessKm, errors };
};
