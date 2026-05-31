import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('observations')
      .select('*')
      .order('observation_timestamp', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ observations: data ?? [] });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await getSupabase()
      .from('observations')
      .insert({
        species_category: body.species_category,
        species_name: body.species_name,
        latitude: body.latitude,
        longitude: body.longitude,
        observation_timestamp: body.observation_timestamp,
        notes: body.notes ?? null,
        photo_url: body.photo_url ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ observation: data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
