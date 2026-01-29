"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { RefreshCw, LayoutGrid, List as ListIcon, Calendar } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { SwissPagination } from "@/components/ui/SwissPagination"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Import refactored components
import { TenderListView } from "./views/TenderListView"
import { TenderGridView } from "./views/TenderGridView"
import { TenderCalendarView, type DateType } from "./views/TenderCalendarView"
import { useTenderFilters, type StatusFilter, type DeadlineFilter } from "./hooks/useTenderFilters"

// Re-export types for backward compatibility
export type { StatusFilter, DeadlineFilter }

type ViewMode = 'list' | 'grid' | 'calendar'

interface TenderListProps {
    searchQuery?: string
    syncButtonPortalId?: string
}

export function TenderList({ searchQuery: externalSearchQuery = "", syncButtonPortalId }: TenderListProps) {
    const [tenders, setTenders] = React.useState<any[]>([])
    const [allTendersForCalendar, setAllTendersForCalendar] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isLoadingCalendar, setIsLoadingCalendar] = React.useState(false)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [page, setPage] = React.useState(1)
    const [viewMode, setViewMode] = React.useState<ViewMode>('list')
    const [dateType, setDateType] = React.useState<DateType>('deadline')
    const [totalCount, setTotalCount] = React.useState(0)
    const [pageSize, setPageSize] = React.useState(12)
    const [isMounted, setIsMounted] = React.useState(false)

    const supabase = createClient()
    const searchParams = useSearchParams()
    const selectedKeyword = searchParams.get('keyword')

    // Use the extracted filter hook
    const {
        statusFilter,
        deadlineFilter,
        debouncedSearch,
        selectedDate,
        setStatusFilter,
        setDeadlineFilter,
        setSelectedDate,
        clearAllFilters,
        applyAllFilters,
        getDisplayStatus,
        hasActiveFilters,
    } = useTenderFilters({
        externalSearchQuery,
    })

    // Fix hydration error by tracking if component is mounted
    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    // Reset to page 1 when filter or search changes
    React.useEffect(() => {
        setPage(1)
        setSelectedDate(null)
    }, [selectedKeyword, debouncedSearch, statusFilter, deadlineFilter, setSelectedDate])

    const fetchTenders = React.useCallback(async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let activeKeywords: string[] = []

            if (selectedKeyword) {
                activeKeywords = [selectedKeyword]
            } else {
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

            const from = (page - 1) * pageSize

            let query = supabase
                .from('tenders')
                .select('*', { count: 'exact' })
                .in('keyword_tag', activeKeywords)

            if (debouncedSearch.trim()) {
                query = query.or(`title.ilike.%${debouncedSearch}%,org_name.ilike.%${debouncedSearch}%`)
            }

            if (selectedDate) {
                const year = selectedDate.getFullYear()
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                const day = String(selectedDate.getDate()).padStart(2, '0')
                const dateStr = `${year}-${month}-${day}`
                query = query.eq('publish_date', dateStr)
            }

            const { data, error } = await query.order('publish_date', { ascending: false })

            if (error) throw error

            const filteredData = (data || []).filter(applyAllFilters)
            const paginatedData = filteredData.slice(from, from + pageSize)

            setTenders(paginatedData)
            setTotalCount(filteredData.length)
        } catch (error) {
            console.error('Error fetching tenders:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase, selectedKeyword, page, pageSize, debouncedSearch, selectedDate, applyAllFilters])

    const fetchAllTendersForCalendar = React.useCallback(async () => {
        setIsLoadingCalendar(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let activeKeywords: string[] = []

            if (selectedKeyword) {
                activeKeywords = [selectedKeyword]
            } else {
                const { data: subs, error: subsError } = await supabase
                    .from('tender_subscriptions')
                    .select('keyword')
                    .eq('user_id', user.id)
                    .eq('is_active', true)

                if (subsError) throw subsError

                if (!subs || subs.length === 0) {
                    setAllTendersForCalendar([])
                    setIsLoadingCalendar(false)
                    return
                }
                activeKeywords = subs.map(s => s.keyword)
            }

            let query = supabase
                .from('tenders')
                .select('id, title, publish_date, deadline_date, url, org_name')
                .in('keyword_tag', activeKeywords)

            if (debouncedSearch.trim()) {
                query = query.or(`title.ilike.%${debouncedSearch}%,org_name.ilike.%${debouncedSearch}%`)
            }

            const { data, error } = await query.order('publish_date', { ascending: false })

            if (error) throw error

            const filteredData = (data || []).filter(applyAllFilters)
            setAllTendersForCalendar(filteredData)
        } catch (error) {
            console.error('Error fetching all tenders for calendar:', error)
        } finally {
            setIsLoadingCalendar(false)
        }
    }, [supabase, selectedKeyword, debouncedSearch, applyAllFilters])

    // Set up realtime subscriptions and initial fetch
    React.useEffect(() => {
        const tendersChannel = supabase
            .channel('tenders_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tenders' }, () => {
                fetchTenders()
                if (viewMode === 'calendar') {
                    fetchAllTendersForCalendar()
                }
            })
            .subscribe()

        const subsChannel = supabase
            .channel('subscriptions_changes_for_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tender_subscriptions' }, () => {
                fetchTenders()
                if (viewMode === 'calendar') {
                    fetchAllTendersForCalendar()
                }
            })
            .subscribe()

        fetchTenders()

        return () => {
            supabase.removeChannel(tendersChannel)
            supabase.removeChannel(subsChannel)
        }
    }, [page, selectedKeyword, debouncedSearch, selectedDate, statusFilter, deadlineFilter, fetchTenders, fetchAllTendersForCalendar, viewMode, supabase])

    // Load all tenders when switching to calendar view
    React.useEffect(() => {
        if (viewMode === 'calendar') {
            fetchAllTendersForCalendar()
        }
    }, [viewMode, selectedKeyword, debouncedSearch, statusFilter, deadlineFilter, fetchAllTendersForCalendar])

    const handleRunNow = async () => {
        setIsSyncing(true)
        try {
            const response = await fetch('/api/trigger-aggregation', { method: 'POST' })
            const result = await response.json()

            if (!result.success) throw new Error(result.message)

            alert('已觸發彙整排程！請稍候資料更新。')
            setTimeout(fetchTenders, 2000)
        } catch (error) {
            console.error('Error triggering webhook:', error)
            alert('觸發失敗，請確認後端服務。')
        } finally {
            setIsSyncing(false)
        }
    }

    const handleDayClick = React.useCallback((date: Date) => {
        setSelectedDate(date)
        setViewMode('grid')
    }, [setSelectedDate])

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b-2 border-black dark:border-white">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black uppercase tracking-tight text-[#00063D] dark:text-white">
                        Tender_Aggregation
                    </h1>
                </div>
            </div>

            {/* Filter Section */}
            <FilterToolbar
                statusFilter={statusFilter}
                deadlineFilter={deadlineFilter}
                onStatusFilterChange={setStatusFilter}
                onDeadlineFilterChange={setDeadlineFilter}
            />

            {/* Toolbar Section */}
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
                    {/* Date Type Selector - Show only in calendar view */}
                    {viewMode === 'calendar' && (
                        <DateTypeSelector value={dateType} onChange={setDateType} />
                    )}

                    {/* View Mode Toggles */}
                    <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />

                    {/* Sync Button */}
                    <SyncButton
                        isSyncing={isSyncing}
                        isMounted={isMounted}
                        syncButtonPortalId={syncButtonPortalId}
                        onSync={handleRunNow}
                    />
                </div>
            </div>

            {/* Active Filters Banner */}
            {hasActiveFilters && (
                <ActiveFiltersBanner
                    selectedDate={selectedDate}
                    statusFilter={statusFilter}
                    deadlineFilter={deadlineFilter}
                    totalCount={totalCount}
                    onClear={clearAllFilters}
                />
            )}

            {/* Content Area */}
            {tenders.length === 0 ? (
                <div className="text-center py-12 border-[1.5px] border-black dark:border-white text-gray-500 font-mono text-xs uppercase">
                    尚無標案資料，請先新增關鍵字並同步。 // NULL_DATA
                </div>
            ) : (
                <>
                    {viewMode === 'list' && (
                        <TenderListView tenders={tenders} getDisplayStatus={getDisplayStatus} />
                    )}

                    {viewMode === 'grid' && (
                        <TenderGridView tenders={tenders} getDisplayStatus={getDisplayStatus} />
                    )}

                    {viewMode === 'calendar' && (
                        <TenderCalendarView
                            tenders={allTendersForCalendar}
                            dateType={dateType}
                            isLoading={isLoadingCalendar}
                            totalCount={totalCount}
                            onDayClick={handleDayClick}
                        />
                    )}
                </>
            )}

            {/* Pagination - Hide in calendar view */}
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

// ============================================================================
// Sub-components for better organization
// ============================================================================

interface FilterToolbarProps {
    statusFilter: StatusFilter
    deadlineFilter: DeadlineFilter
    onStatusFilterChange: (filter: StatusFilter) => void
    onDeadlineFilterChange: (filter: DeadlineFilter) => void
}

function FilterToolbar({
    statusFilter,
    deadlineFilter,
    onStatusFilterChange,
    onDeadlineFilterChange
}: FilterToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-black/10 dark:border-white/10">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black/40 dark:text-white/40">
                    STATUS_FILTER:
                </span>
                <div className="flex border border-black dark:border-white h-9 p-0.5 bg-white dark:bg-black">
                    <FilterButton
                        active={statusFilter === 'all'}
                        onClick={() => onStatusFilterChange('all')}
                        activeClass="bg-black text-white dark:bg-white dark:text-black"
                    >
                        全部
                    </FilterButton>
                    <FilterButton
                        active={statusFilter === 'active'}
                        onClick={() => onStatusFilterChange('active')}
                        activeClass="bg-[#00C853] text-white"
                    >
                        招標中
                    </FilterButton>
                    <FilterButton
                        active={statusFilter === 'expired'}
                        onClick={() => onStatusFilterChange('expired')}
                        activeClass="bg-[#FA4028] text-white"
                    >
                        已截止
                    </FilterButton>
                    <FilterButton
                        active={statusFilter === 'awarded'}
                        onClick={() => onStatusFilterChange('awarded')}
                        activeClass="bg-[#285AFA] text-white"
                    >
                        已決標
                    </FilterButton>
                </div>
            </div>

            {/* Deadline Filter */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black/40 dark:text-white/40">
                    DEADLINE_ALERT:
                </span>
                <div className="flex border border-black dark:border-white h-9 p-0.5 bg-white dark:bg-black">
                    <FilterButton
                        active={deadlineFilter === 'all'}
                        onClick={() => onDeadlineFilterChange('all')}
                        activeClass="bg-black text-white dark:bg-white dark:text-black"
                    >
                        全部
                    </FilterButton>
                    <FilterButton
                        active={deadlineFilter === '3days'}
                        onClick={() => onDeadlineFilterChange('3days')}
                        activeClass="bg-[#FA4028] text-white"
                    >
                        3天內
                    </FilterButton>
                    <FilterButton
                        active={deadlineFilter === '7days'}
                        onClick={() => onDeadlineFilterChange('7days')}
                        activeClass="bg-[#FF9800] text-white"
                    >
                        7天內
                    </FilterButton>
                    <FilterButton
                        active={deadlineFilter === '30days'}
                        onClick={() => onDeadlineFilterChange('30days')}
                        activeClass="bg-[#FDD835] text-black"
                    >
                        30天內
                    </FilterButton>
                </div>
            </div>
        </div>
    )
}

interface FilterButtonProps {
    active: boolean
    activeClass: string
    onClick: () => void
    children: React.ReactNode
}

function FilterButton({ active, activeClass, onClick, children }: FilterButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 text-[10px] font-mono font-black uppercase tracking-wider transition-colors",
                active ? activeClass : "hover:bg-muted text-muted-foreground"
            )}
        >
            {children}
        </button>
    )
}

