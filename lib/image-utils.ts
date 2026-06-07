// ============================================================================
// Image Utilities — Wildlife Tracker
// ============================================================================
// Client-side image compression and validation reduce Supabase storage usage
// and bandwidth costs. This is critical for scaling: uncompressed phone
// photos (3–8 MB each) would quickly exhaust a free Supabase tier. Compressing
// to ~150–400 KB lets the app handle hundreds of sightings on the free plan.
// Thumbnails (120×120) served via Supabase Image Transformations eliminate
// loading multi-megabyte originals inside map popups, keeping the app fast
// on mobile connections.
// ============================================================================

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);

/**
 * Validates a file selected by the user before any processing occurs.
 * Checks file size (≤ 5 MB) and file type (image only).
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_UPLOAD_SIZE) {
    return { valid: false, error: 'Photo must be smaller than 5 MB.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeOk = ALLOWED_IMAGE_TYPES.has(file.type);
  const extOk = ALLOWED_EXTENSIONS.has(ext);

  if (!typeOk && !extOk) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: JPG, PNG, WEBP, HEIC.',
    };
  }

  return { valid: true };
}

/**
 * Compresses and resizes an image on the client using the Canvas API.
 *
 * - Preserves aspect ratio
 * - Scales so the largest dimension is 1200 px
 * - Outputs JPEG at quality 0.8
 * - Typical result: 3–8 MB phone photo → 150–400 KB
 */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDimension = 1200;
      let { width, height } = img;

      // Scale down preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // White background for transparent PNGs / WEBPs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'));
            return;
          }
          const compressed = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          resolve(compressed);
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}

/**
 * Returns a thumbnail URL for a Supabase Storage public URL.
 *
 * Supabase Image Transformations append query params to the public URL.
 * If the URL does not look like a Supabase storage URL, the original
 * is returned unchanged so existing photos never break.
 */
export function getThumbnailUrl(
  photoUrl: string,
  width = 120,
  height = 120
): string {
  if (!photoUrl || typeof photoUrl !== 'string') return photoUrl;

  // Detect Supabase storage public URLs:
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const isSupabaseUrl =
    photoUrl.includes('.supabase.co/storage/v1/object/public/');

  if (!isSupabaseUrl) {
    return photoUrl;
  }

  try {
    const url = new URL(photoUrl);
    url.searchParams.set('width', String(width));
    url.searchParams.set('height', String(height));
    // 'cover' crops to fill the box; good for square thumbnails
    url.searchParams.set('resize', 'cover');
    return url.toString();
  } catch {
    // If URL parsing fails for any reason, return original safely
    return photoUrl;
  }
}
