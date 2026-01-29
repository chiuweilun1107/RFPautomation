"use client"

import * as React from "react"

export type StatusFilter = 'all' | 'active' | 'expired' | 'awarded'
export type DeadlineFilter = 'all' | '3days' | '7days' | '30days'

export interface TenderFiltersState {
    statusFilter: StatusFilter
    deadlineFilter: DeadlineFilter
    debouncedSearch: string
    selectedDate: Date | null
}

export interface TenderFiltersActions {
    setStatusFilter: (filter: StatusFilter) => void
    setDeadlineFilter: (filter: DeadlineFilter) => void
    setSelectedDate: (date: Date | null) => void
    clearAllFilters: () => void
}

export interface UseTenderFiltersOptions {
    externalSearchQuery?: string
    onFilterChange?: () => void
}

export interface UseTenderFiltersReturn extends TenderFiltersState, TenderFiltersActions {
    applyStatusFilter: (tender: any) => boolean
    applyDeadlineFilter: (tender: any) => boolean
    applyAllFilters: (tender: any) => boolean
    getDisplayStatus: (tender: any) => string
    hasActiveFilters: boolean
}

export function useTenderFilters(options: UseTenderFiltersOptions = {}): UseTenderFiltersReturn {
    const { externalSearchQuery = "", onFilterChange } = options

    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all')
    const [deadlineFilter, setDeadlineFilter] = React.useState<DeadlineFilter>('all')
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
    const [debouncedSearch, setDebouncedSearch] = React.useState("")

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(externalSearchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [externalSearchQuery])

    // Notify parent when filters change
    React.useEffect(() => {
        onFilterChange?.()
    }, [statusFilter, deadlineFilter, debouncedSearch, onFilterChange])

    // Filter logic functions
    const applyStatusFilter = React.useCallback((tender: any): boolean => {
        if (statusFilter === 'all') return true

        const now = new Date()
        const deadlineDate = tender.deadline_date ? new Date(tender.deadline_date) : null

        if (statusFilter === 'active') {
            return !deadlineDate || deadlineDate > now
        } else if (statusFilter === 'expired') {
            return deadlineDate !== null && deadlineDate <= now
        } else if (statusFilter === 'awarded') {
            return Boolean(tender.status && tender.status.includes('已決標'))
        }
        return true
    }, [statusFilter])

    const applyDeadlineFilter = React.useCallback((tender: any): boolean => {
        if (deadlineFilter === 'all') return true

        const deadlineDate = tender.deadline_date ? new Date(tender.deadline_date) : null
        if (!deadlineDate) return false

        const now = new Date()
        const diffTime = deadlineDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return false

        if (deadlineFilter === '3days') {
            return diffDays <= 3
        } else if (deadlineFilter === '7days') {
            return diffDays <= 7
        } else if (deadlineFilter === '30days') {
            return diffDays <= 30
        }
        return true
    }, [deadlineFilter])

    const applyAllFilters = React.useCallback((tender: any): boolean => {
        return applyStatusFilter(tender) && applyDeadlineFilter(tender)
    }, [applyStatusFilter, applyDeadlineFilter])

    const getDisplayStatus = React.useCallback((tender: any): string => {
        if (tender.status?.includes('已決標')) {
            return '已決標'
        }

        if (tender.status?.includes('已撤案')) {
            return '已撤案'
        }

        if (tender.deadline_date) {
            const deadlineDate = new Date(tender.deadline_date)
            const now = new Date()

            if (deadlineDate <= now) {
                return '已截止'
            }
        }

        return tender.status || '招標中'
    }, [])

    const clearAllFilters = React.useCallback(() => {
        setSelectedDate(null)
        setStatusFilter('all')
        setDeadlineFilter('all')
    }, [])

    const hasActiveFilters = selectedDate !== null || statusFilter !== 'all' || deadlineFilter !== 'all'

    return {
        // State
        statusFilter,
        deadlineFilter,
        debouncedSearch,
        selectedDate,
        // Actions
        setStatusFilter,
        setDeadlineFilter,
        setSelectedDate,
        clearAllFilters,
        // Filter functions
        applyStatusFilter,
        applyDeadlineFilter,
        applyAllFilters,
        getDisplayStatus,
        // Computed
        hasActiveFilters,
    }
}
