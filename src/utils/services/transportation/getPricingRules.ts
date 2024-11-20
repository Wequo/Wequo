import supabase from '@/app/lib/supabaseClient';

export async function getPricingRules(vehicleTypeId: string) {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('vehicle_type_id', vehicleTypeId);

    if (error) {
      console.error('Error fetching pricing rules:', error.message);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('Unexpected error fetching pricing rules:', error.message);
    return null;
  }
}