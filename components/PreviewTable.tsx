'use client';

import React, { useState, useMemo } from 'react';
import { TikTokCommentRow } from '@/types/tiktok';
import {
  MessageSquare,
  CornerDownRight,
  Heart,
  Calendar,
  Search,
  Filter,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PreviewTableProps {
  rows: TikTokCommentRow[];
  totalRows: number;
}

export default function PreviewTable({ rows, totalRows }: PreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'semua' | 'komentar' | 'balasan'>('semua');
  const [copiedCid, setCopiedCid] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Batasi pratinjau maksimal 50 baris pertama
  const previewSlice = useMemo(() => rows.slice(0, 50), [rows]);

  // Filter pratinjau berdasarkan kata kunci pencarian dan tipe
  const filteredRows = useMemo(() => {
    return previewSlice.filter((row) => {
      const matchType = filterType === 'semua' || row.tipe === filterType;
      if (!matchType) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        row.text.toLowerCase().includes(q) ||
        row.cid.toLowerCase().includes(q) ||
        row.induk_cid.toLowerCase().includes(q) ||
        row.bahasa.toLowerCase().includes(q)
      );
    });
  }, [previewSlice, searchTerm, filterType]);

  const toggleExpand = (cid: string) => {
    setExpandedRows((prev) => ({ ...prev, [cid]: !prev[cid] }));
  };

  const copyToClipboard = async (text: string, cid: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCid(cid);
      setTimeout(() => setCopiedCid(null), 2000);
    } catch {
      // Ignore
    }
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
      {/* Header Tabel */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Pratinjau Data Komentar
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {previewSlice.length} dari {totalRows} baris
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Menampilkan maksimal 50 baris pertama untuk performa cepat di browser.
          </p>
        </div>

        {/* Pencarian & Filter Cepat */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari teks, CID, atau bahasa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setFilterType('semua')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                filterType === 'semua'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semua ({previewSlice.length})
            </button>
            <button
              onClick={() => setFilterType('komentar')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                filterType === 'komentar'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              Komentar
            </button>
            <button
              onClick={() => setFilterType('balasan')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                filterType === 'balasan'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CornerDownRight className="w-3 h-3" />
              Balasan
            </button>
          </div>
        </div>
      </div>

      {/* Kontainer Tabel dengan Horizontal Scroll */}
      <div className="overflow-x-auto max-h-[520px] scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs text-slate-600 dark:text-slate-300 font-semibold z-10 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3 px-3.5 w-12 text-center">#</th>
              <th className="py-3 px-3 w-28">Tipe</th>
              <th className="py-3 px-4 min-w-[280px]">Teks Komentar</th>
              <th className="py-3 px-3 w-44">CID (String)</th>
              <th className="py-3 px-3 w-44">Induk CID</th>
              <th className="py-3 px-3 w-20 text-right">Suka</th>
              <th className="py-3 px-3 w-20 text-center">Balasan</th>
              <th className="py-3 px-3 w-16 text-center">Bahasa</th>
              <th className="py-3 px-4 w-40 whitespace-nowrap">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada baris yang cocok dengan filter pencarian.</p>
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => {
                const isExpanded = expandedRows[row.cid] || false;
                const isLongText = row.text.length > 90 || row.text.includes('\n');
                const isReply = row.tipe === 'balasan';

                return (
                  <tr
                    key={`${row.cid}-${idx}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Tipe Badge */}
                    <td className="py-3 px-3">
                      {isReply ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                          <CornerDownRight className="w-3 h-3 text-purple-500" />
                          Balasan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50">
                          <MessageSquare className="w-3 h-3 text-sky-500" />
                          Komentar
                        </span>
                      )}
                    </td>

                    {/* Teks Komentar */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                        {isExpanded || !isLongText ? (
                          <div className="whitespace-pre-wrap break-words">{row.text}</div>
                        ) : (
                          <div className="line-clamp-2 break-words">{row.text}</div>
                        )}
                        {isLongText && (
                          <button
                            onClick={() => toggleExpand(row.cid)}
                            className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" /> Tutup
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" /> Lihat selengkapnya
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* CID (String 64-bit) */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[125px]" title={row.cid}>
                          {row.cid}
                        </span>
                        <button
                          onClick={() => copyToClipboard(row.cid, row.cid)}
                          title="Salin CID"
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5 rounded"
                        >
                          {copiedCid === row.cid ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Induk CID */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {row.induk_cid ? (
                        <span className="truncate block max-w-[125px]" title={row.induk_cid}>
                          {row.induk_cid}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Likes */}
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                        {row.likes.toLocaleString()}
                      </span>
                    </td>

                    {/* Total Balasan */}
                    <td className="py-3 px-3 text-center">
                      {row.jumlah_balasan > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {row.jumlah_balasan}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">0</span>
                      )}
                    </td>

                    {/* Bahasa */}
                    <td className="py-3 px-3 text-center">
                      {row.bahasa ? (
                        <span className="uppercase text-[10px] tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {row.bahasa}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Waktu */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {row.waktu || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
