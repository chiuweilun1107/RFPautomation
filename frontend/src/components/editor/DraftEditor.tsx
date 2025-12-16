"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Save, Loader2, Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { marked } from 'marked'

// 檢測內容是否為 Markdown（包含 markdown 語法）
function isMarkdown(content: string): boolean {
    if (!content) return false
    // 檢測常見的 markdown 語法
    const markdownPatterns = [
        /^#{1,6}\s/m,           // 標題 # ## ###
        /\*\*[^*]+\*\*/,        // 粗體 **text**
        /\*[^*]+\*/,            // 斜體 *text*
        /^\s*[-*+]\s/m,         // 無序列表
        /^\s*\d+\.\s/m,         // 有序列表
        /^\s*>\s/m,             // 引用
        /\[.+\]\(.+\)/,         // 連結 [text](url)
    ]
    return markdownPatterns.some(pattern => pattern.test(content))
}

// 將 Markdown 轉換為 HTML
function markdownToHtml(content: string): string {
    if (!content) return ''
    if (isMarkdown(content)) {
        return marked.parse(content, { async: false }) as string
    }
    return content
}

interface DraftEditorProps {
    sectionId: string
    initialContent: string
    onSave?: (content: string) => void
}

export function DraftEditor({ sectionId, initialContent, onSave }: DraftEditorProps) {
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    // 將 Markdown 轉換為 HTML
    const htmlContent = useMemo(() => markdownToHtml(initialContent), [initialContent])

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: '開始撰寫草稿內容...',
            }),
        ],
        content: htmlContent,
        immediatelyRender: false, // 避免 SSR hydration 錯誤
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
            },
        },
    })

    useEffect(() => {
        if (editor && htmlContent !== editor.getHTML()) {
            editor.commands.setContent(htmlContent)
        }
    }, [htmlContent, editor])

    const handleSave = async () => {
        if (!editor) return
        
        setSaving(true)
        const content = editor.getHTML()
        
        try {
            const { error } = await supabase
                .from('sections')
                .update({ content_draft: content })
                .eq('id', sectionId)

            if (error) throw error
            
            toast.success('草稿已儲存')
            onSave?.(content)
        } catch (error) {
            console.error('Save failed:', error)
            toast.error('儲存失敗')
        } finally {
            setSaving(false)
        }
    }

    if (!editor) return null

    return (
        <div className="border rounded-lg bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-zinc-800">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-zinc-700' : ''}
                >
                    <Bold className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-zinc-700' : ''}
                >
                    <Italic className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-zinc-700' : ''}
                >
                    <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-zinc-700' : ''}
                >
                    <List className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-zinc-700' : ''}
                >
                    <ListOrdered className="w-4 h-4" />
                </Button>
                <div className="flex-1" />
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    儲存
                </Button>
            </div>
            
            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    )
}

