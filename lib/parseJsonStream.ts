import { TikTokApiResponse, ParseStreamResult } from '@/types/tiktok';

/**
 * Memisahkan string yang berisi satu atau beberapa objek JSON yang digabungkan berurutan.
 * Menggunakan state-machine sederhana untuk menghitung kedalaman kurung kurawal ({ }),
 * dengan memperhatikan string literal dan escape character (\) agar karakter { }
 * di dalam teks komentar tidak merusak penghitungan struktur JSON.
 */
export function splitJsonChunks(input: string): string[] {
  const text = input.trim();
  if (!text) return [];

  const chunks: string[] = [];
  let inString = false;
  let escapeNext = false;
  let braceDepth = 0;
  let startIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escapeNext) {
        // Karakter setelah backslash dilewati (escaped)
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
      // Karakter kurung { atau } di dalam string tidak mempengaruhi braceDepth
      continue;
    }

    // Di luar string
    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (braceDepth === 0) {
        startIndex = i;
      }
      braceDepth++;
    } else if (char === '}') {
      if (braceDepth > 0) {
        braceDepth--;
        if (braceDepth === 0 && startIndex !== -1) {
          chunks.push(text.slice(startIndex, i + 1));
          startIndex = -1;
        }
      }
    }
  }

  // Jika terdapat potongan yang kurung kurawalnya belum tertutup di akhir teks
  if (braceDepth > 0 && startIndex !== -1) {
    chunks.push(text.slice(startIndex));
  }

  // Jika tidak ditemukan objek sama sekali namun ada teks (misalnya array murni [ ... ] atau format lain)
  if (chunks.length === 0 && text.length > 0) {
    chunks.push(text);
  }

  return chunks;
}

/**
 * Mem-parsing sekumpulan potongan JSON stream menjadi array objek TikTokApiResponse yang valid.
 * Jika ada objek yang gagal, pesan error dicatat dengan indeks objek yang spesifik,
 * sementara objek yang valid tetap dikumpulkan dan diproses.
 */
export function parseJsonStream(rawInput: string): ParseStreamResult {
  const chunks = splitJsonChunks(rawInput);
  const validObjects: TikTokApiResponse[] = [];
  const errors: string[] = [];

  if (chunks.length === 0) {
    return {
      validObjects: [],
      errors: ['Input teks JSON kosong.'],
      totalChunks: 0,
    };
  }

  chunks.forEach((chunk, idx) => {
    const objectNumber = idx + 1;
    const trimmedChunk = chunk.trim();
    if (!trimmedChunk) return;

    try {
      const parsed = JSON.parse(trimmedChunk);

      // Jika pengguna menempelkan array objek sekaligus, misalnya [{ comments: ... }, ...]
      if (Array.isArray(parsed)) {
        let arrayFoundValid = false;
        parsed.forEach((item, subIdx) => {
          if (item && typeof item === 'object') {
            validObjects.push(item as TikTokApiResponse);
            arrayFoundValid = true;
          } else {
            errors.push(
              `Objek ke-${objectNumber} (elemen array ke-${subIdx + 1}) bukan objek JSON yang valid.`
            );
          }
        });
        if (!arrayFoundValid && parsed.length === 0) {
          errors.push(`Objek ke-${objectNumber} adalah array kosong.`);
        }
      } else if (parsed && typeof parsed === 'object') {
        validObjects.push(parsed as TikTokApiResponse);
      } else {
        errors.push(`Objek ke-${objectNumber} bukan merupakan objek JSON (berupa tipe primitif).`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Objek ke-${objectNumber} gagal diparsing: ${message}`);
    }
  });

  return {
    validObjects,
    errors,
    totalChunks: chunks.length,
  };
}
