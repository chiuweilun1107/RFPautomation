'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MoreVertical,
    Trash2,
    ExternalLink,
    Loader2,
    Clock,
    Calendar,
    LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '../hooks/useProjects';

interface ProjectListViewProps {
    projects: Project[];
    onDelete: (project: Project) => void;
    onEdit: (project: Project) => void;
}

// Helper to parse dates (copied from ProjectCard for consistency)
const parseFlexibleDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return "PENDING";
    const stdDate = new Date(dateStr);
    if (!isNaN(stdDate.getTime())) return stdDate.toLocaleDateString();
    const rocMatch = dateStr.match(/(\d{2,3})年(\d{1,2})月(\d{1,2})日/);
    if (rocMatch) {
        const year = parseInt(rocMatch[1]) + 1911;
        const month = parseInt(rocMatch[2]);
        const day = parseInt(rocMatch[3]);
        return new Date(year, month - 1, day).toLocaleDateString();
    }
    return dateStr;
};

export function ProjectListView({ projects, onDelete, onEdit }: ProjectListViewProps) {
    const router = useRouter();

    return (
        <div className="border-[1.5px] border-black dark:border-white bg-white dark:bg-black overflow-hidden rounded-none">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[100px_1fr_180px_130px_150px_60px] gap-4 p-4 bg-muted border-b border-black dark:border-white text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic">
                <div>Status</div>
                <div>Project_Title</div>
                <div>Agency_Entity</div>
                <div>Deadline</div>
                <div>Time_Metrics</div>
                <div className="text-right">Ops</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-black/10 dark:divide-white/10">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => router.push(`/dashboard/${project.id}`)}
                        className="grid grid-cols-1 md:grid-cols-[100px_1fr_180px_130px_150px_60px] gap-4 p-4 items-center hover:bg-[#FA4028]/5 transition-colors cursor-pointer group"
                    >
                        {/* Status */}
                        <div className="flex justify-start">
                            <Badge
                                className={`
                                    rounded-none border-black dark:border-white font-mono text-[9px] uppercase font-black px-2 py-0.5
                                    ${project.status === 'processing' ? 'bg-amber-400 text-black' : ''}
                                    ${project.status === 'active' ? 'bg-emerald-500 text-white' : ''}
                                    ${project.status === 'completed' ? 'bg-blue-600 text-white' : ''}
                                    ${!['processing', 'active', 'completed'].includes(project.status) ? 'bg-white text-black' : ''}
                                `}
                            >
                                {project.status === 'processing' && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin inline-block" />}
                                {project.status.toUpperCase()}
                            </Badge>
                        </div>

                        {/* Title */}
                        <div className="min-w-0">
                            <h3 className="font-mono text-sm font-black uppercase tracking-tight group-hover:text-[#FA4028] transition-colors truncate">
                                {project.title}
                            </h3>
                        </div>

                        {/* Agency */}
                        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-black/60 dark:text-white/60">
                            <LayoutGrid className="h-3 w-3 text-[#FA4028]" />
                            <span className="truncate" title={project.agency}>
                                {project.agency || "UNDEFINED_DATA"}
                            </span>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center gap-2 text-[11px] font-bold font-mono text-black/60 dark:text-white/60">
                            <Calendar className="h-3 w-3 text-[#FA4028]" />
                            <span>
                                {parseFlexibleDate(project.deadline) !== "PENDING"
                                    ? parseFlexibleDate(project.deadline)
                                    : "PENDING_STAMP"}
                            </span>
                        </div>

                        {/* Time Metrics */}
                        <div className="flex flex-col gap-1 text-[9px] font-mono font-bold uppercase opacity-40 italic">
                            <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Upd: {new Date(project.updated_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Cre: {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pr-1">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-none border-black dark:border-white font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/${project.id}`} className="w-full">OPEN_PROJECT</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                                        EDIT_INFO
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-white focus:bg-red-600 rounded-none cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(project);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        DELETE
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
