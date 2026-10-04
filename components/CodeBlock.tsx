'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopyText(text));
  }
  return Promise.resolve(fallbackCopyText(text));
}

function fallbackCopyText(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export default function CodeBlock({
  code,
  language = 'javascript',
  title = 'Script Console Chrome',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyTextToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full rounded-xl border border-slate-700/80 bg-slate-950 text-slate-100 shadow-md overflow-hidden">
      {/* Header CodeBlock */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-mono text-slate-300 font-medium">{title}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
            {language}
          </span>
        </div>

        {/* Tombol Salin kode */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700/60"
          title="Salin seluruh kode script ke clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Salin kode</span>
            </>
          )}
        </button>
      </div>

      {/* Konten Kode dengan Scroll Vertikal & Horizontal */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto p-4 scrollbar-thin">
        <pre className="font-mono text-xs leading-relaxed text-slate-200 select-all whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Komponen inline code interaktif yang bisa diklik untuk menyalin perintah ke clipboard
 */
export function InlineCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const success = await copyTextToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Klik untuk menyalin perintah ini"
      className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md font-mono text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer group"
    >
      <span>{code}</span>
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-rose-400 opacity-60 group-hover:opacity-100 shrink-0" />
      )}
      {copied && (
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
          (tersalin!)
        </span>
      )}
    </button>
  );
}
