import supabase from '@/app/lib/supabaseClient';

export async function getVehicles(companyId: string) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching vehicles:', error.message);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('Unexpected error fetching vehicles:', error.message);
    return null;
  }
}
