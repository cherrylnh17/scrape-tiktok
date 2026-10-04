'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  TikTokApiResponse,
  TikTokCommentRow,
  ExtractionOptions,
  ExtractionSummary,
} from '@/types/tiktok';
import { parseJsonStream } from '@/lib/parseJsonStream';
import { extractCommentsFromResponses } from '@/lib/extractComments';
import { exportToCSV, exportToXLSX, copyToClipboardTSV } from '@/lib/exporters';
import PreviewTable from '@/components/PreviewTable';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Trash2,
  Play,
  PlusCircle,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Layers,
  Moon,
  Sun,
  Laptop,
  HelpCircle,
  Loader2,
  FileText,
  Filter,
  BookOpen,
  UploadCloud,
  FileJson,
  X,
  FolderUp,
} from 'lucide-react';

// Contoh data JSON realistis TikTok API (2 batch respon tersambung)
const SAMPLE_JSON = `{
  "status_code": 0,
  "comments": [
    {
      "cid": "7329104829104829182",
      "text": "Kontennya sangat menginspirasi kak! 🔥\\nBoleh share tutorial lengkapnya?",
      "digg_count": 1420,
      "reply_comment_total": 2,
      "reply_id": "0",
      "comment_language": "id",
      "create_time": 1706680800,
      "reply_comment": [
        {
          "cid": "7329105938201948271",
          "text": "Siap kak, nanti di video berikutnya ya! 🙏",
          "digg_count": 89,
          "reply_comment_total": 0,
          "reply_id": "7329104829104829182",
          "comment_language": "id",
          "create_time": 1706681400
        },
        {
          "cid": "7329106049281746283",
          "text": "Ditunggu banget kak pembahasannya! 👍",
          "digg_count": 15,
          "reply_comment_total": 0,
          "reply_id": "7329104829104829182",
          "comment_language": "id",
          "create_time": 1706682000
        }
      ]
    },
    {
      "cid": "7329107129384756294",
      "text": "Lucu banget ekspresinya wkwk {laugh} 😂",
      "digg_count": 435,
      "reply_comment_total": 0,
      "reply_id": "0",
      "comment_language": "id",
      "create_time": 1706683200
    }
  ],
  "cursor": 20,
  "has_more": 1
}
{
  "status_code": 0,
  "comments": [
    {
      "cid": "7329108239485764839",
      "text": "Info sound dan backsound-nya min? Keren banget aransemen lagunya.",
      "digg_count": 78,
      "reply_comment_total": 0,
      "reply_id": "0",
      "comment_language": "id",
      "create_time": 1706684100
    },
    {
      "cid": "7329104829104829182",
      "text": "Kontennya sangat menginspirasi kak! 🔥\\nBoleh share tutorial lengkapnya?",
      "digg_count": 1420,
      "reply_comment_total": 2,
      "reply_id": "0",
      "comment_language": "id",
      "create_time": 1706680800
    }
  ],
  "cursor": 40,
  "has_more": 0
}`;

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  content: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Converter() {
  const [, startTransition] = useTransition();

  // Mode Input: 'upload' (Unggah File) atau 'paste' (Tempel Teks)
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');

  // State upload file
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State input teks manual & antrean batch
  const [rawInput, setRawInput] = useState('');
  const [batches, setBatches] = useState<string[]>([]);

  // Opsi ekstraksi
  const [options, setOptions] = useState<ExtractionOptions>({
    includeReplies: true,
    removeDuplicates: true,
    cleanNewlines: false,
  });

  // State hasil ekstraksi
  const [processedRows, setProcessedRows] = useState<TikTokCommentRow[]>([]);
  const [summary, setSummary] = useState<ExtractionSummary | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Status loading & feedback
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [copiedClipboard, setCopiedClipboard] = useState(false);

  // Dark mode state (client-only hydration safe)
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('tiktok_converter_theme') as
      | 'system'
      | 'light'
      | 'dark'
      | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tiktok_converter_theme', theme);
  }, [theme, mounted]);

  // Membaca file-file JSON yang diunggah secara lokal di browser
  const processFiles = async (files: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
        setInfoMessage(`Peringatan: Berkas "${file.name}" dilewati karena bukan berkas .json`);
        continue;
      }

      try {
        const text = await file.text();
        newFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          content: text,
        });
      } catch (err) {
        setParseErrors((prev) => [
          ...prev,
          `Gagal membaca file "${file.name}": ${err instanceof Error ? err.message : String(err)}`,
        ]);
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setInfoMessage(
        `Berhasil memuat ${newFiles.length} file JSON! Total ${uploadedFiles.length + newFiles.length} file siap diproses.`
      );
      setTimeout(() => setInfoMessage(null), 4000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Tambahkan JSON teks saat ini ke daftar antrean batch
  const handleAddBatch = () => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      setInfoMessage('Tempelkan teks JSON terlebih dahulu sebelum menambahkan ke daftar.');
      return;
    }
    setBatches((prev) => [...prev, trimmed]);
    setRawInput('');
    setInfoMessage(
      `Batch ke-${batches.length + 1} berhasil ditambahkan ke daftar! Total ${batches.length + 1} batch tersimpan.`
    );
    setTimeout(() => setInfoMessage(null), 3500);
  };

  // Bersihkan semua data (file upload, textarea, batch, dan tabel hasil)
  const handleClearAll = () => {
    setRawInput('');
    setBatches([]);
    setUploadedFiles([]);
    setProcessedRows([]);
    setSummary(null);
    setParseErrors([]);
    setInfoMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Muat contoh data demo ke textarea
  const handleLoadSample = () => {
    setInputTab('paste');
    setRawInput(SAMPLE_JSON);
    setInfoMessage(
      'Contoh data JSON berhasil dimuat ke tab "Tempel Teks"! Berisi 2 objek respons berturut-turut.'
    );
    setTimeout(() => setInfoMessage(null), 4000);
  };

  // Proses parsing dan ekstraksi komentar dari file upload, batch, maupun textarea
  const handleProcess = () => {
    const currentInput = rawInput.trim();
    const allChunksToProcess: string[] = [
      ...uploadedFiles.map((f) => f.content),
      ...batches,
    ];
    if (currentInput) {
      allChunksToProcess.push(currentInput);
    }

    if (allChunksToProcess.length === 0) {
      setParseErrors([
        'Silakan unggah file JSON atau tempelkan teks JSON sebelum memproses.',
      ]);
      return;
    }

    setIsProcessing(true);
    setProgressStatus('Menganalisis dan memisahkan aliran JSON...');
    setParseErrors([]);

    // Gunakan setTimeout bertahap agar UI dapat merender spinner dan tetap responsif
    setTimeout(() => {
      startTransition(async () => {
        try {
          const combinedRaw = allChunksToProcess.join('\n');
          const parseResult = parseJsonStream(combinedRaw);

          if (parseResult.validObjects.length === 0) {
            setParseErrors(
              parseResult.errors.length > 0
                ? parseResult.errors
                : ['Tidak ditemukan objek JSON valid yang dapat diekstraksi.']
            );
            setIsProcessing(false);
            return;
          }

          setProgressStatus(
            `Mengekstrak komentar dari ${parseResult.validObjects.length} objek JSON...`
          );

          // Berikan jeda sejenak untuk pembaruan tampilan
          await new Promise((resolve) => setTimeout(resolve, 30));

          const { rows, summary: extSummary } = extractCommentsFromResponses(
            parseResult.validObjects,
            options
          );

          setProcessedRows(rows);
          setSummary(extSummary);

          // Simpan pesan error parsing (jika ada objek yang gagal)
          if (parseResult.errors.length > 0) {
            setParseErrors(parseResult.errors);
          } else {
            setParseErrors([]);
          }

          if (rows.length === 0) {
            setInfoMessage(
              'Objek JSON valid, namun array "comments" kosong atau tidak ditemukan.'
            );
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setParseErrors([`Terjadi kesalahan sistem saat pemrosesan: ${msg}`]);
        } finally {
          setIsProcessing(false);
          setProgressStatus('');
        }
      });
    }, 50);
  };

  // Handler ekspor CSV
  const handleDownloadCsv = () => {
    if (processedRows.length === 0) return;
    exportToCSV(processedRows);
  };

  // Handler ekspor XLSX dengan dynamic import
  const handleDownloadXlsx = async () => {
    if (processedRows.length === 0) return;
    setIsExportingXlsx(true);
    try {
      await exportToXLSX(processedRows);
    } catch (err) {
      alert(`Gagal membuat file Excel: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExportingXlsx(false);
    }
  };

  // Handler salin ke clipboard TSV (untuk Google Sheets)
  const handleCopyTsv = async () => {
    if (processedRows.length === 0) return;
    const ok = await copyToClipboardTSV(processedRows);
    if (ok) {
      setCopiedClipboard(true);
      setTimeout(() => setCopiedClipboard(false), 2500);
    } else {
      alert('Gagal menyalin ke clipboard. Silakan gunakan tombol unduh CSV/Excel.');
    }
  };

  const totalUploadedSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Bar: Judul & Tema */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-500/20 text-white font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                TikTok Comments to CSV & Excel
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Konverter Respons JSON API TikTok ke Spreadsheet — Cepat, Presisi & 100% di Browser
              </p>
            </div>
          </div>
        </div>

        {/* Navigation & Theme Selector */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href="/panduan"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 shadow-xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-rose-500" />
            <span>Panduan Ambil Data</span>
          </Link>

          {/* Theme Selector */}
          {mounted && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Mode Terang"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-rose-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Mode Gelap"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Ikuti Sistem"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Bagian Input: Upload File & Tempel Teks */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
        {/* Tab Switcher & Tombol Aksi Bersihkan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setInputTab('upload')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah File JSON</span>
              {uploadedFiles.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                  {uploadedFiles.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setInputTab('paste')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                inputTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tempel Teks JSON</span>
              {rawInput.trim().length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {inputTab === 'paste' && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/60 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                Coba contoh
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bersihkan semua
            </button>
          </div>
        </div>

        {/* Tab 1: Unggah File JSON */}
        {inputTab === 'upload' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".json,application/json"
              className="hidden"
            />

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 sm:p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 scale-[1.005]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 hover:border-rose-400 dark:hover:border-rose-600 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Tarik & lepas file <code className="text-rose-600 dark:text-rose-400 font-mono font-bold">.json</code> ke sini, atau klik untuk memilih
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mendukung satu atau banyak file sekaligus (contoh: <code className="font-mono text-[11px]">komentar_tiktok.json</code> dari Console DevTools).
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs">
                <FolderUp className="w-3.5 h-3.5 text-rose-500" />
                <span>Pilih Berkas dari Komputer</span>
              </div>
            </div>

            {/* Daftar Berkas yang Terunggah */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1 font-medium">
                  <span>
                    Berkas Terpilih ({uploadedFiles.length} file • {formatFileSize(totalUploadedSize)}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadedFiles([])}
                    className="text-rose-600 dark:text-rose-400 hover:underline text-[11px]"
                  >
                    Hapus semua file
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 scrollbar-thin">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <FileJson className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Hapus file ini"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tempel Teks JSON */}
        {inputTab === 'paste' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <label htmlFor="json-textarea" className="font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                Tempel teks JSON di bawah (bisa beberapa objek bersambung):
              </label>
              <span className="font-mono text-[11px]">
                {rawInput.length.toLocaleString()} karakter
              </span>
            </div>
            <textarea
              id="json-textarea"
              rows={9}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={`Tempel respons JSON TikTok di sini...\nContoh:\n{\n  "comments": [\n    {\n      "cid": "7329104829104829182",\n      "text": "Keren banget!",\n      "digg_count": 12,\n      "create_time": 1706680800\n    }\n  ]\n}`}
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-y"
            />
          </div>
        )}

        {/* Status Indikator Batch Tambahan */}
        {batches.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Terdapat <strong>{batches.length} batch JSON</strong> tersimpan di antrean daftar.
                Semua batch akan digabung saat tombol &quot;Proses&quot; ditekan.
              </span>
            </div>
            <button
              onClick={() => setBatches([])}
              className="text-[11px] underline hover:text-amber-950 dark:hover:text-amber-100 shrink-0 ml-2"
            >
              Kosongkan antrean
            </button>
          </div>
        )}

        {/* Notifikasi Informasi Singkat */}
        {infoMessage && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Pesan Kesalahan / Warning Parser */}
        {parseErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                {parseErrors.length === 1 && !processedRows.length
                  ? 'Kesalahan Format JSON:'
                  : `Terdapat ${parseErrors.length} peringatan saat parsing:`}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-rose-300 pl-1">
              {parseErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
            {processedRows.length > 0 && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                Catatan: Objek JSON lain yang valid tetap berhasil diekstraksi ke tabel di bawah.
              </p>
            )}
          </div>
        )}

        {/* Opsi Ekstraksi (Checkbox) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Opsi Ekstraksi:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opsi 1 */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={options.includeReplies}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, includeReplies: e.target.checked }))
                }
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  Sertakan balasan
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ekstrak array reply_comment sebagai baris terpisah
                </p>
              </div>
            </label>

            {/* Opsi 2 */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={options.removeDuplicates}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, removeDuplicates: e.target.checked }))
                }
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  Hapus duplikat
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Saring berdasarkan CID unik (kemunculan pertama)
                </p>
              </div>
            </label>

            {/* Opsi 3 */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={options.cleanNewlines}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, cleanNewlines: e.target.checked }))
                }
                className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  Bersihkan baris baru di teks
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ganti enter (\n) dengan satu spasi
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Tombol Aksi Utama */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {inputTab === 'upload' ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors disabled:opacity-50"
            >
              <FolderUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pilih File Lain ({uploadedFiles.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAddBatch}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tambahkan ke daftar ({batches.length})
            </button>
          )}

          {/* Tombol Proses */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={
              isProcessing ||
              (uploadedFiles.length === 0 && !rawInput.trim() && batches.length === 0)
            }
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-semibold shadow-md shadow-rose-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progressStatus || 'Sedang memproses...'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Proses JSON Sekarang
              </>
            )}
          </button>
        </div>
      </section>

      {/* Bagian Ringkasan & Tombol Unduh */}
      {summary && (
        <section className="space-y-6">
          {/* Kartu Ringkasan Metrik */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Metrik 1: Komentar Utama */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Komentar
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.totalComments.toLocaleString()}
              </p>
              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                Komentar utama
              </span>
            </div>

            {/* Metrik 2: Balasan */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Balasan
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary.totalReplies.toLocaleString()}
              </p>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                Preview balasan
              </span>
            </div>

            {/* Metrik 3: Duplikat Dibuang */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Duplikat Dibuang
              </span>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {summary.duplicatesRemoved.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                CID ganda tersaring
              </span>
            </div>

            {/* Metrik 4: Total Baris Akhir */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-500/5 to-transparent shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Baris Akhir
              </span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.totalFinalRows.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Siap diekspor
              </span>
            </div>
          </div>

          {/* Tombol Unduh & Ekspor */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left w-full md:w-auto">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Ekspor Hasil Konversi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih format yang sesuai dengan kebutuhan spreadsheet Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Unduh CSV */}
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={processedRows.length === 0}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh CSV (BOM UTF-8)
              </button>

              {/* Unduh Excel (.xlsx) */}
              <button
                type="button"
                onClick={handleDownloadXlsx}
                disabled={processedRows.length === 0 || isExportingXlsx}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isExportingXlsx ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                Unduh Excel (.xlsx)
              </button>

              {/* Salin ke Clipboard TSV */}
              <button
                type="button"
                onClick={handleCopyTsv}
                disabled={processedRows.length === 0}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors"
              >
                {copiedClipboard ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Salin ke clipboard (TSV)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pratinjau Tabel */}
          <PreviewTable rows={processedRows} totalRows={summary.totalFinalRows} />
        </section>
      )}

      {/* Petunjuk Penggunaan & Tips */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 p-5 space-y-3">
        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-rose-500" />
          Tips & Panduan Mengambil JSON Komentar TikTok:
        </h4>
        <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
          <li>
            Buka video TikTok di browser desktop, lalu buka <strong>DevTools (F12)</strong> dan pilih
            tab <strong>Network</strong> atau <strong>Console</strong>.
          </li>
          <li>
            Ketik <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">comment/list</code> pada filter pencarian Network, atau gunakan script otomatis di Console.
          </li>
          <li>
            Gulir bagian komentar video untuk memuat komentar baru, lalu unduh atau salin seluruh teks JSON.
          </li>
          <li>
            Anda dapat langsung <strong>menyeret & melepaskan file (.json)</strong> ke area upload, atau menempelkan banyak respons sekaligus pada tab &quot;Tempel Teks JSON&quot;.
          </li>
          <li>
            ID komentar (<code className="font-mono text-[11px]">cid</code>) dijamin tersimpan
            sebagai teks murni untuk menghindari pembulatan angka besar di Excel / Sheets.
          </li>
        </ol>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ingin mengambil ribuan komentar dan balasan otomatis tanpa perlu scroll manual?
          </p>
          <Link
            href="/panduan"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors shrink-0"
          >
            <span>Buka Panduan Script Console Chrome</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
          <span>🔒</span> Semua pemrosesan dilakukan di browser, data tidak dikirim ke mana pun.
        </p>
        <p className="text-[11px]">
          TikTok Comment to CSV/Excel Converter • Dibuat dengan Next.js App Router, TypeScript & Tailwind CSS.
        </p>
      </footer>
    </div>
  );
}
