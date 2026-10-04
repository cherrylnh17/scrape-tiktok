import type { Metadata } from 'next';
import GuideSteps from '@/components/GuideSteps';

export const metadata: Metadata = {
  title: 'Panduan Mengambil Data Komentar TikTok Menggunakan Console Chrome',
  description:
    'Langkah demi langkah cara menyadap dan mengumpulkan semua komentar serta balasan video TikTok via Chrome Console DevTools dan mengunduhnya sebagai JSON.',
};

export default function PanduanPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <GuideSteps />
      </div>
    </main>
  );
}
