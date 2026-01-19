import { TenderSubscriptionManager } from "@/components/dashboard/tenders/TenderSubscriptionManager"
import { TenderList } from "@/components/dashboard/tenders/TenderList"

export default function TendersPage() {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-gray-200/50 dark:border-white/5">
                <div className="space-y-1">
                    <h1 className="text-3xl font-serif font-bold text-[#00063D] dark:text-white tracking-tight">
                        標案彙整
                    </h1>
                    <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
                        自動追蹤並彙整您感興趣的標案資訊，不錯過任何商機。
                    </p>
                </div>
            </div>

            {/* Components Section */}
            <div className="space-y-8">
                <TenderSubscriptionManager />
                <TenderList />
            </div>
        </div>
    )
}
