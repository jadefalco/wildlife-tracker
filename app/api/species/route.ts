import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const client = getSupabase();
    let query = client.from('species').select('*').order('display_name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      const normalized = search
        .toLowerCase()
        .replace(/[\s\-'.]/g, '%');
      query = query.ilike('display_name', `%${normalized}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ species: data ?? [] });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
