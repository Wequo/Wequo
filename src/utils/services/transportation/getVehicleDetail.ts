import supabase from '@/app/lib/supabaseClient';

export async function getVehicleDetail(vehicleTypeId: string) {
  try {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('*')
      .eq('vehicle_type_id', vehicleTypeId);

    if (error) {
      console.error('Error fetching vehicle details:', error.message);
      return null;
    }

    return data ? data[0] : null;
  } catch (error: any) {
    console.error('Unexpected error fetching vehicle details:', error.message);
    return null;
  }
}