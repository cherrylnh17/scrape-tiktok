import { TikTokCommentRow } from '@/types/tiktok';

const HEADERS = [
  'cid',
  'induk_cid',
  'tipe',
  'text',
  'likes',
  'jumlah_balasan',
  'bahasa',
  'waktu',
];

/**
 * Menghasilkan nama file otomatis dengan format: komentar_tiktok_YYYYMMDD_HHmm.ext
 */
export function generateFilename(extension: string): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ext = extension.replace(/^\./, '');
  return `komentar_tiktok_${yyyy}${mm}${dd}_${hh}${min}.${ext}`;
}

/**
 * Memicu unduhan file blob pada browser pengguna.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Melakukan escape kolom sesuai standar RFC 4180 untuk file CSV.
 * Jika nilai memiliki tanda kutip ("), koma (,), atau baris baru (\n, \r),
 * bungkus dengan tanda kutip ganda dan ganti setiap " dengan "".
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Mengonversi baris data menjadi teks CSV dengan BOM UTF-8 (\uFEFF)
 * agar karakter emoji, aksen, dan karakter khusus terbuka sempurna di Microsoft Excel.
 */
export function generateCsvString(rows: TikTokCommentRow[]): string {
  const headerLine = HEADERS.map(escapeCsvField).join(',');
  const rowLines = rows.map((r) =>
    [
      escapeCsvField(r.cid),
      escapeCsvField(r.induk_cid),
      escapeCsvField(r.tipe),
      escapeCsvField(r.text),
      escapeCsvField(r.likes),
      escapeCsvField(r.jumlah_balasan),
      escapeCsvField(r.bahasa),
      escapeCsvField(r.waktu),
    ].join(',')
  );

  // \uFEFF adalah UTF-8 Byte Order Mark (BOM)
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Mengunduh data komentar sebagai file CSV ber-BOM.
 */
export function exportToCSV(rows: TikTokCommentRow[], customFilename?: string): void {
  const csvContent = generateCsvString(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = customFilename || generateFilename('csv');
  triggerDownload(blob, filename);
}

/**
 * Melakukan escape kolom untuk format TSV (pasting ke Google Sheets / Excel).
 */
export function escapeTsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[\t\r\n"]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Mengonversi baris data menjadi format TSV (Tab Separated Values) untuk clipboard.
 */
export function generateTsvString(rows: TikTokCommentRow[]): string {
  const headerLine = HEADERS.map(escapeTsvField).join('\t');
  const rowLines = rows.map((r) =>
    [
      escapeTsvField(r.cid),
      escapeTsvField(r.induk_cid),
      escapeTsvField(r.tipe),
      escapeTsvField(r.text),
      escapeTsvField(r.likes),
      escapeTsvField(r.jumlah_balasan),
      escapeTsvField(r.bahasa),
      escapeTsvField(r.waktu),
    ].join('\t')
  );

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Menyalin data TSV ke clipboard pengguna untuk ditempel langsung ke Google Sheets.
 */
export async function copyToClipboardTSV(rows: TikTokCommentRow[]): Promise<boolean> {
  const tsv = generateTsvString(rows);
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(tsv);
      return true;
    } catch {
      // Fallback jika API clipboard diblokir
    }
  }

  // Fallback menggunakan elemen textarea sementara
  try {
    const textarea = document.createElement('textarea');
    textarea.value = tsv;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Mengunduh data komentar sebagai file Excel (.xlsx) menggunakan SheetJS.
 * Dimuat secara dinamis (dynamic import) agar bundle awal web tetap ringan.
 * Kolom cid dan induk_cid dijamin tersimpan sebagai teks murni (tipe 's')
 * sehingga angka 64-bit TikTok tidak terpotong atau menjadi format ilmiah.
 */
export async function exportToXLSX(
  rows: TikTokCommentRow[],
  customFilename?: string
): Promise<void> {
  // Dynamic import library xlsx
  const XLSX = await import('xlsx');

  // Siapkan data matriks (array of arrays)
  const data: (string | number)[][] = [
    HEADERS,
    ...rows.map((r) => [
      r.cid,
      r.induk_cid,
      r.tipe,
      r.text,
      r.likes,
      r.jumlah_balasan,
      r.bahasa,
      r.waktu,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Pastikan kolom cid (kolom A / indeks 0) dan induk_cid (kolom B / indeks 1)
  // memiliki tipe sel 's' (string) dan format teks '@' untuk mencegah hilangnya presisi di Excel
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1');
  for (let r = 1; r <= range.e.r; ++r) {
    const cidCell = XLSX.utils.encode_cell({ c: 0, r });
    if (ws[cidCell]) {
      ws[cidCell].t = 's';
      ws[cidCell].z = '@';
    }

    const indukCidCell = XLSX.utils.encode_cell({ c: 1, r });
    if (ws[indukCidCell]) {
      ws[indukCidCell].t = 's';
      ws[indukCidCell].z = '@';
    }
  }

  // Atur lebar kolom yang nyaman dibaca
  ws['!cols'] = [
    { wch: 23 }, // cid
    { wch: 23 }, // induk_cid
    { wch: 12 }, // tipe
    { wch: 50 }, // text
    { wch: 10 }, // likes
    { wch: 16 }, // jumlah_balasan
    { wch: 10 }, // bahasa
    { wch: 21 }, // waktu
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Komentar TikTok');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const filename = customFilename || generateFilename('xlsx');
  triggerDownload(blob, filename);
}
