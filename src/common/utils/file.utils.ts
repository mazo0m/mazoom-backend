/** Map of allowed MIME types to safe extensions. */
export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};


/** Detect MIME type based on file magic bytes, falling back to multer mimetype if needed. */
export function detectMimeType(buffer: Buffer, fallbackMime?: string): string | null {
  if (buffer && buffer.length >= 3) {
    // 1. Check PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }

    // 2. Check JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // 3. Check GIF: GIF87a or GIF89a
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return 'image/gif';
    }

    // 4. Check WebP / WAV (both start with RIFF '52 49 46 46')
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      const format = buffer.toString('ascii', 8, 12);
      if (format === 'WEBP') return 'image/webp';
      if (format === 'WAVE') return 'audio/wav';
    }

    // 5. Check MP4: ftyp at offset 4
    if (
      buffer.length >= 8 &&
      buffer[4] === 0x66 &&
      buffer[5] === 0x74 &&
      buffer[6] === 0x79 &&
      buffer[7] === 0x70
    ) {
      return 'video/mp4';
    }

    // 6. Check WebM: 1A 45 DF A3
    if (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    ) {
      return 'video/webm';
    }

    // 7. Check OggS: 4F 67 67 53
    if (
      buffer[0] === 0x4f &&
      buffer[1] === 0x67 &&
      buffer[2] === 0x67 &&
      buffer[3] === 0x53
    ) {
      return 'audio/ogg';
    }

    // 8. Check MP3: ID3 or frame sync
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return 'audio/mpeg';
    }
    if (
      buffer[0] === 0xff &&
      (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2)
    ) {
      return 'audio/mpeg';
    }
  }

  if (fallbackMime) {
    if (fallbackMime === 'image/jpg') return 'image/jpeg';
    return fallbackMime;
  }

  return null;
}

export function getImageDimensions(
  buffer: Buffer,
  mime: string,
): { width: number; height: number } | null {
  if (!buffer || buffer.length < 24) return null;

  try {
    if (mime === 'image/png') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (mime === 'image/gif') {
      const width = buffer.readUInt16LE(6);
      const height = buffer.readUInt16LE(8);
      return { width, height };
    }

    if (mime === 'image/jpeg') {
      let i = 2; // skip SOI
      while (i < buffer.length - 8) {
        if (
          buffer[i] === 0xff &&
          buffer[i + 1] >= 0xc0 &&
          buffer[i + 1] <= 0xc3
        ) {
          // Found SOF marker (SOF0, SOF1, SOF2, SOF3)
          const height = buffer.readUInt16BE(i + 5);
          const width = buffer.readUInt16BE(i + 7);
          return { width, height };
        }
        // Move to next marker
        if (buffer[i] === 0xff) {
          const length = buffer.readUInt16BE(i + 2);
          i += 2 + length;
        } else {
          i++;
        }
      }
    }

    if (mime === 'image/webp') {
      const riffType = buffer.toString('ascii', 8, 12);
      if (riffType === 'WEBP') {
        const type = buffer.toString('ascii', 12, 16);
        if (type === 'VP8 ') {
          const width = buffer.readUInt16LE(26) & 0x3fff;
          const height = buffer.readUInt16LE(28) & 0x3fff;
          return { width, height };
        }
        if (type === 'VP8L') {
          const val = buffer.readUInt32LE(21);
          const width = (val & 0x3fff) + 1;
          const height = ((val >> 14) & 0x3fff) + 1;
          return { width, height };
        }
        if (type === 'VP8X') {
          const width = (buffer.readUInt32LE(24) & 0xffffff) + 1;
          const height = (buffer.readUInt32LE(27) & 0xffffff) + 1;
          return { width, height };
        }
      }
    }
  } catch (err) {
    // Ignored
  }

  return null;
}
