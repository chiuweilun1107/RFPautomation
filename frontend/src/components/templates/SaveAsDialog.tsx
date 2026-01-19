"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BaseDialog } from "@/components/common"

interface Template {
  id: string
  name: string
  description?: string | null
  category?: string | null
  folder_id?: string | null
}

interface SaveAsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: Template
  onSave: (newTemplate: any) => void
}

export function SaveAsDialog({
  open,
  onOpenChange,
  template,
  onSave
}: SaveAsDialogProps) {
  const [name, setName] = React.useState(`${template.name} - 複製`)
  const [description, setDescription] = React.useState(template.description || '')
  const [category, setCategory] = React.useState(template.category || '')

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      folder_id: template.folder_id
    })
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="另存新範本"
      description="輸入新範本的名稱和描述"
      confirmText="儲存"
      cancelText="取消"
      onConfirm={handleSave}
      disableConfirm={!name.trim()}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="template-name" className="font-bold">
            範本名稱 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：報價單範本 v2"
            className="font-medium"
          />
        </div>

        <div>
          <Label htmlFor="template-category" className="font-bold">
            分類
          </Label>
          <Input
            id="template-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例如：報價單"
            className="font-medium"
          />
        </div>

        <div>
          <Label htmlFor="template-description" className="font-bold">
            描述
          </Label>
          <Textarea
            id="template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述這個範本的用途..."
            rows={3}
            className="font-medium"
          />
        </div>
      </div>
    </BaseDialog>
  )
}