import type { UploadKind, UploadRef } from '@/types';
import type { UploadConstraints, UploadOptions, UploadService } from '../contracts';
import { appError, toAppError } from '../errors';
import { decode } from '../decode';
import { UploadRefSchema } from '../schemas';
import { toUploadRef } from '../mappers';
import { compressImage } from './compress';

/**
 * A transport moves bytes to storage and resolves with an UploadRef-shaped payload.
 * Multipart POST and pre-signed URL flows are both just different transports.
 */
export type UploadTransport = (
  body: Blob,
  meta: { fileName: string; mimeType: string; kind: UploadKind },
  options: UploadOptions,
) => Promise<unknown>;

const MB = 1024 * 1024;

/**
 * Limits apply to the file the user picks. Photos are shrunk before they are sent, so a 12 MB camera
 * shot is fine; the cap mostly guards PDFs, which are sent as they are.
 */
export const DEFAULT_CONSTRAINTS: Record<UploadKind, UploadConstraints> = {
  soil_card: {
    // photo, scan or PDF: JPEG/PNG/WebP, iPhone HEIC, scanner TIFF
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/tiff', 'application/pdf'],
    maxBytes: 25 * MB,
    maxDimension: 2200,
  },
  leaf: {
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 25 * MB,
    maxDimension: 1600,
  },
};

const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heic',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  pdf: 'application/pdf',
};

/** Browsers often report no type for HEIC/TIFF files, and "image/heif" for some HEIC ones. */
export function effectiveType(file: Pick<File, 'type' | 'name'>): string {
  const declared = (file.type || '').toLowerCase();
  if (declared === 'image/heif') return 'image/heic';
  if (declared && declared !== 'application/octet-stream') return declared;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? declared;
}

export function createUploadService(
  transport: UploadTransport,
  constraints: Record<UploadKind, UploadConstraints> = DEFAULT_CONSTRAINTS,
): UploadService {
  const validate = (file: File, kind: UploadKind) => {
    const c = constraints[kind];
    const type = effectiveType(file);
    if (!c.acceptedMimeTypes.includes(type)) {
      return appError('FILE_TYPE', `Unsupported type ${type || 'unknown'}`, { retryable: false });
    }
    if (file.size > c.maxBytes) {
      return appError('FILE_TOO_LARGE', `File is ${(file.size / MB).toFixed(1)} MB`, { retryable: false });
    }
    if (file.size === 0) return appError('UPLOAD_FAILED', 'File is empty', { retryable: false });
    return null;
  };

  return {
    constraints: (kind) => constraints[kind],
    validate,
    async upload(file, kind, options = {}): Promise<UploadRef> {
      const invalid = validate(file, kind);
      if (invalid) throw invalid;
      try {
        const body = await compressImage(file, constraints[kind].maxDimension);
        const mimeType = body.type || effectiveType(file);
        const raw = await transport(body, { fileName: file.name, mimeType, kind }, options);
        return decode(UploadRefSchema, raw, toUploadRef);
      } catch (error) {
        throw toAppError(error);
      }
    },
  };
}
