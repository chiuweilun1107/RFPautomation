import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface KnowledgeListSkeletonProps {
    count?: number
}

/**
 * 知识库列表加载骨架屏
 * 完全镜像 KnowledgeList 的实际卡片结构
 */
export function KnowledgeListSkeleton({
    count = 6
}: KnowledgeListSkeletonProps) {
    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <Card
                    key={i}
                    className="group relative flex flex-col overflow-visible border-[1.5px] border-black dark:border-white rounded-none bg-background transition-all duration-300"
                >
                    <CardHeader className="p-5 space-y-4">
                        {/* Status Badge + Delete Button */}
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-5 w-20 rounded-none" />
                            <Skeleton className="h-8 w-8 rounded-none" />
                        </div>

                        {/* Title (2 lines) */}
                        <CardTitle className="text-2xl font-black leading-[1.1] font-mono tracking-tighter uppercase space-y-1">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-2/3" />
                        </CardTitle>

                        {/* Info Blocks */}
                        <div className="grid grid-cols-1 gap-2 pt-2">
                            {/* First Info Block - Source Entity */}
                            <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-black dark:border-white space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                                    <Skeleton className="h-3 w-3" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-28" />
                            </div>

                            {/* Second Info Block - Temporal Stamp */}
                            <div className="bg-black/5 dark:bg-white/5 p-4 border-l-4 border-[#FA4028] space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FA4028] uppercase tracking-[0.2em]">
                                    <Skeleton className="h-3 w-3" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    </CardHeader>

                    {/* Footer */}
                    <CardFooter className="px-5 py-3 flex gap-4 border-t border-black/5 dark:border-white/5 mt-auto opacity-40">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-24" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
