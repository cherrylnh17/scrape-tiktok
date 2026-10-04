'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CodeBlock, { InlineCodeCopy } from '@/components/CodeBlock';
import { CONSOLE_SCRIPT } from '@/lib/consoleScript';
import {
  Monitor,
  Terminal,
  RotateCcw,
  KeyRound,
  FileCode,
  MessageCircle,
  PlayCircle,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  ShieldAlert,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    id: 'paste-disabled',
    question: 'Paste tidak berfungsi di Console Chrome?',
    answer: (
      <p>
        Chrome memiliki perlindungan keamanan bawaan (*Self-XSS protection*). Cukup ketik{' '}
        <InlineCodeCopy code="allow pasting" /> pada Console lalu tekan{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-xs">
          Enter
        </kbd>
        . Setelah itu fitur tempel (Ctrl+V) akan langsung aktif normal.
      </p>
    ),
  },
  {
    id: 'zero-comments',
    question: 'Terkumpul 0 komentar meskipun sudah scroll?',
    answer: (
      <p>
        Kemungkinan script baru dipasang <em>setelah</em> komentar terlanjur selesai dimuat ke
        halaman. Script harus mencegat permintaan jaringan (network fetch/XHR) sejak awal. Silakan{' '}
        <strong>refresh halaman video (F5)</strong>, tempel script lagi di Console, lalu baru buka
        panel komentar.
      </p>
    ),
  },
  {
    id: 'auto-scroll-replies',
    question: 'Auto-scroll tidak otomatis membuka balasan komentar?',
    answer: (
      <p>
        TikTok sering memperbarui atribut selector antarmuka web mereka. Jika tombol balasan tidak
        terklik otomatis, Anda dapat mengklik tombol <em>&quot;Lihat balasan&quot;</em> secara
        manual. Script tetap akan otomatis merekam dan menggabungkan seluruh respons balasan yang
        masuk.
      </p>
    ),
  },
  {
    id: 'captcha-freeze',
    question: 'Proses berhenti di tengah jalan atau muncul CAPTCHA?',
    answer: (
      <p>
        Jika muncul verifikasi puzzle/CAPTCHA dari TikTok, selesaikan verifikasi tersebut di layar.
        Tunggu 1-2 menit, kemudian jalankan kembali{' '}
        <InlineCodeCopy code="__tt.otoScroll()" /> di Console. Data yang sebelumnya sudah terkumpul
        tidak akan hilang selama Anda tidak memuat ulang (refresh) tab tersebut.
      </p>
    ),
  },
  {
    id: 'comment-count-diff',
    question: 'Jumlah komentar terkumpul lebih sedikit dari angka total di video?',
    answer: (
      <p>
        Hal ini sangat wajar. Angka total di video TikTok mencakup komentar yang disembunyikan oleh
        sistem anti-spam, komentar yang telah dihapus oleh pembuat video atau pengguna, serta akun
        yang di-shadowban. API TikTok hanya mengirimkan komentar yang lolos filter visibilitas
        publik.
      </p>
    ),
  },
];

