import { Skeleton } from "@/components/ui/skeleton";

/**
 * OnlyOffice 編輯器載入骨架屏
 * 模擬真實的文檔編輯器界面結構
 * 用於 OnlyOfficeEditor 和 OnlyOfficeEditorWithUpload 組件
 */
export function OnlyOfficeEditorSkeleton() {
    return (
        <div className="flex h-full w-full flex-col bg-muted/20">
            {/* Top Header - Logo & Main Menu */}
            <div className="flex h-14 items-center gap-3 border-b border-border/40 bg-background px-4">
                <Skeleton className="h-8 w-32" /> {/* Logo */}
                <div className="flex gap-1">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>

            {/* Main Toolbar */}
            <div className="flex h-12 items-center gap-2 border-b border-border/40 bg-background px-4">
                <div className="flex gap-1">
                    {/* File operations */}
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                </div>
                <div className="mx-2 h-6 w-px bg-border/40" />
                <div className="flex gap-1">
                    {/* Text formatting */}
                    <Skeleton className="h-7 w-20 rounded" /> {/* Font selector */}
                    <Skeleton className="h-7 w-12 rounded" /> {/* Font size */}
                </div>
                <div className="mx-2 h-6 w-px bg-border/40" />
                <div className="flex gap-1">
                    {/* Bold, Italic, Underline */}
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                </div>
                <div className="mx-2 h-6 w-px bg-border/40" />
                <div className="flex gap-1">
                    {/* Text color */}
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                </div>
                <div className="flex-1" />
                <Skeleton className="h-8 w-24 rounded" /> {/* User/Share button */}
            </div>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Navigation Panel */}
                <div className="w-12 border-r border-border/40 bg-background">
                    <div className="flex flex-col items-center gap-2 p-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </div>

                {/* Main Editor Canvas */}
                <div className="flex-1 overflow-auto bg-muted/20 p-8">
                    {/* Document Page */}
                    <div className="mx-auto w-full max-w-[816px] bg-background p-12 shadow-lg">
                        {/* Document Title */}
                        <div className="mb-6">
                            <Skeleton className="h-8 w-2/3" />
                        </div>

                        {/* Paragraph 1 */}
                        <div className="mb-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-11/12" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>

                        {/* Heading */}
                        <div className="mb-3 mt-6">
                            <Skeleton className="h-6 w-1/2" />
                        </div>

                        {/* Paragraph 2 */}
                        <div className="mb-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>

                        {/* Bullet List */}
                        <div className="mb-4 space-y-2">
                            <div className="flex gap-2">
                                <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>

                        {/* Paragraph 3 */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex h-8 items-center justify-between border-t border-border/40 bg-background px-4 text-xs">
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-8" />
                </div>
            </div>
        </div>
    )
}
