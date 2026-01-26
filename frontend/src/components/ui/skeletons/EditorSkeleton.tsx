import { Skeleton } from "@/components/ui/skeleton";

interface EditorSkeletonProps {
    count?: number
}

/**
 * 编辑器/内容面板加载骨架屏
 * 模拟 markdown 或文本编辑器内容加载
 * 用于 ContentPanel、OnlyOfficeEditor 等
 */
export function EditorSkeleton({
    count = 6
}: EditorSkeletonProps) {
    return (
        <div className="space-y-4">
            {/* Paragraph 1 */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Paragraph 2 */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Heading */}
            <div className="pt-2">
                <Skeleton className="h-6 w-1/2" />
            </div>

            {/* Paragraph 3 */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Paragraph 4 */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
    )
}
