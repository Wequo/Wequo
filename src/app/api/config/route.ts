import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ success: false, error: 'companyId es requerido' }, { status: 400 });
  }


  let companyData:any = null;
  let schemes:any = null;
  const errors: Record<string, string> = {};


  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('company_id', companyId)
      .single();
    companyData = data;
    if (error) errors.companyError = error.message;
  } catch (err: any) {
    errors.companyError = err.message;
  }


  try {
    const { data, error } = await supabase
      .from('color_schemes')
      .select('background_color, text_color, btn_color, btn_background')
      .eq('company_id', companyId)
      .single();
    schemes = data;
    if (error) errors.companyError = error.message;
  } catch (err: any) {
    errors.companyError = err.message;
  }



  // Construir respuesta final con los datos disponibles y los errores capturados
  return NextResponse.json({
    success: true,
    schemes: schemes,
    company: companyData
      ? {
          id: companyData.company_id,
          name: companyData.name,
          logo: companyData.logo,
         
        }
      : null,
    errors: Object.keys(errors).length > 0 ? errors : null, // Incluir errores solo si existen
  });
}
