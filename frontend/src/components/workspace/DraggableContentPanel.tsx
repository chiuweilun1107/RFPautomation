"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2, Minimize2, GripHorizontal, FileText, Copy, Check, Edit3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DraggableContentPanelProps {
    taskId: string;
    taskText: string;
    content: string;
    wordCount?: number;
    sectionTitle?: string;
    contentId?: string;
    onClose: () => void;
    onContentUpdate?: (newContent: string, newWordCount: number) => void;
    initialPosition?: { x: number; y: number };
}

export function DraggableContentPanel({
    taskId,
    taskText,
    content,
    wordCount = 0,
    sectionTitle = "",
    contentId,
    onClose,
    onContentUpdate,
    initialPosition = { x: 100, y: 100 }
}: DraggableContentPanelProps) {
    const supabase = createClient();
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content);
    const [isSaving, setIsSaving] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Update editedContent when content prop changes
    useEffect(() => {
        setEditedContent(content);
    }, [content]);

    // Handle drag start
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMaximized || isEditing) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    // Handle dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
                y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y))
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Copy content to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(isEditing ? editedContent : content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Toggle maximize
    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
    };

    // Toggle edit mode
    const toggleEdit = () => {
        if (isEditing) {
            // Cancel editing - restore original content
            setEditedContent(content);
        }
        setIsEditing(!isEditing);
    };

    // Save edited content
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const newWordCount = editedContent.replace(/\s/g, '').length;

            // Update in database
            const { error } = await supabase
                .from('task_contents')
                .update({
                    content: editedContent,
                    word_count: newWordCount,
                    updated_at: new Date().toISOString()
                })
                .eq('task_id', taskId);

            if (error) throw error;

            // Notify parent to update state
            if (onContentUpdate) {
                onContentUpdate(editedContent, newWordCount);
            }

            toast.success('內容已儲存');
            setIsEditing(false);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('儲存失敗');
        } finally {
            setIsSaving(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const currentWordCount = isEditing
        ? editedContent.replace(/\s/g, '').length
        : wordCount;

    if (!mounted) return null;

    return createPortal(
        <div
            ref={panelRef}
            className={`fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${isMaximized
                ? 'inset-4'
                : 'w-[550px] max-h-[75vh]'
                }`}
            style={isMaximized ? {} : {
                left: position.x,
                top: position.y,
            }}
        >
            {/* Header - Draggable */}
            <div
                className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-t-xl ${!isMaximized && !isEditing ? 'cursor-move' : ''
                    }`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GripHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {isEditing ? '編輯內容' : '生成內容'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {sectionTitle} • {currentWordCount}字
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Edit/Save Button */}
                    {isEditing ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-gray-500 hover:text-gray-700 text-xs"
                                onClick={toggleEdit}
                                disabled={isSaving}
                            >
                                取消
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? '儲存中...' : '儲存'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-blue-600"
                                onClick={toggleEdit}
                                title="編輯內容"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700"
                                onClick={handleCopy}
                                title="複製內容"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-gray-700"
                                onClick={toggleMaximize}
                                title={isMaximized ? "還原" : "最大化"}
                            >
                                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-red-600"
                                onClick={onClose}
                                title="關閉"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Task Reference */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">撰寫指引：</span>
                    <span className="ml-1">{taskText.slice(0, 100)}{taskText.length > 100 ? '...' : ''}</span>
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {isEditing ? (
                    <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[300px] w-full resize-none text-sm leading-relaxed"
                        placeholder="編輯生成內容..."
                    />
                ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                ol: ({ node, ...props }) => <ol className="list-decimal ml-6" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc ml-6" {...props} />,
                                li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 rounded-b-xl">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>任務 ID: {taskId.slice(0, 8)}...</span>
                    <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${isEditing ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                        {isEditing ? '編輯中' : '已生成'}
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
}
