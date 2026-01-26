import { Skeleton } from "@/components/ui/skeleton";

interface TenderSubscriptionManagerSkeletonProps {
    count?: number
}

/**
 * 招标订阅管理器加载骨架屏
 * 用于 TenderSubscriptionManager 组件
 */
export function TenderSubscriptionManagerSkeleton({
    count = 6
}: TenderSubscriptionManagerSkeletonProps) {
    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-80" />
                </div>
                <Skeleton className="h-10 w-32 rounded-none" />
            </div>

            {/* Subscription Cards Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-40 w-full rounded-lg"
                    />
                ))}
            </div>
        </div>
    )
}
