import { NextRequest, NextResponse } from 'next/server';
import { deletePhoto, deleteObservation } from '@/lib/supabase';

/**
 * DELETE /api/observations/{id}
 *
 * Deletes an observation and its associated photo (if any).
 * Photo deletion happens first; if it fails, the database record
 * is preserved so the admin can retry or investigate.
 *
 * Requires x-admin-password header matching process.env.ADMIN_PASSWORD.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ── Authorization: verify admin password before any destructive action ──
  const adminPassword = request.headers.get('x-admin-password');
  const correctPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || adminPassword !== correctPassword) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const photoUrl: string | null = body.photo_url ?? null;

    // Step 1: Delete the photo from storage if one exists.
    // We do this before deleting the DB record so that if storage
    // deletion fails, the observation data is not lost.
    if (photoUrl) {
      try {
        await deletePhoto(photoUrl);
      } catch (photoErr) {
        console.error('Photo deletion failed:', photoErr);
        return NextResponse.json(
          { error: 'Failed to delete the associated photo. The observation was not removed.' },
          { status: 500 }
        );
      }
    }

    // Step 2: Delete the database record.
    await deleteObservation(id);

    return NextResponse.json(
      { success: true, message: 'Observation deleted successfully.' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Delete observation error:', err);
    return NextResponse.json(
      { error: 'Failed to delete observation. Please try again.' },
      { status: 500 }
    );
  }
}
