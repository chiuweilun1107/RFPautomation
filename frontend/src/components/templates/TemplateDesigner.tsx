"use client"

import * as React from "react"
import type { Template, TemplateComponent } from "@/types"
import { ArrowLeft, Save, Eye, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComponentLibraryPanel } from "./ComponentLibraryPanel"
import { EditorCanvas } from "./EditorCanvas"
import { PropertyPanel } from "./PropertyPanel"
import { SaveDialog } from "./SaveDialog"
import { SaveAsDialog } from "./SaveAsDialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"



interface TemplateDesignerProps {
  template: Template
}

export function TemplateDesigner({ template }: TemplateDesignerProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = React.useState<'design' | 'preview'>('design')
  const [selectedComponent, setSelectedComponent] = React.useState<TemplateComponent | null>(null)
  const [showSaveDialog, setShowSaveDialog] = React.useState(false)
  const [showSaveAsDialog, setShowSaveAsDialog] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [deletedComponents, setDeletedComponents] = React.useState<string[]>([])
  const [isLibraryCollapsed, setIsLibraryCollapsed] = React.useState(false)

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('您有未儲存的變更，確定要離開嗎？')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  const handleSave = () => {
    setShowSaveDialog(true)
  }

  const handleSaveAs = () => {
    setShowSaveAsDialog(true)
  }

  const handleUpdateOriginal = async (designConfig: Template['design_config']) => {
    try {
      const response = await fetch('/api/templates/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          design_config: designConfig
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('範本已更新')
        setShowSaveDialog(false)
        setHasUnsavedChanges(false)
      } else {
        toast.error(result.error || '更新失敗')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('更新失敗')
    }
  }

  const handleSaveAsNew = async (newTemplate: Partial<Template>) => {
    try {
      const response = await fetch('/api/templates/save-as', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          name: newTemplate.name,
          description: newTemplate.description,
          category: newTemplate.category,
          folder_id: newTemplate.folder_id
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('已另存為新範本')
        setShowSaveAsDialog(false)
        setHasUnsavedChanges(false)
        // 重新導向到範本列表頁面
        router.push('/dashboard/templates')
        router.refresh()
      } else {
        toast.error(result.error || '另存失敗')
      }
    } catch (error) {
      console.error('Save as new error:', error)
      toast.error('另存失敗')
    }
  }

  const handleComponentClick = (id: number, type: string) => {
    // 1. 設定選取狀態
    if (type === 'paragraph') {
      const targetPara = template.paragraphs?.find(p => p.index === id)
      if (targetPara) {
        setSelectedComponent({
          id: String(id),
          type: 'paragraph',
          data: targetPara
        })
      }
    } else if (type === 'table') {
      const targetTable = template.parsed_tables?.find(t => t.index === id)
      if (targetTable) {
        setSelectedComponent({
          id: String(id),
          type: 'table',
          data: targetTable
        })
      }
    }

    // 2. 捲動到目標位置
    setTimeout(() => {
      const elementId = `${type}-${id}` // 例如: paragraph-0, table-1
      const element = document.getElementById(elementId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // 添加短暫的高亮效果
        element.classList.add('ring-2', 'ring-[#FA4028]', 'ring-offset-2')
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[#FA4028]', 'ring-offset-2')
        }, 1500)
      } else {
        console.warn('Element not found:', elementId)
      }
    }, 100)
  }

  return (
    <>
      {/* Header */}
      {/* Main Container - Two Block Layout */}
      <div className="flex h-screen bg-[#F2F3F5] dark:bg-black p-4 gap-4 overflow-hidden">

        {/* Left Block - Component Library */}
        <aside className={`transition-all duration-300 ease-in-out ${isLibraryCollapsed ? 'w-0' : 'w-[280px]'} relative z-10 group/sidebar`}>
          <div className={`h-full w-[280px] bg-white dark:bg-gray-900 rounded-2xl shadow-sm flex flex-col overflow-hidden border border-transparent dark:border-white/10 transition-all duration-300 ${isLibraryCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
            <ComponentLibraryPanel
              template={template}
              onDragStart={() => { }}
              onComponentClick={handleComponentClick}
              isCollapsed={isLibraryCollapsed}
              onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
            />
          </div>

          {/* Floating Toggle Button when collapsed - Matches ProjectWorkspaceLayout */}
          {isLibraryCollapsed && (
            <button
              onClick={() => setIsLibraryCollapsed(false)}
              className="absolute left-0 top-6 z-50 p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-400 hover:text-blue-600 group flex flex-col items-center gap-1"
              style={{ transform: 'translateX(-50%)' }}
              title="展開側邊欄"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </aside>



        {/* Right Block - Main Content (Header + Canvas) */}
        <main className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-sm flex flex-col overflow-hidden relative z-0 border border-transparent dark:border-white/10">

          {/* Internal Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-gray-100 dark:border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider leading-none mb-1">
                  Drafting
                </span>
                <h1 className="text-lg font-bold text-[#00063D] dark:text-white font-serif leading-none">
                  {template.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  取消
                </Button>

                <Button
                  onClick={handleSave}
                  className="bg-[#00063D] hover:bg-[#00063D]/90 text-white shadow-md h-9 px-6 rounded-lg font-medium"
                  disabled={!hasUnsavedChanges}
                >
                  儲存
                </Button>
              </div>
            </div>
          </header>

          {/* Editor Canvas Container - The "Paper on Desk" Area */}
          <div className="flex-1 relative overflow-hidden bg-gray-50/50 dark:bg-transparent">
            <EditorCanvas
              template={template}
              selectedComponent={selectedComponent}
              deletedComponents={deletedComponents}
              onSelectComponent={setSelectedComponent}
              onComponentChange={() => setHasUnsavedChanges(true)}
            />
          </div>
        </main>

        {/* Floating Property Panel - Absolute Overlay */}
        {selectedComponent && (
          <PropertyPanel
            component={selectedComponent}
            template={template}
            onComponentUpdate={() => setHasUnsavedChanges(true)}
            onClose={() => setSelectedComponent(null)}
          />
        )}
      </div>

      {/* Save Dialog */}
      <SaveDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        template={template}
        onUpdateOriginal={handleUpdateOriginal}
        onSaveAsNew={handleSaveAs}
      />

      {/* Save As Dialog */}
      <SaveAsDialog
        open={showSaveAsDialog}
        onOpenChange={setShowSaveAsDialog}
        template={template}
        onSave={handleSaveAsNew}
      />
    </>
  )
}