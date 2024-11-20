import supabase from '@/app/lib/supabaseClient';

type ParkingCities = {
  departure:string;
  arrival:string;
}


type ParkingCitiesResponse = {
  departure:number;
  arrival:number;
}

export async function getLocationFee(parkingCities: ParkingCities, companyId: string): Promise<ParkingCitiesResponse> {
  try {
    console.log('Parking cities:', parkingCities);
    console.log('Company ID:', companyId);

    const departureCleaned = parkingCities.departure.trim();
    const arrivalCleaned = parkingCities.arrival.trim();

    console.log('Departure city value (cleaned):', departureCleaned);
    console.log('Arrival city value (cleaned):', arrivalCleaned);

    let departureFee = 0;
    let arrivalFee = 0;

    // Consultar departure
    const { data: departureData, error: departureError } = await supabase
      .from('locations')
      .select('location_id')
      .ilike('city', `%${departureCleaned}%`)
      .limit(1);

    if (departureError || !departureData || departureData.length === 0) {
      console.warn(`Departure city not found in locations table: ${departureCleaned}`);
    } else {
      const departurelocationId = departureData[0].location_id;
      console.log('Departure location ID:', departurelocationId);

      const { data: departurefeeData, error: departurefeeError } = await supabase
        .from('location_fees')
        .select('fee')
        .eq('location_id', departurelocationId)
        .eq('company_id', companyId)
        .limit(1);

      if (departurefeeError || !departurefeeData || departurefeeData.length === 0) {
        console.warn(`No fee found for departure city: ${departureCleaned}`);
      } else {
        departureFee = departurefeeData[0].fee;
      }
    }

    // Consultar arrival
    const { data: arrivalData, error: arrivalError } = await supabase
      .from('locations')
      .select('location_id')
      .ilike('city', `%${arrivalCleaned}%`)
      .limit(1);

    if (arrivalError || !arrivalData || arrivalData.length === 0) {
      console.warn(`Arrival city not found in locations table: ${arrivalCleaned}`);
    } else {
      const arrivallocationId = arrivalData[0].location_id;
      console.log('Arrival location ID:', arrivallocationId);

      const { data: arrivalfeeData, error: arrivalfeeError } = await supabase
        .from('location_fees')
        .select('fee')
        .eq('location_id', arrivallocationId)
        .eq('company_id', companyId)
        .limit(1);

      if (arrivalfeeError || !arrivalfeeData || arrivalfeeData.length === 0) {
        console.warn(`No fee found for arrival city: ${arrivalCleaned}`);
      } else {
        arrivalFee = arrivalfeeData[0].fee;
      }
    }

    return {
      departure: departureFee,
      arrival: arrivalFee,
    };
  } catch (error: any) {
    console.error('Unexpected error:', error.message);
    return { departure: 0, arrival: 0 };
  }
}


