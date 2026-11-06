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

export const DEFAULT_CONSTRAINTS: Record<UploadKind, UploadConstraints> = {
  soil_card: {
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxBytes: 10 * MB,
    maxDimension: 2200,
  },
  leaf: {
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 10 * MB,
    maxDimension: 1600,
  },
};

export function createUploadService(
  transport: UploadTransport,
  constraints: Record<UploadKind, UploadConstraints> = DEFAULT_CONSTRAINTS,
): UploadService {
  const validate = (file: File, kind: UploadKind) => {
    const c = constraints[kind];
    if (!c.acceptedMimeTypes.includes(file.type)) {
      return appError('FILE_TYPE', `Unsupported type ${file.type || 'unknown'}`, { retryable: false });
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
        const mimeType = body.type || file.type;
        const raw = await transport(body, { fileName: file.name, mimeType, kind }, options);
        return decode(UploadRefSchema, raw, toUploadRef);
      } catch (error) {
        throw toAppError(error);
      }
    },
  };
}
