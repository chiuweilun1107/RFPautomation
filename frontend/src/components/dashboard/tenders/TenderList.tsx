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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b-2 border-black dark:border-white">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-[#00063D] dark:text-white">
                        Tender_AGGREGATION (標案彙整)
                    </h1>
                    <p className="text-sm font-mono font-bold text-gray-500 dark:text-gray-400 max-w-2xl italic">
                        AUTOMATED_TRACKING: // 不錯過任何商機
                    </p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#00063D] dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#FA4028]"></span>
                        AGGREGATED_TENDERS
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        TOTAL_RECORDS: {totalCount}
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="SEARCH_TENDERS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full sm:w-[250px] h-9 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono text-xs font-bold focus:ring-[#FA4028] focus:ring-offset-0"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-none border-black dark:border-white bg-white dark:bg-black hover:bg-[#FA4028] hover:text-white font-mono text-xs font-bold transition-colors"
                        onClick={handleRunNow}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline uppercase tracking-wider">SYNC_NOW</span>
                    </Button>
                </div>
            </div>

            {/* Table Section */}
            <div className="border-[1.5px] border-black dark:border-white bg-white dark:bg-black overflow-hidden rounded-none">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted border-b border-black dark:border-white hover:bg-muted font-mono">
                            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">Publish_Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">Tender_Title</TableHead>
                            <TableHead className="w-[180px] text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">Agency_Entity</TableHead>
                            <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">Keyword</TableHead>
                            <TableHead className="w-[80px] text-right text-[10px] font-black uppercase tracking-wider text-black dark:text-white py-3">Ops</TableHead>
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
                                <TableRow key={tender.id} className="hover:bg-[#FA4028]/5 transition-colors group cursor-default">
                                    <TableCell className="font-mono text-[11px] font-black whitespace-nowrap text-black/60 dark:text-white/60">
                                        {tender.publish_date}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-mono text-xs font-black uppercase group-hover:text-[#FA4028] transition-colors line-clamp-1">
                                                {tender.title}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Badge className="rounded-none border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[9px] font-bold text-black/40 dark:text-white/40 px-1 py-0">
                                                    {tender.source}
                                                </Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-[11px] font-bold text-black/60 dark:text-white/60 border-l border-black/5 dark:border-white/5">
                                        <span className="line-clamp-1" title={tender.org_name}>
                                            {tender.org_name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="border-l border-black/5 dark:border-white/5">
                                        <Badge className="rounded-none bg-[#FA4028] text-white text-[9px] font-black uppercase px-1.5 py-0.5">
                                            {tender.keyword_tag}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right border-l border-black/5 dark:border-white/5">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-none text-gray-400 hover:text-white hover:bg-black dark:hover:bg-white dark:hover:text-black transition-colors"
                                            asChild
                                        >
                                            <a href={tender.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
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
            {/* Pagination Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Results_Per_Page</span>
                        <select
                            className="bg-transparent border-b-2 border-black dark:border-white font-mono text-[10px] font-black focus:outline-none focus:border-[#FA4028] transition-colors"
                            value={pageSize}
                            disabled
                        >
                            <option value={pageSize}>{pageSize}</option>
                        </select>
                    </div>
                    <div className="text-[10px] font-mono font-bold opacity-40 uppercase tracking-widest">
                        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono text-[10px] font-black uppercase hover:bg-[#FA4028] hover:text-white disabled:opacity-30 transition-all group"
                    >
                        <span className="mr-1 group-hover:-translate-x-1 transition-transform">←</span>
                        PREV
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                            let p = page;
                            if (page === 1) p = i + 1;
                            else if (page === totalPages) p = totalPages - 2 + i;
                            else p = page - 1 + i;

                            if (p < 1 || p > totalPages) return null;

                            return (
                                <Button
                                    key={p}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p)}
                                    className={`h-8 w-8 rounded-none border-black dark:border-white font-mono text-[10px] font-black transition-all ${page === p
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-white text-black dark:bg-black dark:text-white hover:bg-[#FA4028]/10'
                                        }`}
                                >
                                    {String(p).padStart(2, '0')}
                                </Button>
                            )
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-8 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono text-[10px] font-black uppercase hover:bg-[#FA4028] hover:text-white disabled:opacity-30 transition-all group"
                    >
                        NEXT
                        <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
