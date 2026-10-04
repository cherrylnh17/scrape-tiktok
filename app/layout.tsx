import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Konverter Komentar TikTok ke CSV & Excel (XLSX)',
  description:
    'Aplikasi web satu halaman untuk mengonversi JSON respons API komentar TikTok menjadi file CSV, Excel (XLSX), atau TSV untuk Google Sheets secara instan dan aman langsung di browser.',
  keywords: [
    'TikTok comment scraper',
    'TikTok API JSON to CSV',
    'TikTok comment to Excel',
    'TikTok XLSX converter',
    'Konversi komentar TikTok',
  ],
  authors: [{ name: 'TikTok Comment Converter' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-rose-500 selection:text-white transition-colors">
        {children}
      </body>
    </html>
  );
}
