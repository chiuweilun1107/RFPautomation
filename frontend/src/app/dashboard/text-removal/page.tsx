'use client';

import dynamic from 'next/dynamic';

const TextRemovalTool = dynamic(
  () => import('@/features/text-removal').then((mod) => mod.TextRemovalTool),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    ),
  }
);

export default function TextRemovalPage() {
  return (
    <div className="py-8">
      <TextRemovalTool />
    </div>
  );
}
