import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface TemplateListSkeletonProps {
    viewMode?: 'grid' | 'list'
    count?: number
}

/**
 * 模板列表加载骨架屏
 * 完全镜像 TemplateList 的实际卡片结构
 */
export function TemplateListSkeleton({
    viewMode = 'grid',
    count = 8
}: TemplateListSkeletonProps) {
    if (viewMode === 'grid') {
        return (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: count }).map((_, i) => (
                    <Card
                        key={i}
                        className="group relative flex flex-col overflow-visible border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300"
                    >
                        <CardHeader className="p-5 space-y-4">
                            {/* Badge + Menu Icon */}
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-8 w-8 rounded-none" />
                            </div>

                            {/* Title (2 lines) */}
                            <div className="space-y-1">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-3/4" />
                            </div>

                            {/* Info Blocks */}
                            <div className="grid grid-cols-1 gap-2 pt-2">
                                {/* First Info Block - Category Entity */}
                                <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-6 w-28" />
                                </div>

                                {/* Second Info Block - Structure Note */}
                                <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
                                    <Skeleton className="h-3 w-28" />
                                    <Skeleton className="h-6 w-36" />
                                </div>
                            </div>
                        </CardHeader>

                        {/* Footer */}
                        <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-black/5 dark:border-white/5 mt-auto opacity-40">
                            <div className="flex gap-4 text-[9px] font-mono uppercase font-bold italic">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-4 w-4" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )
    }

    // List View
    return (
        <div className="border-[1.5px] border-black dark:border-white rounded-none overflow-hidden">
            {/* Header Row */}
            <div className="hidden md:grid grid-cols-[1fr_180px_150px_120px] gap-4 p-4 bg-muted border-b border-black/10 dark:border-white/10">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-black/10 dark:divide-white/10">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-1 md:grid-cols-[1fr_180px_150px_120px] gap-4 p-4"
                    >
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <div className="flex justify-end">
                            <Skeleton className="h-8 w-8 rounded-none" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
