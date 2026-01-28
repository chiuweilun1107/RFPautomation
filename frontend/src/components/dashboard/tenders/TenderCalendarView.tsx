"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type DateType = 'publish' | 'deadline';

interface TenderCalendarViewProps {
    tenders: any[];
    onDayClick?: (date: Date) => void;
    dateType?: DateType;
}

export function TenderCalendarView({ tenders, onDayClick, dateType = 'deadline' }: TenderCalendarViewProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());

    // Calendar logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday is the first day of the week
    const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const calendarDays = [];

    // Fill in previous month days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
        calendarDays.push({
            day: prevMonthLastDay - i,
            month: month - 1,
            year: year,
            isCurrentMonth: false,
        });
    }

    // Fill in current month days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({
            day: i,
            month: month,
            year: year,
            isCurrentMonth: true,
        });
    }

    // Fill in next month days
    const remainingCells = 42 - calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
        calendarDays.push({
            day: i,
            month: month + 1,
            year: year,
            isCurrentMonth: false,
        });
    }

    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const monthNames = [
        'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const isToday = (d: number, m: number, y: number) => {
        const today = new Date();
        return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    };

    const getTendersForDay = (d: number, m: number, y: number) => {
        return tenders.filter(t => {
            const dateStr = dateType === 'publish' ? t.publish_date : t.deadline_date;
            if (!dateStr) return false;

            // Handle both date formats: 'YYYY-MM-DD' and 'YYYY-MM-DD HH:mm:ss'
            const targetDate = new Date(dateStr);
            return (
                targetDate.getDate() === d &&
                targetDate.getMonth() === m &&
                targetDate.getFullYear() === y
            );
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-4">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black font-mono tracking-tighter">
                        {monthNames[month]} {year}
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

            <div className="grid grid-cols-7 border-x border-t border-black dark:border-white">
                {weekdays.map(day => (
                    <div
                        key={day}
                        className="p-3 text-[10px] font-black font-mono text-center border-b border-r border-black dark:border-white last:border-r-0 bg-black/5 dark:bg-white/5"
                    >
                        {day}
                    </div>
                ))}

                {calendarDays.map((date, idx) => {
                    const dayTenders = getTendersForDay(date.day, date.month, date.year);
                    const activeToday = isToday(date.day, date.month, date.year);

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

                            <div className="space-y-1">
                                {dayTenders.map(tender => (
                                    <div
                                        key={tender.id}
                                        onClick={() => window.open(tender.url, '_blank')}
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
                    );
                })}
            </div>

            <div className="flex items-center justify-between pt-4 opacity-40">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    // CHANNEL: TENDER_HUB // ACCESS_GRANTED
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    {dateType === 'publish' ? 'PUBLISH_CYCLE' : 'DEADLINE_CYCLE'}: {month + 1}.{year}
                </div>
            </div>
        </div>
    );
}
