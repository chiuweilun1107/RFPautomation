"use client"

import * as React from "react"
import { CheckCircle2, Circle, Clock, ChevronRight, ChevronDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { TaskEditorSheet } from "./TaskEditorSheet"

// Types based on the schema
interface Task {
    id: string
    title?: string       // Added title
    description?: string // Added description
    requirement_text: string
    response_draft?: string
    status: string
    ai_confidence?: number
}

interface Section {
    id: string
    content: string // Title
    tasks: Task[]
    children?: Section[] // For nested sections
}

interface SectionListProps {
    sections: Section[]
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function SectionList({ sections }: SectionListProps) {
    const router = useRouter()
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    if (!sections || sections.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-zinc-800 m-8">
                <h3 className="mt-2 text-lg font-semibold">No Sections Found</h3>
                <p className="text-sm text-muted-foreground text-gray-500 max-w-sm mx-auto mt-2">
                    The document hasn't been parsed yet or didn't contain any recognizable sections.
                    If the status is still "processing", please wait.
                </p>
            </div>
        )
    }

    const handleEditTask = (task: Task) => {
        setSelectedTask(task)
        setIsSheetOpen(true)
    }

    const handleTaskUpdated = () => {
        router.refresh()
    }

    // Flatten sections if they have children for simpler table rendering
    // Or just render recursively? Let's keep it simple: Section -> Tasks.
    // We will render a Table.

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-zinc-900 hover:bg-gray-50">
                            <TableHead className="w-[35%]">Requirement</TableHead>
                            <TableHead className="w-[30%]">Draft Response</TableHead>
                            <TableHead className="w-[10%]">Status</TableHead>
                            <TableHead className="w-[10%]">Confidence</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sections.map((section) => (
                            <React.Fragment key={section.id}>
                                {/* Section Header */}
                                <TableRow className="bg-gray-50/50 dark:bg-zinc-900/50 hover:bg-gray-100/50">
                                    <TableCell colSpan={5} className="py-2">
                                        <div className="flex items-center font-semibold text-sm text-gray-900 dark:text-gray-100">
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            {section.content}
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Tasks */}
                                {section.tasks?.map((task) => (
                                    <TaskRow key={task.id} task={task} onEdit={() => handleEditTask(task)} />
                                ))}

                                {/* If section has emptiness */}
                                {(!section.tasks || section.tasks.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground italic text-xs">
                                            No tasks in this section
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <TaskEditorSheet
                task={selectedTask}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onTaskUpdated={handleTaskUpdated}
            />
        </div>
    )
}

function TaskRow({ task, onEdit }: { task: Task, onEdit: () => void }) {
    return (
        <TableRow className="group">
            <TableCell className="align-top py-4">
                <div className="flex flex-col space-y-1">
                    <span className="font-medium text-sm leading-tight text-gray-900 dark:text-gray-100">
                        {task.title || task.requirement_text || "Untitled Task"}
                    </span>
                    {task.description && (
                        <span className="text-xs text-muted-foreground text-gray-500 line-clamp-2 leading-relaxed">
                            {task.description}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell className="align-top py-4">
                {task.response_draft ? (
                    <DraftCell content={task.response_draft} />
                ) : (
                    <span className="text-xs text-gray-300 dark:text-zinc-700 italic px-2">
                        -
                    </span>
                )}
            </TableCell>
            <TableCell className="align-top py-4">
                <div className="flex items-center mt-0.5">
                    {task.status === 'approved' ? (
                        <div className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approved
                        </div>
                    ) : task.status === 'drafted' ? (
                        <div className="flex items-center text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Drafted
                        </div>
                    ) : task.status === 'pending' || task.status === 'todo' ? (
                        <div className="flex items-center text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full text-xs font-medium">
                            <Circle className="h-3.5 w-3.5 mr-1" />
                            Pending
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground capitalize">{task.status}</span>
                    )}
                </div>
            </TableCell>
            <TableCell className="align-top py-4">
                {task.ai_confidence && (
                    <div className="flex items-center mt-1">
                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden mr-2">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${task.ai_confidence * 100}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {(task.ai_confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                )}
            </TableCell>
            <TableCell className="align-top text-right py-4">
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit
                </Button>
            </TableCell>
        </TableRow>
    )
}

function DraftCell({ content }: { content: string }) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    return (
        <div
            className="flex flex-col space-y-1 group/draft cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center justify-between">
                <span className="flex items-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Generated
                </span>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover/draft:opacity-100 transition-opacity">
                    {isExpanded ? "Collapse" : "Expand"}
                </span>
            </div>
            <div
                className={`text-xs text-foreground/80 font-mono bg-gray-50 dark:bg-zinc-900/50 p-2 rounded border border-gray-100 dark:border-zinc-800 transition-all duration-200 ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-4"
                    }`}
            >
                {content}
            </div>
        </div>
    )
}
