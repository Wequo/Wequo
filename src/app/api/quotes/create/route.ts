
import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabaseClient';

export async function POST(request: Request) {
  const { client_id, company_id, vehicle_id, calculated_amount } = await request.json();

  try {
    const { data, error } = await supabase
      .from('quotations')
      .insert([{ client_id, company_id, vehicle_id, calculated_amount }]);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creando presupuesto:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
