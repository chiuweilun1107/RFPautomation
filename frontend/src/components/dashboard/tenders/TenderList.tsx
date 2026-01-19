"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ExternalLink, RefreshCw, Loader2, LayoutGrid, List as ListIcon, Calendar } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { SwissPagination } from "@/components/ui/SwissPagination"
import { cn } from "@/lib/utils"
import { TenderGrid } from "./TenderGrid"
import { TenderCalendarView } from "./TenderCalendarView"

export function TenderList({ searchQuery: externalSearchQuery = "", syncButtonPortalId }: { searchQuery?: string, syncButtonPortalId?: string }) {
    const [tenders, setTenders] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [page, setPage] = React.useState(1)
    const [viewMode, setViewMode] = React.useState<'list' | 'grid' | 'calendar'>('list')
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
    const [totalCount, setTotalCount] = React.useState(0)
    const [debouncedSearch, setDebouncedSearch] = React.useState("")
    const [pageSize, setPageSize] = React.useState(12)
    const [isMounted, setIsMounted] = React.useState(false)
    const supabase = createClient()

    // Fix hydration error by tracking if component is mounted
    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const searchParams = useSearchParams()
    const selectedKeyword = searchParams.get('keyword')

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(externalSearchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [externalSearchQuery])

    // Reset to page 1 when filter or search changes
    React.useEffect(() => {
        setPage(1)
        setSelectedDate(null)
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

            // Apply date filter if selectedDate exists
            if (selectedDate) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                query = query.eq('publish_date', dateStr);
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
    }, [page, selectedKeyword, debouncedSearch, selectedDate]) // Refetch when page, keyword, search or date changes

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b-2 border-black dark:border-white">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-[#00063D] dark:text-white">
                        Tender_Aggregation
                    </h1>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#00063D] dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500"></span>
                        Aggregated_Tenders
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        TOTAL_RECORDS: {totalCount} // 彙整標案清單
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Toggles - Matching Project Dashboard */}
                    <div className="flex border border-black dark:border-white h-10 p-1 bg-white dark:bg-black shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "px-3 transition-colors flex items-center justify-center",
                                viewMode === 'grid'
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "px-3 transition-colors flex items-center justify-center",
                                viewMode === 'list'
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "px-3 transition-colors flex items-center justify-center",
                                viewMode === 'calendar'
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "hover:bg-muted text-muted-foreground"
                            )}
                        >
                            <Calendar className="h-4 w-4" />
                        </button>
                    </div>

                    {syncButtonPortalId ? (
                        isMounted && document.getElementById(syncButtonPortalId) ? (
                            createPortal(
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 rounded-none border-black dark:border-white bg-[#FA4028] text-white hover:bg-black font-mono text-xs font-bold transition-colors uppercase tracking-widest px-6"
                                    onClick={handleRunNow}
                                    disabled={isSyncing}
                                >
                                    <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                                    SYNC_DATA
                                </Button>,
                                document.getElementById(syncButtonPortalId)!
                            )
                        ) : null
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-none border-black dark:border-white bg-white dark:bg-black hover:bg-[#FA4028] hover:text-white font-mono text-xs font-bold transition-colors"
                            onClick={handleRunNow}
                            disabled={isSyncing}
                        >
                            <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline uppercase tracking-wider">SYNC_NOW</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Selection Info / Clear Filter - Matching Project Dashboard */}
            {selectedDate && (
                <div className="flex items-center justify-between p-4 bg-[#FA4028] text-white font-mono rounded-none mb-4">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Filtered_By_Date</span>
                        <span className="text-sm font-black underline underline-offset-4">
                            {selectedDate.toLocaleDateString()}
                        </span>
                        <span className="text-[10px] font-black opacity-60">// {totalCount} TENDERS_FOUND</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDate(null)}
                        className="h-7 rounded-none border border-white hover:bg-white hover:text-[#FA4028] text-[10px] font-black uppercase"
                    >
                        Clear_Filter [X]
                    </Button>
                </div>
            )}

            {/* View Switching Logic */}
            {tenders.length === 0 ? (
                <div className="text-center py-12 border-[1.5px] border-black dark:border-white text-gray-500 font-mono text-xs uppercase">
                    尚無標案資料，請先新增關鍵字並同步。 // NULL_DATA
                </div>
            ) : (
                <>
                    {viewMode === 'list' && (
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
                                    {tenders.map((tender) => (
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
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {viewMode === 'grid' && (
                        <TenderGrid tenders={tenders} />
                    )}

                    {viewMode === 'calendar' && (
                        <TenderCalendarView
                            tenders={tenders}
                            onDayClick={(date) => {
                                setSelectedDate(date);
                                setViewMode('grid');
                            }}
                        />
                    )}
                </>
            )}

            {/* Pagination Section - Hide in calendar view */}
            {viewMode !== 'calendar' && (
                <SwissPagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                />
            )}
        </div>
    )
}