export default function GuideSteps() {
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({});
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

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-10">
      {/* Top Bar Kontrol: Kembali & Tema */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs self-start"
        >
          <span>←</span>
          <span>Kembali ke Konverter</span>
        </Link>

        {mounted && (
          <div className="flex items-center self-start sm:self-auto bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
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

      {/* Hero Panduan */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Terminal className="w-3.5 h-3.5" />
            Metode Console DevTools
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Panduan Mengambil Semua Komentar TikTok
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Ikuti 9 langkah mudah di bawah ini untuk mengumpulkan ribuan komentar beserta balasannya
            langsung dari Chrome Console tanpa memerlukan extension atau akun berbayar.
          </p>
        </div>
      </section>

      {/* Stepper Langkah-Langkah (9 Langkah) */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-rose-500" />
          Langkah-Langkah Pengambilan Data:
        </h3>

        <div className="space-y-5">
          {/* Langkah 1 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Buka video di Chrome desktop
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Buka tautan video TikTok yang komentarnya ingin diambil memakai peramban{' '}
                <strong>Google Chrome di komputer/laptop (bukan HP)</strong>. Pastikan Anda sudah
                login ke akun TikTok jika diminta agar komentar dapat dimuat tanpa batas.
              </p>
            </div>
          </div>

          {/* Langkah 2 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Buka DevTools lalu tab Console
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tekan tombol{' '}
                <kbd className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs border border-slate-300 dark:border-slate-700 font-semibold">
                  F12
                </kbd>{' '}
                di keyboard Anda (atau klik kanan di sembarang tempat halaman lalu pilih{' '}
                <em>Inspect</em>). Di panel DevTools yang terbuka pada bagian atas, klik tab{' '}
                <strong className="text-rose-600 dark:text-rose-400">Console</strong> (bukan tab
                Network).
              </p>
            </div>
          </div>

          {/* Langkah 3 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Refresh halaman
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tekan tombol{' '}
                <kbd className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs border border-slate-300 dark:border-slate-700 font-semibold">
                  F5
                </kbd>{' '}
                untuk memuat ulang halaman. <strong className="text-rose-600 dark:text-rose-400">PENTING:</strong> JANGAN buka panel komentar terlebih dahulu, karena script penyadap harus dipasang di Console sebelum komentar pertama dimuat.
              </p>
            </div>
          </div>

          {/* Langkah 4 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
              4
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Izinkan paste di Console
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Klik di bagian bawah Console (terdapat tanda <code>&gt;</code> dengan kursor yang berkedip). Jika Chrome menampilkan peringatan keamanan dan memblokir penempelan kode, ketik perintah <InlineCodeCopy code="allow pasting" /> lalu tekan Enter.
              </p>
            </div>
          </div>

          {/* Langkah 5 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-rose-500/20">
              5
            </div>
            <div className="space-y-3 flex-1 w-full">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-rose-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Salin dan tempel script di bawah
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Klik tombol <strong>&quot;Salin kode&quot;</strong> pada kotak kode di bawah, lalu tempelkan (Ctrl+V) ke dalam Console DevTools dan tekan Enter:
              </p>

              {/* Komponen CodeBlock */}
              <CodeBlock code={CONSOLE_SCRIPT} title="Script Penyadap Komentar TikTok" />

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  <strong>Tanda Berhasil:</strong> Akan muncul pesan Console berwarna hijau:{' '}
                  <code className="font-mono font-semibold">
                    &quot;Siap. Buka komentar dan scroll, atau jalankan __tt.otoScroll()&quot;
                  </code>
                </span>
              </div>
            </div>
          </div>

          {/* Langkah 6 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
              6
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-slate-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Buka panel komentar
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Klik ikon komentar di samping video TikTok sampai panel daftar komentar terbuka ke
                samping atau ke bawah. Script akan langsung mulai menyadap komentar batch pertama
                yang muncul.
              </p>
            </div>
          </div>

          {/* Langkah 7 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
              7
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-slate-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Jalankan auto-scroll
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ketik <InlineCodeCopy code="__tt.otoScroll()" /> di Console lalu tekan Enter.
                Biarkan script menggulir komentar secara otomatis sampai muncul tulisan{' '}
                <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  &quot;Selesai. Jalankan __tt.unduh()&quot;
                </code>
                .
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <p>
                  💡 <strong>Tips:</strong> Selama proses auto-scroll berjalan, jangan tutup atau
                  berpindah tab. Jumlah komentar yang terkumpul akan bertambah terus di log Console.
                </p>
                <p>
                  Anda dapat mengecek progres kapan saja dengan mengetik{' '}
                  <InlineCodeCopy code="__tt.status()" /> lalu Enter.
                </p>
              </div>
            </div>
          </div>

          {/* Langkah 8 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
              8
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-500" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Unduh hasilnya
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ketik perintah <InlineCodeCopy code="__tt.unduh()" /> di Console lalu tekan Enter.
                Sebuah file bernama <code className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">komentar_tiktok.json</code> akan otomatis terunduh ke folder Downloads laptop Anda.
              </p>
            </div>
          </div>

          {/* Langkah 9 */}
          <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-emerald-600/20">
              9
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                  Salin isi JSON ke konverter
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Kembali ke halaman konverter utama. Anda kini bisa langsung{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  mengunggah file komentar_tiktok.json
                </strong>{' '}
                pada tab <em>&quot;Unggah File JSON&quot;</em> (cukup tarik & lepas atau pilih berkas),
                ATAU membuka filenya dengan Notepad lalu menempelkan teksnya di tab <em>&quot;Tempel Teks JSON&quot;</em>.
                Setelah itu, klik tombol <strong>&quot;Proses JSON Sekarang&quot;</strong> dan unduh hasilnya sebagai file CSV atau Excel (.xlsx)!
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Buka Konverter Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 1: Catatan Format Hasil */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-500" />
          Catatan Format File Hasil JSON
        </h4>
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <p>
            File yang dihasilkan oleh script <InlineCodeCopy code="__tt.unduh()" /> memiliki struktur
            standar:
          </p>
          <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto">
            <code>{`{\n  "comments": [\n    { "cid": "7329104...", "text": "...", "digg_count": 12, ... }\n  ]\n}`}</code>
          </pre>
          <p>
            Komentar utama dan seluruh balasan yang terbuka sudah digabungkan secara otomatis serta
            dibersihkan dari duplikasi CID kemunculan ganda. File ini langsung 100% kompatibel saat
            ditempel ke textarea konverter di halaman utama.
          </p>
        </div>
      </section>

      {/* Bagian 2: Pemecahan Masalah (Accordion FAQ) */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-rose-500" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Pemecahan Masalah (Troubleshooting)
          </h4>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((faq) => {
            const isOpen = openFaq[faq.id] || false;
            return (
              <div
                key={faq.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bagian 3: Peringatan & Keamanan (Kotak Kuning/Amber) */}
      <section className="p-5 sm:p-6 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Penting: Hal-Hal yang Perlu Diperhatikan</span>
        </div>
        <ul className="text-xs space-y-2 list-disc list-inside leading-relaxed text-amber-900/90 dark:text-amber-200/90">
          <li>
            <strong>Refresh tab menghilangkan script:</strong> Jika halaman di-refresh, script
            penyadap akan hilang dari memori browser dan harus ditempel ulang ke Console sebelum
            komentar dibuka.
          </li>
          <li>
            <strong>Keamanan akun:</strong> Jangan pernah menempelkan script dari sumber yang tidak
            terpercaya ke Console browser, karena Console memiliki akses penuh ke sesi akun Anda
            yang sedang login. Script yang kami sediakan di atas murni hanya mencatat respons
            komentar lokal dan <em>sama sekali tidak mengirim data ke server luar mana pun</em>.
          </li>
          <li>
            <strong>Jeda scroll aman:</strong> Nilai jeda default (1.5 detik) sudah diatur aman agar
            tidak memicu pemblokiran sementara (*rate limit*) dari server TikTok. Jangan menurunkan
            jeda scroll terlalu drastis.
          </li>
          <li>
            <strong>Etika data & Privasi:</strong> Mengambil data komentar tanpa izin dapat
            melanggar Ketentuan Layanan (*Terms of Service*) platform. Gunakanlah data ini secara
            bijak untuk kepentingan riset, analisis sentimen, atau tugas akademik, serta selalu
            anonimkan identitas pengguna sebelum mempublikasikan laporan.
          </li>
        </ul>
      </section>

      {/* Footer panduan */}
      <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 space-y-2">
        <p className="flex items-center justify-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          Semua pemrosesan dilakukan di browser, data tidak dikirim ke mana pun.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            ← Kembali ke Konverter Komentar
          </Link>
        </div>
      </footer>
    </div>
  );
}
