import supabase from '@/app/lib/supabaseClient';

export async function getFormData(formId: number) {
  console.log('here', formId)
  try {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('form_id', formId);

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