interface DateTypeSelectorProps {
    value: DateType
    onChange: (value: DateType) => void
}

function DateTypeSelector({ value, onChange }: DateTypeSelectorProps) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as DateType)}>
            <SelectTrigger className="w-[160px] h-10 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono text-xs font-bold uppercase tracking-wider">
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-black dark:border-white">
                <SelectItem value="deadline" className="font-mono text-xs font-bold uppercase">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#FA4028]"></span>
                        截止日期
                    </span>
                </SelectItem>
                <SelectItem value="publish" className="font-mono text-xs font-bold uppercase">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#285AFA]"></span>
                        發布日期
                    </span>
                </SelectItem>
            </SelectContent>
        </Select>
    )
}

interface ViewModeToggleProps {
    viewMode: ViewMode
    onChange: (mode: ViewMode) => void
}

function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
    return (
        <div className="flex border border-black dark:border-white h-10 p-1 bg-white dark:bg-black shrink-0">
            <button
                onClick={() => onChange('grid')}
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
                onClick={() => onChange('list')}
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
                onClick={() => onChange('calendar')}
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
    )
}

interface SyncButtonProps {
    isSyncing: boolean
    isMounted: boolean
    syncButtonPortalId?: string
    onSync: () => void
}

function SyncButton({ isSyncing, isMounted, syncButtonPortalId, onSync }: SyncButtonProps) {
    const portalButton = (
        <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-none border-black dark:border-white bg-[#FA4028] text-white hover:bg-black font-mono text-xs font-bold transition-colors uppercase tracking-widest px-6"
            onClick={onSync}
            disabled={isSyncing}
        >
            <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            SYNC_DATA
        </Button>
    )

    const inlineButton = (
        <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-none border-black dark:border-white bg-white dark:bg-black hover:bg-[#FA4028] hover:text-white font-mono text-xs font-bold transition-colors"
            onClick={onSync}
            disabled={isSyncing}
        >
            <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline uppercase tracking-wider">SYNC_NOW</span>
        </Button>
    )

    if (syncButtonPortalId) {
        const portalTarget = isMounted ? document.getElementById(syncButtonPortalId) : null
        return portalTarget ? createPortal(portalButton, portalTarget) : null
    }

    return inlineButton
}

interface ActiveFiltersBannerProps {
    selectedDate: Date | null
    statusFilter: StatusFilter
    deadlineFilter: DeadlineFilter
    totalCount: number
    onClear: () => void
}

function ActiveFiltersBanner({
    selectedDate,
    statusFilter,
    deadlineFilter,
    totalCount,
    onClear
}: ActiveFiltersBannerProps) {
    const getStatusLabel = (filter: StatusFilter): string => {
        switch (filter) {
            case 'active': return '招標中'
            case 'expired': return '已截止'
            case 'awarded': return '已決標'
            default: return ''
        }
    }

    const getDeadlineLabel = (filter: DeadlineFilter): string => {
        switch (filter) {
            case '3days': return '3天內'
            case '7days': return '7天內'
            case '30days': return '30天內'
            default: return ''
        }
    }

    return (
        <div className="flex items-center justify-between p-4 bg-[#FA4028] text-white font-mono rounded-none mb-4">
            <div className="flex items-center gap-4 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Active_Filters:</span>
                {selectedDate && (
                    <span className="text-sm font-black underline underline-offset-4">
                        DATE: {selectedDate.toLocaleDateString()}
                    </span>
                )}
                {statusFilter !== 'all' && (
                    <span className="text-sm font-black underline underline-offset-4">
                        STATUS: {getStatusLabel(statusFilter)}
                    </span>
                )}
                {deadlineFilter !== 'all' && (
                    <span className="text-sm font-black underline underline-offset-4">
                        DEADLINE: {getDeadlineLabel(deadlineFilter)}
                    </span>
                )}
                <span className="text-[10px] font-black opacity-60">// {totalCount} TENDERS_FOUND</span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 rounded-none border border-white hover:bg-white hover:text-[#FA4028] text-[10px] font-black uppercase"
            >
                Clear_All_Filters [X]
            </Button>
        </div>
    )
}
