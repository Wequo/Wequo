import supabase from '@/app/lib/supabaseClient';

export async function getCompanyScheme(companyId: number) {
  try {
    const { data, error } = await supabase
      .from('color_schemes')
      .select('background_color, text_color, btn_color, btn_background')
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching extra settings:', error.message);
      return null;
    }

    return data; 
  } catch (error: any) {
    console.error('Unexpected error fetching extra settings:', error.message);
    return null;
  }
}