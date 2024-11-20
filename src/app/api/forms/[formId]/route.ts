import supabase from '@/app/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const { formId } = params;

    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('form_id', formId)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching form data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
