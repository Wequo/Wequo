import supabase from '@/app/lib/supabaseClient';

export async function storingQuoteOnDb(quotationId: string, companyId: string, formData: any, responseData: any) {
  
    const { data, error } = await supabase.from('quotations').insert([
      {
        id: quotationId,
        company_id: companyId,
        form_data: formData,
        response_data: responseData,
        created_at: new Date().toISOString(),
      },
    ]);
  
    if (error) {
      console.error('Error al guardar el presupuesto:', error);
      throw new Error('No se pudo guardar el presupuesto en la base de datos.');
    }
  
    return data;
  }