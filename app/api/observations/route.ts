import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3;

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

async function isRateLimited(ip: string): Promise<boolean> {
  const supabase = getSupabase();
  const now = Date.now();
  const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString();

  // Check existing entry for this IP
  const { data: existing, error: selectError } = await supabase
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('ip_address', ip)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Rate limit select error:', selectError);
  }

  if (existing && existing.window_start > windowStart) {
    // Within the current window
    if (existing.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      return true;
    }
    // Increment count
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('ip_address', ip);

    if (updateError) {
      console.error('Rate limit update error:', updateError);
    }
    return false;
  }

  // No entry or window expired — reset with count = 1
  const { error: upsertError } = await supabase
    .from('rate_limits')
    .upsert(
      {
        ip_address: ip,
        request_count: 1,
        window_start: new Date(now).toISOString(),
      },
      { onConflict: 'ip_address' }
    );

  if (upsertError) {
    console.error('Rate limit upsert error:', upsertError);
  }

  // Best-effort cleanup of expired rows (older than 2 windows)
  const cutoff = new Date(now - RATE_LIMIT_WINDOW_MS * 2).toISOString();
  supabase.from('rate_limits').delete().lt('window_start', cutoff).then(({ error }) => {
    if (error) console.error('Rate limit cleanup error:', error);
  });

  return false;
}

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
    const clientIp = getClientIp(request);

    if (await isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot check — bots often fill hidden fields
    if (
      body.website &&
      typeof body.website === 'string' &&
      body.website.trim() !== ''
    ) {
      return NextResponse.json(
        { error: 'Invalid submission.' },
        { status: 400 }
      );
    }

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
