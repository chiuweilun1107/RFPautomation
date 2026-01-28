"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function SkeletonTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">✨ 品牌色 Skeleton 動畫</h1>
          <p className="text-muted-foreground">
            使用 Swiss Red (accent) 品牌色的高效能 GPU 加速動畫
          </p>
        </div>

        {/* 效能說明 */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <span className="text-2xl">⚡</span>
            效能優化
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>GPU 加速：</strong>使用 transform 而非 background-position</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>品牌一致：</strong>背景 15% + 波浪 50% = 一開始就是紅色</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>流暢體驗：</strong>1.8 秒循環，層次分明的品牌色動畫</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span><strong>高效能：</strong>只觸發 composite，不會 repaint</span>
            </div>
          </div>
        </div>

        {/* 實際使用的 Skeleton 組件 */}
        <div className="space-y-4 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold">目前的 Skeleton 組件（已優化）</h2>
          <p className="text-sm text-muted-foreground">
            背景淡紅色 (15%)，波浪濃紅色 (50%)，一開始就有品牌色印象 🎨
          </p>

          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />

            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>

        {/* 模擬真實場景 */}
        <div className="space-y-4 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold">模擬真實載入場景</h2>

          {/* Card Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-border p-4">
                <Skeleton className="h-[160px] w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* List View */}
        <div className="space-y-4 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold">列表載入</h2>

          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* 背景色對比 */}
        <div className="space-y-4 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold">背景色 + 波浪色組合</h2>
          <p className="text-sm text-muted-foreground">
            不同的背景色和波浪強度組合
          </p>

          <div className="space-y-4">
            {/* 灰底 + 淡波 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">灰底 (muted) + 30% 紅波</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              </div>
            </div>

            {/* 灰底 + 濃波 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">灰底 (muted) + 45% 紅波</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
              </div>
            </div>

            {/* 淡紅底 + 濃波 - 目前使用 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">15% 紅底 + 50% 紅波（目前使用）✓</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-accent/15">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              </div>
            </div>

            {/* 淡紅底 + 更濃波 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">15% 紅底 + 60% 紅波（更濃）</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-accent/15">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
              </div>
            </div>

            {/* 較濃紅底 + 濃波 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">20% 紅底 + 55% 紅波（品牌感更強）</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-accent/20">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/55 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* 效果對比 */}
        <div className="space-y-4 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold">單一波浪強度對比</h2>
          <p className="text-sm text-muted-foreground">
            灰底背景下，不同波浪強度的對比
          </p>

          <div className="space-y-4">
            {/* 10% opacity */}
            <div className="space-y-2">
              <div className="text-sm font-medium">10% 品牌色（非常淡）</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
              </div>
            </div>

            {/* 20% opacity */}
            <div className="space-y-2">
              <div className="text-sm font-medium">20% 品牌色（淡）</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
              </div>
            </div>

            {/* 30% opacity */}
            <div className="space-y-2">
              <div className="text-sm font-medium">30% 品牌色（淡）</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              </div>
            </div>

            {/* 40% opacity */}
            <div className="space-y-2">
              <div className="text-sm font-medium">40% 品牌色（較濃）</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
              </div>
            </div>

            {/* 45% opacity - 目前使用 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">45% 品牌色（目前使用）✓</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/45 to-transparent" />
              </div>
            </div>

            {/* 50% opacity */}
            <div className="space-y-2">
              <div className="text-sm font-medium">50% 品牌色（濃）</div>
              <div className="relative h-16 w-full overflow-hidden rounded-md bg-muted">
                <div className="absolute inset-0 -translate-x-full animate-shimmer-brand bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Dark Mode 測試 */}
        <div className="space-y-4 rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold">Dark Mode 相容性</h2>
          <p className="text-sm text-muted-foreground">
            在深色模式下，Swiss Red (#FA4028) 同樣搶眼
          </p>

          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>

        {/* 技術說明 */}
        <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-6">
          <h2 className="text-xl font-semibold">技術實現</h2>

          <div className="space-y-3 font-mono text-sm">
            <div className="rounded bg-background p-3">
              <div className="text-muted-foreground">// Skeleton 組件</div>
              <div className="text-accent">
                className="relative overflow-hidden bg-accent/15"
              </div>
              <div className="text-xs text-muted-foreground">↑ 淡紅色背景，一開始就有品牌色</div>
            </div>

            <div className="rounded bg-background p-3">
              <div className="text-muted-foreground">// 動畫層</div>
              <div className="text-foreground">
                before:absolute before:inset-0
              </div>
              <div className="text-foreground">
                before:-translate-x-full
              </div>
              <div className="text-foreground">
                before:animate-shimmer-brand
              </div>
            </div>

            <div className="rounded bg-background p-3">
              <div className="text-muted-foreground">// 品牌色漸變波浪</div>
              <div className="text-foreground">
                before:bg-gradient-to-r
              </div>
              <div className="text-foreground">
                before:from-transparent
              </div>
              <div className="text-accent">
                before:via-accent/50 <span className="text-muted-foreground">← Swiss Red 50% 波浪</span>
              </div>
              <div className="text-foreground">
                before:to-transparent
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                背景 15% + 波浪 50% = 層次感品牌色動畫
              </div>
            </div>

            <div className="rounded bg-background p-3">
              <div className="text-muted-foreground">// CSS Keyframes (GPU 加速)</div>
              <div className="text-foreground">
                @keyframes shimmer-brand {'{'}<br />
                {'  '}0% {'{'} transform: translateX(-100%); {'}'}<br />
                {'  '}100% {'{'} transform: translateX(100%); {'}'}<br />
                {'}'}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <p className="font-semibold">為什麼高效能？</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <code>transform</code> 屬性由 GPU 處理，不觸發重排或重繪</li>
              <li>• 使用偽元素 <code>::before</code> 避免額外 DOM 節點</li>
              <li>• 漸變是靜態的，只有位置在移動</li>
              <li>• 適合大量 skeleton 同時顯示的場景</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
