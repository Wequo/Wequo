type DistancePriceProps = {
    pricingRules: any;
    distance: number | null;
    vehicleDetail:any;
};

  
  export function getDistancePrice({ pricingRules, distance, vehicleDetail }: DistancePriceProps) {
    console.log('getDistancePrice', pricingRules, distance, vehicleDetail);
  
    if (distance) {
      const doubleDistance = distance * 2;
  
      for (let i = 0; i < pricingRules.length; i++) {
        if (doubleDistance <= pricingRules[i].to_km) {
          console.log(`Distance ${doubleDistance} km falls within range ${pricingRules[i].from_km}-${pricingRules[i].to_km} km`);
          return {
            total: pricingRules[i].price, 
            baseCost: pricingRules[i].price,
            extraKmCost: 0, 
            toKm:pricingRules[i].to_km,
            totalKm:doubleDistance,
            maxServicesHours:pricingRules[i].max_service_hours,
          };
        }
      }
  
      const lastRule = pricingRules[pricingRules.length - 1];
      const kmCost = vehicleDetail.price_per_km;
      const extraDistance = doubleDistance - lastRule.to_km; 
      const extraKmCost = extraDistance * kmCost;
      const totalPrice = lastRule.price + extraKmCost;
  

  
      return {
        total: totalPrice,
        baseCost: lastRule.price,
        extraKmCost: extraKmCost,
        toKm:lastRule.to_km,
        totalKm:lastRule.doubleDistance,
      };
    }
  
    return {
      total: 0,
      baseCost: 0,
      extraKmCost: 0,
    };
  }
  