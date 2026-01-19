'use client';

import dynamic from 'next/dynamic';

const TextRemovalTool = dynamic(
  () => import('@/features/text-removal').then((mod) => mod.TextRemovalTool),
  { ssr: false }
);

export default function TextRemovalPage() {
  return (
    <div className="py-8">
      <TextRemovalTool />
    </div>
  );
}
