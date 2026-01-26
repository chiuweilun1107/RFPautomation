import { Skeleton } from "@/components/ui/skeleton";

/**
 * OnlyOffice 编辑器加载骨架屏
 * 用于 OnlyOfficeEditor 和 OnlyOfficeEditorWithUpload 组件
 */
export function OnlyOfficeEditorSkeleton() {
    return (
        <div className="w-full space-y-4">
            {/* Toolbar skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <div className="flex-1" />
                <Skeleton className="h-8 w-12" />
            </div>

            {/* Content area - document */}
            <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />

                <div className="h-2" />

                <Skeleton className="h-6 w-1/3" />

                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />

                <div className="h-2" />

                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    )
}
