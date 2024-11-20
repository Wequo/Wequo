import supabase from '@/app/lib/supabaseClient';

export async function getCompany(companyId: number) {
  console.log('here', companyId)
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching extra settings:', error.message);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  } catch (error: any) {
    console.error('Unexpected error fetching extra settings:', error.message);
    return null;
  }
}