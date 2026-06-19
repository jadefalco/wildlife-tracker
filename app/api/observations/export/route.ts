import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import Papa from 'papaparse';

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

    const rows = (data ?? []).map((obs) => ({
      id: obs.id,
      observation_type: obs.observation_type,
      species_category: obs.species_category ?? '',
      species_name: obs.species_name ?? '',
      structure_category: obs.structure_category ?? '',
      structure_name: obs.structure_name ?? '',
      latitude: obs.latitude,
      longitude: obs.longitude,
      observation_timestamp: obs.observation_timestamp,
      notes: obs.notes ?? '',
      photo_url: obs.photo_url ?? '',
      created_at: obs.created_at,
    }));

    const csv = Papa.unparse(rows, {
      columns: [
        'id',
        'observation_type',
        'species_category',
        'species_name',
        'structure_category',
        'structure_name',
        'latitude',
        'longitude',
        'observation_timestamp',
        'notes',
        'photo_url',
        'created_at',
      ],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kelowna-wildlife-observations-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
