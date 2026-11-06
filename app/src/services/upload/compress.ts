const COMPRESSIBLE = new Set(['image/jpeg', 'image/png', 'image/webp']);
/** Below this size we only resize if the image is larger than maxDimension. */
const SMALL_ENOUGH_BYTES = 1.2 * 1024 * 1024;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image'));
    };
    img.src = url;
  });
}

/**
 * Client-side compression before upload: downscale to `maxDimension` (longest edge) and
 * re-encode as JPEG. PDFs and unsupported types are returned unchanged. If the browser cannot
 * decode or encode the image, the original file is uploaded instead.
 */
export async function compressImage(file: File, maxDimension: number, quality = 0.82): Promise<Blob> {
  if (!COMPRESSIBLE.has(file.type) || typeof document === 'undefined') return file;
  try {
    const img = await loadImage(file);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest <= maxDimension && file.size <= SMALL_ENOUGH_BYTES) return file;

    const scale = Math.min(1, maxDimension / longest);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
