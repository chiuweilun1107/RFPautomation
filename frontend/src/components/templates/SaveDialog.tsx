"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Save, CopyPlus } from "lucide-react"
import { BaseDialog } from "@/components/common"

interface Template {
  id: string
  name: string
}

interface SaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template
  onUpdateOriginal: (designConfig: any) => void
  onSaveAsNew: () => void
}

export function SaveDialog({
  open,
  onOpenChange,
  template,
  onUpdateOriginal,
  onSaveAsNew
}: SaveDialogProps) {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="儲存設計"
      description="選擇儲存方式"
      showFooter={true}
      footer={
        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          取消
        </Button>
      }
    >
      <div className="space-y-4">
        {/* 更新原範本 */}
        <Button
          variant="outline"
          className="w-full h-20 flex flex-col items-start gap-3"
          onClick={() => {
            onUpdateOriginal({})
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-[#00063D] dark:text-white">
                💾 更新原範本
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                直接修改「{template.name}」
              </div>
            </div>
          </div>
        </Button>

        {/* 另存新範本 */}
        <Button
          variant="outline"
          className="w-full h-20 flex flex-col items-start gap-3"
          onClick={onSaveAsNew}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CopyPlus className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-[#00063D] dark:text-white">
                📄 另存新範本
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                基於當前設計創建新範本
              </div>
            </div>
          </div>
        </Button>
      </div>
    </BaseDialog>
  )
}