"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type DateType = 'publish' | 'deadline'

interface Tender {
    id: string
    title: string
    org_name: string
    publish_date: string
    deadline_date: string | null
    url: string
}

interface TenderCalendarViewProps {
    tenders: Tender[]
    dateType?: DateType
    isLoading?: boolean
    totalCount?: number
    onDayClick?: (date: Date) => void
}

interface CalendarDay {
    day: number
    month: number
    year: number
    isCurrentMonth: boolean
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
]

/**
 * Generates calendar days array for a given month
 * Includes days from previous and next months to fill the 6-week grid
 */
function generateCalendarDays(year: number, month: number): CalendarDay[] {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Monday is the first day of the week
    const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7
    const daysInMonth = lastDayOfMonth.getDate()
    const prevMonthLastDay = new Date(year, month, 0).getDate()

    const calendarDays: CalendarDay[] = []

    // Fill in previous month days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
        calendarDays.push({
            day: prevMonthLastDay - i,
            month: month - 1,
            year: year,
            isCurrentMonth: false,
        })
    }

    // Fill in current month days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
            day: i,
            month: month,
            year: year,
            isCurrentMonth: true,
        })
    }

    // Fill in next month days (6 weeks = 42 cells)
    const remainingCells = 42 - calendarDays.length
    for (let i = 1; i <= remainingCells; i++) {
        calendarDays.push({
            day: i,
            month: month + 1,
            year: year,
            isCurrentMonth: false,
        })
    }

    return calendarDays
}

/**
 * Checks if a given date is today
 */
function isToday(day: number, month: number, year: number): boolean {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
}

export function TenderCalendarView({
    tenders,
    dateType = 'deadline',
    isLoading = false,
    totalCount = 0,
    onDayClick
}: TenderCalendarViewProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date())

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const calendarDays = React.useMemo(
        () => generateCalendarDays(year, month),
        [year, month]
    )

    const handlePrevMonth = React.useCallback(() => {
        setCurrentDate(new Date(year, month - 1, 1))
    }, [year, month])

    const handleNextMonth = React.useCallback(() => {
        setCurrentDate(new Date(year, month + 1, 1))
    }, [year, month])

    const getTendersForDay = React.useCallback((day: number, m: number, y: number): Tender[] => {
        return tenders.filter(t => {
            const dateStr = dateType === 'publish' ? t.publish_date : t.deadline_date
            if (!dateStr) return false

            const targetDate = new Date(dateStr)
            return (
                targetDate.getDate() === day &&
                targetDate.getMonth() === m &&
                targetDate.getFullYear() === y
            )
        })
    }, [tenders, dateType])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 border-[1.5px] border-black dark:border-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#FA4028]" />
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-40">
                        LOADING_ALL_TENDERS // {totalCount}_RECORDS
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-4">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black font-mono tracking-tighter">
                        {MONTH_NAMES[month]} {year}
                    </h3>
                    <p className="text-[10px] font-mono font-bold opacity-40 uppercase tracking-[0.2em]">
                        TENDER_TIMELINE // {dateType === 'publish' ? 'PUBLICATION_MAP' : 'DEADLINE_MAP'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevMonth}
                        className="h-10 w-10 rounded-none border-black dark:border-white hover:bg-[#FA4028] hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-10 w-10 rounded-none border-black dark:border-white hover:bg-[#FA4028] hover:text-white transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-x border-t border-black dark:border-white">
                {/* Weekday Headers */}
                {WEEKDAYS.map(day => (
                    <div
                        key={day}
                        className="p-3 text-[10px] font-black font-mono text-center border-b border-r border-black dark:border-white last:border-r-0 bg-black/5 dark:bg-white/5"
                    >
                        {day}
                    </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((date, idx) => {
                    const dayTenders = getTendersForDay(date.day, date.month, date.year)
                    const activeToday = isToday(date.day, date.month, date.year)

                    return (
                        <div
                            key={idx}
                            onClick={() => onDayClick?.(new Date(date.year, date.month, date.day))}
                            className={cn(
                                "min-h-[120px] p-2 border-b border-r border-black dark:border-white last:border-r-0 relative group transition-colors cursor-pointer",
                                !date.isCurrentMonth && "opacity-20 bg-black/5 dark:bg-white/5",
                                activeToday && "bg-[#285AFA]/10 ring-1 ring-[#285AFA] ring-inset z-10",
                                "hover:bg-[#285AFA]/10"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] font-black font-mono",
                                activeToday ? "text-[#285AFA]" : "text-black dark:text-white"
                            )}>
                                {String(date.day).padStart(2, '0')}
                                {activeToday && (
                                    <span className="ml-2 px-1 bg-[#285AFA] text-white text-[8px] font-black tracking-tighter">
                                        TODAY
                                    </span>
                                )}
                            </span>

                            <div className="space-y-1 mt-1">
                                {dayTenders.map(tender => (
                                    <div
                                        key={tender.id}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(tender.url, '_blank')
                                        }}
                                        className="text-[9px] font-mono font-black p-1 bg-black text-white dark:bg-white dark:text-black uppercase truncate border-l-2 border-[#FA4028] hover:bg-[#FA4028] hover:text-white transition-colors cursor-pointer"
                                        title={tender.title}
                                    >
                                        {tender.title}
                                    </div>
                                ))}
                            </div>

                            {(idx + 1) % 7 === 0 && idx !== 41 && (
                                <div className="absolute top-0 right-0 h-full w-[1px] bg-black dark:bg-white translate-x-[1px]" />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 opacity-40">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    // CHANNEL: TENDER_HUB // ACCESS_GRANTED
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    {dateType === 'publish' ? 'PUBLISH_CYCLE' : 'DEADLINE_CYCLE'}: {month + 1}.{year}
                </div>
            </div>
        </div>
    )
}
