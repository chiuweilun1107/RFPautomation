"use client"

import * as React from "react"
import { ExternalLink, RefreshCw, Search, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { createClient } from "@/lib/supabase/client"

export function TenderList() {
    const [tenders, setTenders] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [page, setPage] = React.useState(1)
    const [totalCount, setTotalCount] = React.useState(0)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const pageSize = 10
    const supabase = createClient()

    const searchParams = useSearchParams()
    const selectedKeyword = searchParams.get('keyword')

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Reset to page 1 when filter or search changes
    React.useEffect(() => {
        setPage(1)
    }, [selectedKeyword, debouncedSearch])

    const fetchTenders = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let activeKeywords: string[] = []

            // If a specific keyword is selected, use only that
            if (selectedKeyword) {
                activeKeywords = [selectedKeyword]
            } else {
                // Otherwise fetch all active subscriptions
                const { data: subs, error: subsError } = await supabase
                    .from('tender_subscriptions')
                    .select('keyword')
                    .eq('user_id', user.id)
                    .eq('is_active', true)

                if (subsError) throw subsError

                if (!subs || subs.length === 0) {
                    setTenders([])
                    setTotalCount(0)
                    setIsLoading(false)
                    return
                }
                activeKeywords = subs.map(s => s.keyword)
            }

            // 2. Fetch tenders matching active keywords
            const from = (page - 1) * pageSize
            const to = from + pageSize - 1

            let query = supabase
                .from('tenders')
                .select('*', { count: 'exact' })
                .in('keyword_tag', activeKeywords)

            // Apply search filter if search query exists
            if (debouncedSearch.trim()) {
                query = query.or(`title.ilike.%${debouncedSearch}%,org_name.ilike.%${debouncedSearch}%`)
            }

            const { data, error, count } = await query
                .order('publish_date', { ascending: false })
                .range(from, to)

            if (error) throw error
            setTenders(data || [])
            setTotalCount(count || 0)
        } catch (error) {
            console.error('Error fetching tenders:', error)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        // Listen for changes in tenders table
        const tendersChannel = supabase
            .channel('tenders_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tenders' }, () => {
                fetchTenders()
            })
            .subscribe()

        // Listen for changes in subscriptions table (to refresh list when keyword deleted)
        const subsChannel = supabase
            .channel('subscriptions_changes_for_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tender_subscriptions' }, () => {
                fetchTenders()
            })
            .subscribe()

        fetchTenders()

        return () => {
            supabase.removeChannel(tendersChannel)
            supabase.removeChannel(subsChannel)
        }
    }, [page, selectedKeyword, debouncedSearch]) // Refetch when page, keyword or search changes

    const handleRunNow = async () => {
        setIsSyncing(true)
        try {
            const response = await fetch('/api/trigger-aggregation', { method: 'POST' })
            const result = await response.json()

            if (!result.success) throw new Error(result.message)

            alert('已觸發彙整排程！請稍候資料更新。')
            // Refresh explicitly after trigger
            setTimeout(fetchTenders, 2000)
        } catch (error) {
            console.error('Error triggering webhook:', error)
            alert('觸發失敗，請確認後端服務。')
        } finally {
            setIsSyncing(false)
        }
    }

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="space-y-4">
            {/* Toolbar Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-[#00063D] dark:text-white">
                        彙整標案列表
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        目前共有 {totalCount} 筆標案資料
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="搜尋標案名稱或機關..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full sm:w-[250px] h-9 bg-white dark:bg-black/20"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2"
                        onClick={handleRunNow}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">立即彙整</span>
                    </Button>
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5">
                            <TableHead className="w-[120px]">發布日期</TableHead>
                            <TableHead>標案名稱</TableHead>
                            <TableHead className="w-[180px]">機關名稱</TableHead>
                            <TableHead className="w-[100px]">關鍵字</TableHead>
                            <TableHead className="w-[100px] text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                </TableCell>
                            </TableRow>
                        ) : tenders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                    尚無標案資料，請先新增訂閱關鍵字並點擊「立即彙整」。
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenders.map((tender) => (
                                <TableRow key={tender.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                                    <TableCell className="font-medium whitespace-nowrap text-gray-600 dark:text-gray-400">
                                        {tender.publish_date}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-[#00063D] dark:text-gray-200 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                {tender.title}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-white/10">
                                                    {tender.source}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="line-clamp-1" title={tender.org_name}>
                                                {tender.org_name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 font-normal">
                                            {tender.keyword_tag}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 text-gray-400 hover:text-[#FA4028] hover:bg-[#FA4028]/10"
                                            asChild
                                        >
                                            <a href={tender.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                                <span className="sr-only">View</span>
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Section */}
            {totalPages > 1 && (
                <div className="flex justify-center py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="gap-1 pl-2.5"
                                >
                                    <span className="h-4 w-4 rotate-180">➜</span>
                                    <span>上一頁</span>
                                </Button>
                            </PaginationItem>

                            {/* Simple Logic: Show current page, maybe prev/next, simplified for now */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Logic to center the current page
                                let p = page - 2 + i;
                                if (page < 3) p = 1 + i;
                                if (page > totalPages - 2) p = totalPages - 4 + i;
                                if (p < 1 || p > totalPages) return null;

                                return (
                                    <PaginationItem key={p}>
                                        <PaginationLink
                                            isActive={page === p}
                                            onClick={() => setPage(p)}
                                            className="cursor-pointer"
                                        >
                                            {p}
                                        </PaginationLink>
                                    </PaginationItem>
                                )
                            })}

                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="gap-1 pr-2.5"
                                >
                                    <span>下一頁</span>
                                    <span className="h-4 w-4">➜</span>
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}
