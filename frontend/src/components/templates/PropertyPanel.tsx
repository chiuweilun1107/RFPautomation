"use client"

import * as React from "react"
import { Settings, Trash2, Type, Table as TableIcon, Layers, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { extractVariables } from "./VariableRenderer"
import { toast } from "sonner"
import { getStyleNameCN } from "./styleUtils"
import Draggable from 'react-draggable'

interface PropertyPanelProps {
  component: any
  template: any
  onComponentUpdate: (updatedComponent: any) => void
  onComponentDelete?: (componentId: string) => void
  onClose?: () => void
}

export function PropertyPanel({ component, template, onComponentUpdate, onComponentDelete, onClose }: PropertyPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)

  const [localComponent, setLocalComponent] = React.useState(component)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  React.useEffect(() => {
    setLocalComponent(component)
  }, [component])

  if (!component || !localComponent) return null;

  const getComponentIcon = () => {
    switch (component.type) {
      case 'paragraph':
        return <Type className="w-5 h-5 text-white" />
      case 'table':
        return <TableIcon className="w-5 h-5 text-white" />
      case 'section':
        return <Layers className="w-5 h-5 text-white" />
      default:
        return <Settings className="w-5 h-5 text-white" />
    }
  }

  const getComponentTypeLabel = () => {
    switch (component.type) {
      case 'paragraph':
        return '段落'
      case 'table':
        return '表格'
      case 'section':
        return '區塊'
      default:
        return '元件'
    }
  }

  const handlePropertyChange = (key: string, value: any) => {
    const updatedComponent = {
      ...localComponent,
      data: {
        ...localComponent.data,
        [key]: value
      }
    }
    setLocalComponent(updatedComponent)
    onComponentUpdate(updatedComponent)
  }

  const handleDelete = async () => {
    try {
      setShowDeleteConfirm(false)
      if (onComponentDelete) {
        onComponentDelete(component.id)
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("刪除失敗")
    }
  }

  // 提取變數
  const variables = component.data?.text
    ? extractVariables(component.data.text)
    : []

  return (
    <Draggable
      nodeRef={panelRef}
      handle=".drag-handle"
      defaultPosition={{ x: window.innerWidth - 380, y: 100 }}
      bounds="body"
    >
      <div
        ref={panelRef}
        className="fixed z-50 flex flex-col w-[340px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10"
        style={{ left: 0, top: 0 }}
      >
        {/* Header - Draggable Handle */}
        <div
          className="drag-handle p-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/5 cursor-move active:cursor-grabbing select-none bg-white dark:bg-gray-900 rounded-t-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md shrink-0">
              {getComponentIcon()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#00063D] dark:text-white leading-none mb-1">
                {getComponentTypeLabel()}
              </h2>
              <div className="text-[10px] text-gray-400 font-mono">ID: {component.id}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Properties - Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">

          {/* Paragraph Properties */}
          {component.type === 'paragraph' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Paragraph Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">Style</Label>
                  <div className="relative">
                    <select
                      value={localComponent?.data?.style || ''}
                      onChange={(e) => handlePropertyChange('style', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                    >
                      <option value="">Normal Text</option>
                      {Array.isArray(template.styles) && template.styles.map((style: any) => (
                        <option key={style.id} value={style.name || style.id}>
                          {getStyleNameCN(style.name)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">Alignment</Label>
                  <div className="flex bg-gray-50 dark:bg-black p-1 rounded-lg border border-gray-200 dark:border-white/10">
                    {['left', 'center', 'right', 'both'].map((align) => (
                      <button
                        key={align}
                        onClick={() => handlePropertyChange('format', { ...(localComponent.data?.format || {}), alignment: align })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${(localComponent.data?.format?.alignment || 'left') === align
                          ? 'bg-white shadow-sm text-blue-600'
                          : 'text-gray-400 hover:text-gray-600'
                          }`}
                      >
                        {align === 'both' ? 'Justify' : align.charAt(0).toUpperCase() + align.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">Font Family</Label>
                  <select
                    value={localComponent?.data?.format?.font_name || ''}
                    onChange={(e) => handlePropertyChange('format', { ...(localComponent.data?.format || {}), font_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Default</option>
                    <option value="標楷體">標楷體 (BiauKai)</option>
                    <option value="新細明體">新細明體 (PMingLiU)</option>
                    <option value="微軟正黑體">微軟正黑體 (Microsoft JhengHei)</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">Font Size (pt)</Label>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={localComponent?.data?.format?.font_size || ''}
                    onChange={(e) => handlePropertyChange('format', { ...(localComponent.data?.format || {}), font_size: Number(e.target.value) })}
                    placeholder="Default"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">Text Style</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePropertyChange('format', { ...(localComponent.data?.format || {}), bold: !localComponent.data?.format?.bold })}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all border ${localComponent.data?.format?.bold
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-600'
                        }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => handlePropertyChange('format', { ...(localComponent.data?.format || {}), italic: !localComponent.data?.format?.italic })}
                      className={`flex-1 py-2 rounded-lg italic transition-all border ${localComponent.data?.format?.italic
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-600'
                        }`}
                    >
                      I
                    </button>
                    <button
                      onClick={() => handlePropertyChange('format', { ...(localComponent.data?.format || {}), underline: !localComponent.data?.format?.underline })}
                      className={`flex-1 py-2 rounded-lg underline transition-all border ${localComponent.data?.format?.underline
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 dark:bg-black border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-600'
                        }`}
                    >
                      U
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Properties */}
          {component.type === 'table' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Table Settings
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-100 dark:border-white/5 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {Array.isArray(localComponent.data?.rows) ? localComponent.data.rows.length : localComponent.data?.rows}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase">Rows</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-100 dark:border-white/5 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{localComponent.data?.cols}</div>
                  <div className="text-[10px] text-gray-400 uppercase">Columns</div>
                </div>
              </div>
            </div>
          )}

          {/* Variables */}
          {variables.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                Variables <span className="ml-1 text-gray-400 font-normal">({variables.length})</span>
              </h3>

              <div className="space-y-3">
                {variables.map((variable, idx) => (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                        {`{${variable}}`}
                      </span>
                    </div>
                    <Input
                      placeholder="Set default value..."
                      className="text-sm h-9 bg-gray-50 dark:bg-black border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 flex items-center justify-center z-50 rounded-xl backdrop-blur-sm animate-in fade-in duration-200">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Delete Component?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 px-4">
                This action cannot be undone. Are you sure?
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white h-8"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  )
}