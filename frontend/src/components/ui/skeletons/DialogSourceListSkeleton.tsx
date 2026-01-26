import { Skeleton } from "@/components/ui/skeleton";

interface DialogSourceListSkeletonProps {
    count?: number
}

/**
 * 对话框内源列表加载骨架屏
 * 用于 SourceSelectionDialog
 */
export function DialogSourceListSkeleton({
    count = 5
}: DialogSourceListSkeletonProps) {
    return (
        <div className="space-y-1">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-start gap-3 p-3 hover:bg-white dark:hover:bg-black border border-transparent hover:border-black/5 transition-colors"
                >
                    {/* Checkbox */}
                    <Skeleton className="h-4 w-4 mt-0.5 rounded-none" />

                    {/* Content */}
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            ))}
        </div>
    )
}
