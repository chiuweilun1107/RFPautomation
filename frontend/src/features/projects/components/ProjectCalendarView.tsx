'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Project } from '../hooks/useProjects';
import { Button } from '@/components/ui/button';

interface ProjectCalendarViewProps {
    projects: Project[];
    onDayClick?: (date: Date) => void;
}

// Helper to parse dates (copied from ProjectListView for consistency)
const parseFlexibleDate = (dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;
    const stdDate = new Date(dateStr);
    if (!isNaN(stdDate.getTime())) return stdDate;
    const rocMatch = dateStr.match(/(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
    if (rocMatch) {
        const year = parseInt(rocMatch[1]) + 1911;
        const month = parseInt(rocMatch[2]);
        const day = parseInt(rocMatch[3]);
        return new Date(year, month - 1, day);
    }
    return null;
};

export function ProjectCalendarView({ projects, onDayClick }: ProjectCalendarViewProps) {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const router = useRouter();

    // Calendar logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get days from previous month to fill the first row
    // Adjust so Monday is the first day of the week (0=Sun, 1=Mon... -> 0=Mon, 6=Sun)
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

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const isToday = (d: number, m: number, y: number) => {
        const today = new Date();
        return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    };

    // Helper to check if a project has a deadline on a specific day
    const getProjectsForDay = (d: number, m: number, y: number) => {
        return projects.filter(p => {
            const deadlineDate = parseFlexibleDate(p.deadline);
            if (!deadlineDate) return false;
            return (
                deadlineDate.getDate() === d &&
                deadlineDate.getMonth() === m &&
                deadlineDate.getFullYear() === y
            );
        });
    };

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-4">
                <div className="flex flex-col">
                    <h3 className="text-2xl font-black font-mono tracking-tighter">
                        {monthNames[month]} {year}
                    </h3>
                    <p className="text-[10px] font-mono font-bold opacity-40 uppercase tracking-[0.2em]">
                        CALENDAR_VIEW // SCHEDULE_INDEX
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

            {/* Weekdays */}
            <div className="grid grid-cols-7 border-x border-t border-black dark:border-white">
                {weekdays.map(day => (
                    <div
                        key={day}
                        className="p-3 text-[10px] font-black font-mono text-center border-b border-r border-black dark:border-white last:border-r-0 bg-black/5 dark:bg-white/5"
                    >
                        {day}
                    </div>
                ))}

                {/* Calendar Grid */}
                {calendarDays.map((date, idx) => {
                    const dayProjects = getProjectsForDay(date.day, date.month, date.year);
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
                                {dayProjects.map(project => (
                                    <div
                                        key={project.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/${project.id}`);
                                        }}
                                        className="text-[9px] font-mono font-black p-1 bg-black text-white dark:bg-white dark:text-black uppercase truncate border-l-2 border-[#FA4028] hover:bg-[#FA4028] hover:text-white transition-colors cursor-pointer"
                                        title={project.title}
                                    >
                                        {project.title}
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

            {/* Calendar Footer Info */}
            <div className="flex items-center justify-between pt-4 opacity-40">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest">
          // STATUS: SYSTEM_IDLE // ACCESS_GRANTED
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest">
                    VIEWING_CYCLE: {month + 1}.{year}
                </div>
            </div>
        </div>
    );
}
