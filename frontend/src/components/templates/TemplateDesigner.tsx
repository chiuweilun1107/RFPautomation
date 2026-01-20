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
import { templatesApi } from "@/features/templates/api/templatesApi"



interface TemplateDesignerProps {
  template: Template
}

export function TemplateDesigner({ template: initialTemplate }: TemplateDesignerProps) {
  const router = useRouter()
  const [template, setTemplate] = React.useState(initialTemplate)
  const [viewMode, setViewMode] = React.useState<'design' | 'preview'>('design')
  const [selectedComponent, setSelectedComponent] = React.useState<TemplateComponent | null>(null)
  const [showSaveDialog, setShowSaveDialog] = React.useState(false)
  const [showSaveAsDialog, setShowSaveAsDialog] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [deletedComponents, setDeletedComponents] = React.useState<string[]>([])
  const [isLibraryCollapsed, setIsLibraryCollapsed] = React.useState(false)
  const lastHighlightedElementRef = React.useRef<HTMLElement | null>(null)

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
      // 直接調用 Supabase 更新 paragraphs 和 parsed_tables
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('templates')
        .update({
          paragraphs: template.paragraphs,
          parsed_tables: template.parsed_tables,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)

      if (error) {
        throw error
      }

      toast.success('範本已更新')
      setShowSaveDialog(false)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Update error:', error)
      toast.error('更新失敗')
    }
  }

  const handleSaveAsNew = async (newTemplate: Partial<Template>) => {
    try {
      const result = await templatesApi.saveAs(template.id, {
        name: newTemplate.name!,
        description: newTemplate.description,
        category: newTemplate.category as string | undefined,
        folder_id: newTemplate.folder_id,
      });

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
    // 1. 移除上一個元素的高亮
    if (lastHighlightedElementRef.current) {
      lastHighlightedElementRef.current.classList.remove('ring-2', 'ring-[#FA4028]', 'ring-offset-2')
    }

    // 2. 找到新元素並添加高亮
    const componentId = `${type}-${id}` // 例如: paragraph-0, table-1

    setTimeout(() => {
      const element = document.getElementById(componentId)
      if (element) {
        // 添加高亮效果（一直維持）
        element.classList.add('ring-2', 'ring-[#FA4028]', 'ring-offset-2')
        // 儲存到 ref
        lastHighlightedElementRef.current = element
        // 滾動到元素位置
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        console.warn('Element not found:', componentId)
      }
    }, 100)

    // 3. 設定選取狀態（用於右側屬性面板）
    if (type === 'paragraph') {
      const targetPara = template.paragraphs?.find(p => p.index === id)
      if (targetPara) {
        setSelectedComponent({
          id: componentId,
          type: 'paragraph',
          data: targetPara
        })
      }
    } else if (type === 'table') {
      const targetTable = template.parsed_tables?.find(t => t.index === id)
      if (targetTable) {
        setSelectedComponent({
          id: componentId,
          type: 'table',
          data: targetTable
        })
      }
    }
  }

  return (
    <>
      {/* Header */}
      {/* Main Container - Separated Panels Layout */}
      <div className="flex h-screen bg-transparent p-6 gap-6 overflow-hidden font-sans">

        {/* Left Block - Component Library - Swiss Bordered Card */}
        <aside className={`transition-all duration-300 ease-in-out ${isLibraryCollapsed ? 'w-[60px]' : 'w-[280px]'} relative z-10 group/sidebar border-2 border-black dark:border-white bg-background`}>
          <div className={`h-full w-full flex flex-col overflow-hidden transition-all duration-300`}>
            <ComponentLibraryPanel
              template={template}
              onDragStart={() => { }}
              onComponentClick={handleComponentClick}
              isCollapsed={isLibraryCollapsed}
              onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
            />
          </div>
        </aside>

        {/* Right Block - Main Content (Header + Canvas) - Swiss Bordered Card */}
        <main className="flex-1 bg-background flex flex-col overflow-hidden relative z-0 border-2 border-black dark:border-white">

          {/* Internal Header - Swiss Bordered */}
          <header className="h-14 flex items-center justify-between px-6 border-b-2 border-black dark:border-white shrink-0 bg-background">
            <div className="flex items-center gap-3">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mb-1 font-mono">
                  [ DRAFTING ]
                </span>
                <h1 className="text-lg font-bold text-foreground font-mono leading-none tracking-tighter uppercase">
                  {template.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Action Buttons - Swiss Sharp */}
              <div className="flex items-center gap-0 border-2 border-black dark:border-white">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="rounded-none h-9 px-4 font-mono text-xs hover:bg-muted text-muted-foreground hover:text-foreground border-r-2 border-black dark:border-white last:border-r-0"
                >
                  [ CANCEL ]
                </Button>

                <Button
                  onClick={handleSave}
                  className="rounded-none h-9 px-6 font-mono text-xs bg-foreground text-background hover:bg-muted-foreground hover:text-white"
                  disabled={!hasUnsavedChanges}
                >
                  [ SAVE ]
                </Button>
              </div>
            </div>
          </header>

          {/* Editor Canvas Container */}
          <div className="flex-1 relative overflow-hidden bg-muted/20">
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
            onComponentUpdate={(updatedComponent) => {
              // 更新 template 中對應的段落或表格資料
              if (updatedComponent.type === 'paragraph') {
                setTemplate(prev => ({
                  ...prev,
                  paragraphs: prev.paragraphs?.map(p =>
                    p.index === updatedComponent.data.index ? updatedComponent.data : p
                  )
                }))
              } else if (updatedComponent.type === 'table') {
                setTemplate(prev => ({
                  ...prev,
                  parsed_tables: prev.parsed_tables?.map(t =>
                    t.index === updatedComponent.data.index ? updatedComponent.data : t
                  )
                }))
              }
              // 同步更新 selectedComponent
              setSelectedComponent(updatedComponent)
              setHasUnsavedChanges(true)
            }}
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