/**
 * Brutalist Empty State Component
 *
 * Brutalist 風格的空狀態組件，遵循 Swiss Design 原則
 * - 高對比度黑白配色
 * - 無圓角設計
 * - 強烈視覺層次
 * - Mono 字體與大寫文字
 */

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BrutalistEmptyStateProps {
  /**
   * 圖標組件
   */
  icon?: LucideIcon;

  /**
   * 主標題 - 使用大寫、粗體顯示
   */
  title: string;

  /**
   * 描述文字 - 提供更多上下文
   */
  description?: string;

  /**
   * 主要行動按鈕
   */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };

  /**
   * 次要行動按鈕
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };

  /**
   * 自定義樣式
   */
  className?: string;

  /**
   * 變體 - 影響視覺呈現
   */
  variant?: 'default' | 'minimal' | 'boxed';

  /**
   * 狀態類型 - 影響配色
   */
  stateType?: 'empty' | 'error' | 'filtered' | 'processing';
}

export function BrutalistEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  variant = 'default',
  stateType = 'empty',
}: BrutalistEmptyStateProps) {
  // 根據狀態類型決定配色
  const stateColors = {
    empty: 'text-black/40 dark:text-white/40',
    error: 'text-[#FA4028]',
    filtered: 'text-black/60 dark:text-white/60',
    processing: 'text-yellow-600 dark:text-yellow-400',
  };

  const iconColor = stateColors[stateType];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center font-mono',
        variant === 'boxed' && 'border-2 border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-12',
        variant === 'default' && 'py-16 px-4',
        variant === 'minimal' && 'py-8 px-4',
        className
      )}
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-6">
          <Icon
            className={cn(
              'w-16 h-16 md:w-20 md:h-20',
              iconColor
            )}
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'font-black uppercase tracking-tight text-foreground mb-3',
          variant === 'minimal' ? 'text-base' : 'text-lg md:text-xl'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-xs md:text-sm text-muted-foreground max-w-md leading-relaxed mb-6',
            'uppercase tracking-wide font-bold'
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-sm">
          {action && (
            <Button
              onClick={action.onClick}
              className={cn(
                'w-full sm:w-auto',
                'rounded-none border-2 border-black dark:border-white',
                'bg-[#FA4028] hover:bg-black dark:hover:bg-white',
                'text-white hover:text-white dark:hover:text-black',
                'font-black uppercase tracking-widest text-xs',
                'shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.8)]',
                'active:shadow-none active:translate-x-[1px] active:translate-y-[1px]',
                'transition-all'
              )}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className={cn(
                'w-full sm:w-auto',
                'rounded-none border-2 border-black dark:border-white',
                'bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black',
                'font-black uppercase tracking-widest text-xs',
                'transition-colors'
              )}
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 mr-2" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 預設變體 - 常用空狀態快捷方式
 */

export function NoDataEmptyState({
  onAction
}: {
  onAction?: () => void
}) {
  return (
    <BrutalistEmptyState
      icon={require('lucide-react').FileText}
      title="NO DATA FOUND"
      description="No records available. Start by adding your first item."
      variant="boxed"
      stateType="empty"
      action={onAction ? {
        label: 'Add First Item',
        onClick: onAction,
        icon: require('lucide-react').Plus
      } : undefined}
    />
  );
}

export function FilteredEmptyState({
  searchQuery,
  onClearFilter
}: {
  searchQuery?: string;
  onClearFilter?: () => void;
}) {
  return (
    <BrutalistEmptyState
      icon={require('lucide-react').Search}
      title="NO MATCHES FOUND"
      description={searchQuery ? `No results for "${searchQuery}". Try adjusting your filters.` : 'No results match your current filters.'}
      variant="default"
      stateType="filtered"
      action={onClearFilter ? {
        label: 'Clear Filters',
        onClick: onClearFilter,
        icon: require('lucide-react').X
      } : undefined}
    />
  );
}

export function ErrorEmptyState({
  onRetry
}: {
  onRetry?: () => void
}) {
  return (
    <BrutalistEmptyState
      icon={require('lucide-react').AlertCircle}
      title="SYSTEM ERROR"
      description="Failed to load data. Check your connection and try again."
      variant="boxed"
      stateType="error"
      action={onRetry ? {
        label: 'Retry',
        onClick: onRetry,
        icon: require('lucide-react').RefreshCw
      } : undefined}
    />
  );
}
