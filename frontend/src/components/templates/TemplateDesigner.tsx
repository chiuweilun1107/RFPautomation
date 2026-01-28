"use client"

import * as React from "react"
import type { Template, TemplateComponent } from "@/types"
import { ArrowLeft, Save, Eye, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComponentLibraryPanel } from "./ComponentLibraryPanel"
import { EditorCanvas } from "./EditorCanvas"
import { PropertyPanel } from "./PropertyPanel"
import { OnlyOfficeEditorWithUpload } from "./OnlyOfficeEditorWithUpload"
import { cn } from "@/lib/utils"
import { SaveDialog } from "./SaveDialog"
import { SaveAsDialog } from "./SaveAsDialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { templatesApi } from "@/features/templates/api/templatesApi"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { logger } from "@/lib/errors/logger"



interface TemplateDesignerProps {
  template: Template
}

export function TemplateDesigner({ template: initialTemplate }: TemplateDesignerProps) {
  const router = useRouter()
  const { handleError, handleDbError, handleApiError } = useErrorHandler()
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

  const handleSave = async () => {
    try {
      logger.info('User triggered save', 'TemplateDesigner', { templateId: template.id });

      // 檢查是否使用 localhost
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        toast.info('💡 保存提示', {
          description: '請在編輯器中按 Ctrl+S (或 Cmd+S) 保存文檔。開發環境需要使用 ngrok 才能自動保存，詳見 ONLYOFFICE_SETUP.md',
          duration: 5000,
        });
      } else {
        toast.success('請在編輯器中按 Ctrl+S (或 Cmd+S) 保存文檔');
      }

    } catch (error) {
      handleError(error, {
        context: 'TemplateSave',
        userMessage: '保存失敗，請重試',
        metadata: { templateId: template.id }
      });
    }
  }

  const handleSaveAs = () => {
    setShowSaveAsDialog(true)
  }

  const handleUpdateOriginal = async (designConfig: Template['design_config']) => {
    try {
      // 直接調用 Supabase 更新 paragraphs、parsed_tables 和 semantic_mappings
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('templates')
        .update({
          paragraphs: template.paragraphs,
          parsed_tables: template.parsed_tables,
          semantic_mappings: template.semantic_mappings || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)

      if (error) {
        throw error
      }

      toast.success('範本已更新')
      setShowSaveDialog(false)
      setHasUnsavedChanges(false)

      logger.info('Template updated successfully', 'TemplateDesigner', {
        templateId: template.id,
        paragraphsCount: template.paragraphs?.length || 0,
        tablesCount: template.parsed_tables?.length || 0
      });
    } catch (error) {
      handleDbError(error, 'UpdateTemplate', {
        userMessage: '更新失敗，請重試',
        metadata: { templateId: template.id }
      });
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

        logger.info('Template saved as new', 'TemplateDesigner', {
          originalTemplateId: template.id,
          newTemplateName: newTemplate.name
        });

        // 重新導向到範本列表頁面
        router.push('/dashboard/templates')
        router.refresh()
      } else {
        throw new Error(result.error || '另存失敗')
      }
    } catch (error) {
      handleApiError(error, 'SaveAsNewTemplate', {
        userMessage: '另存失敗，請重試',
        metadata: {
          templateId: template.id,
          newTemplateName: newTemplate.name
        }
      });
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
      {/* Full Screen ONLYOFFICE Editor */}
      <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">

        {/* Header - Swiss Bordered */}
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
              >
                [ SAVE ]
              </Button>
            </div>
          </div>
        </header>

        {/* ONLYOFFICE Editor - Full Height */}
        <div className="flex-1 relative overflow-hidden bg-white">
          <OnlyOfficeEditorWithUpload
            template={template}
            onDocumentReady={() => {
              console.log('ONLYOFFICE 文檔已就緒');
            }}
            onError={(error) => {
              console.error('ONLYOFFICE 錯誤:', error);
              toast.error(error);
            }}
          />
        </div>
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