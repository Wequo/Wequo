export interface PricingRule {
    rule_id:number;
    vehicle_type_id:number;
    rule_type:string;
    from_km:number;
    to_km:number;
    price:number;
    max_service_hours:number;
  }
  
  export interface Vehicle {
    vehicle_id: number;
    company_id: number;
    vehicle_type_id: number;
    year: number;
    title:string;
    passager_limit:number;
    description:string;
    photo_urls:string[];
    video_urls:string[];
    bathroom:boolean;
    electric_outlets:boolean;
    pmr_accessory:boolean;
    mic:boolean;
    video:boolean;
  }
  
  export interface Calculation {
    calculation_id: number;
    hours_per_driver: number;
    extra_per_hour_driver: number;
    night_driver_surcharge: number;
    parking_surcharge: string;
    meals_included_by_range:boolean;
    meals_included_by_km:boolean;
    lunch_cost:number;
    dinner_cost:number;
    breakfast_cost:number;
    night_start_time:number;
    night_end_time:number;
    city_parking_price:number;
    company_id:number;
  }
  
  export interface VehicleType {
    vehicle_type_id:number;
    max_capacity:number;
    price_per_km:number,
    idle_day_price:number;
    night_service_surcharge:number;
    bathroom_surcharge:number;

  }

  export interface FormData {
    tripType: string;
    startDate: string;
    startTime: string;
    endDate?: string;
    endTime?: string;
    passengers: number;
    departureAddress: string;
    arrivalAddress: string;
    needsVehicle: boolean;
    needsVehicleDescription: string;
    distance: number | null;
    equipments: string[]; 
    email:string;
    phoneNumber?:string;
    luggage:string;
    travelPurpose:string;
    additionalNotes:string;
  }

  

  export interface TransportationState {
    formData: FormData;
    loading: boolean;
    error: string | null;
  }

  export interface CalculationRule {
    pricingRules: PricingRule;
    vehicles: Vehicle[]
  }