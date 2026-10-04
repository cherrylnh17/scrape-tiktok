import {
  TikTokApiResponse,
  TikTokRawComment,
  TikTokCommentRow,
  ExtractionOptions,
  ExtractionSummary,
} from '@/types/tiktok';

/**
 * Mengonversi timestamp Unix (detik atau milidetik) ke format YYYY-MM-DD HH:mm:ss dalam zona waktu lokal pengguna.
 */
export function formatUnixTimestamp(timestamp: number | string | undefined | null): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') return '';
  const num = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
  if (isNaN(num) || num <= 0) return '';

  // TikTok API mengirimkan detik Unix, tapi antisipasi jika ada format milidetik (> 1e11)
  const ms = num > 1e11 ? num : num * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

/**
 * Mengonversi satu objek TikTokRawComment menjadi baris TikTokCommentRow.
 * Memastikan data identitas pengguna diabaikan dan ID tetap berbentuk string.
 */
function createCommentRow(
  raw: TikTokRawComment,
  parentCidFallback: string,
  forceAsReply: boolean,
  options: ExtractionOptions
): TikTokCommentRow {
  // Pastikan cid selalu string agar tidak ada presisi yang hilang
  const cid = raw.cid !== undefined && raw.cid !== null ? String(raw.cid).trim() : '';

  const rawReplyId =
    raw.reply_id !== undefined && raw.reply_id !== null ? String(raw.reply_id).trim() : '';

  // Logika penentuan tipe & induk_cid:
  // Item dengan reply_id bernilai "0" atau kosong = tipe "komentar";
  // selain itu = tipe "balasan" dan induk_cid diisi dengan nilai reply_id.
  const isReply = forceAsReply || (rawReplyId !== '' && rawReplyId !== '0');
  const tipe: 'komentar' | 'balasan' = isReply ? 'balasan' : 'komentar';

  let indukCid = '';
  if (isReply) {
    if (rawReplyId && rawReplyId !== '0') {
      indukCid = rawReplyId;
    } else {
      indukCid = parentCidFallback;
    }
  }

  // Pengolahan teks komentar (emoji dan baris baru dipertahankan kecuali opsi aktif)
  let text = typeof raw.text === 'string' ? raw.text : '';
  if (options.cleanNewlines) {
    text = text.replace(/\r?\n|\r/g, ' ');
  }

  const likes =
    typeof raw.digg_count === 'number' ? raw.digg_count : Number(raw.digg_count) || 0;

  const replyTotal =
    typeof raw.reply_comment_total === 'number'
      ? raw.reply_comment_total
      : Number(raw.reply_comment_total) || 0;

  const bahasa = raw.comment_language ? String(raw.comment_language).trim() : '';
  const waktu = formatUnixTimestamp(raw.create_time);

  return {
    cid,
    induk_cid: indukCid,
    tipe,
    text,
    likes,
    jumlah_balasan: replyTotal,
    bahasa,
    waktu,
  };
}

/**
 * Mengekstrak seluruh komentar dan balasan dari daftar respons API TikTok.
 */
export function extractCommentsFromResponses(
  responses: TikTokApiResponse[],
  options: ExtractionOptions
): { rows: TikTokCommentRow[]; summary: ExtractionSummary } {
  const rawRows: TikTokCommentRow[] = [];

  for (const resp of responses) {
    if (!resp || !Array.isArray(resp.comments)) continue;

    for (const item of resp.comments) {
      if (!item) continue;

      // 1. Ekstrak komentar utama
      const mainRow = createCommentRow(item, '', false, options);
      rawRows.push(mainRow);

      // 2. Ekstrak balasan jika opsi "Sertakan balasan" aktif dan terdapat reply_comment
      if (options.includeReplies && Array.isArray(item.reply_comment)) {
        for (const replyItem of item.reply_comment) {
          if (!replyItem) continue;
          const replyRow = createCommentRow(replyItem, mainRow.cid, true, options);
          rawRows.push(replyRow);
        }
      }
    }
  }

  // 3. Penghitungan statistik dan deduplikasi berdasarkan cid
  let totalComments = 0;
  let totalReplies = 0;
  let duplicatesRemoved = 0;
  const seenCids = new Set<string>();
  const finalRows: TikTokCommentRow[] = [];

  for (const row of rawRows) {
    if (row.tipe === 'komentar') {
      totalComments++;
    } else {
      totalReplies++;
    }

    if (options.removeDuplicates) {
      if (row.cid) {
        if (seenCids.has(row.cid)) {
          duplicatesRemoved++;
          continue; // Lewati duplikat (pertahankan kemunculan pertama)
        }
        seenCids.add(row.cid);
      }
    }

    finalRows.push(row);
  }

  return {
    rows: finalRows,
    summary: {
      totalComments,
      totalReplies,
      duplicatesRemoved,
      totalFinalRows: finalRows.length,
    },
  };
}
