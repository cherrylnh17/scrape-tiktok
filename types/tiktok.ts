/**
 * Definisi tipe data untuk parsing respons API komentar TikTok dan hasil konversinya.
 */

export interface TikTokRawComment {
  /** ID unik komentar (selalu pertahankan sebagai string agar tidak kehilangan presisi) */
  cid?: string | number;
  /** Teks isi komentar */
  text?: string;
  /** Jumlah likes / suka */
  digg_count?: number;
  /** Total balasan yang ada pada komentar ini */
  reply_comment_total?: number;
  /** ID komentar induk jika ini adalah balasan (bernilai "0" atau kosong jika komentar utama) */
  reply_id?: string | number | null;
  /** Kode bahasa komentar (contoh: "id", "en") */
  comment_language?: string;
  /** Waktu pembuatan komentar dalam Unix timestamp detik */
  create_time?: number | string;
  /** Daftar balasan (preview replies) yang disertakan dalam objek komentar */
  reply_comment?: TikTokRawComment[] | null;
  [key: string]: unknown;
}

export interface TikTokApiResponse {
  /** Array komentar dari respons API TikTok */
  comments?: TikTokRawComment[] | null;
  cursor?: number;
  has_more?: number | boolean;
  status_code?: number;
  [key: string]: unknown;
}

export interface TikTokCommentRow {
  /** ID komentar (string 64-bit ID) */
  cid: string;
  /** ID komentar induk (kosong untuk komentar utama, terisi jika balasan) */
  induk_cid: string;
  /** Tipe entri: komentar utama atau balasan */
  tipe: 'komentar' | 'balasan';
  /** Teks komentar apa adanya (termasuk emoji & baris baru, kecuali opsi bersihkan aktif) */
  text: string;
  /** Jumlah suka (likes) */
  likes: number;
  /** Jumlah total balasan */
  jumlah_balasan: number;
  /** Kode bahasa */
  bahasa: string;
  /** Waktu lokal dalam format YYYY-MM-DD HH:mm:ss */
  waktu: string;
}

export interface ExtractionOptions {
  /** Apakah menyertakan komentar balasan (reply_comment) */
  includeReplies: boolean;
  /** Apakah menghapus duplikat berdasarkan cid (pertahankan kemunculan pertama) */
  removeDuplicates: boolean;
  /** Apakah membersihkan karakter baris baru di teks dengan spasi */
  cleanNewlines: boolean;
}

export interface ExtractionSummary {
  /** Total komentar utama yang ditemukan */
  totalComments: number;
  /** Total balasan yang ditemukan */
  totalReplies: number;
  /** Jumlah baris duplikat yang dibuang */
  duplicatesRemoved: number;
  /** Total baris akhir setelah proses filter */
  totalFinalRows: number;
}

export interface JsonChunkParseResult {
  index: number;
  success: boolean;
  data?: unknown;
  rawText: string;
  error?: string;
}

export interface ParseStreamResult {
  validObjects: TikTokApiResponse[];
  errors: string[];
  totalChunks: number;
}
