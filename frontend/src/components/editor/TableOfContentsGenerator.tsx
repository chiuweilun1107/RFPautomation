"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Eye, FileText, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Template {
  id: string
  name: string
  description?: string
  category?: string
  paragraphs?: any[]
  parsed_tables?: any[]
  styles?: any[]
}

interface Section {
  id: string
  title: string
  parent_id: string | null
  order_index: number
  children?: Section[]
}

interface TableOfContentsGeneratorProps {
  projectId: string
  sections: Section[]
}

export function TableOfContentsGenerator({ projectId, sections }: TableOfContentsGeneratorProps) {
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewHtml, setPreviewHtml] = React.useState<string>("")

  const supabase = createClient()

  // 統一的字體映射函數（與 EditableParagraph 相同）
  const getFontFamily = (fontName?: string, cjkFontName?: string): string => {
    const fontMap: Record<string, string> = {
      '標楷體': '"BiauKai TC", "BiauKai HK", "標楷體-繁", "標楷體-港澳", "Kaiti TC", STKaiti, DFKai-SB, KaiTi, serif',
      'DFKai-SB': 'DFKai-SB, "BiauKai TC", "BiauKai HK", "標楷體-繁", "Kaiti TC", STKaiti, KaiTi, serif',
      'BiauKai': '"BiauKai TC", "BiauKai HK", "標楷體-繁", DFKai-SB, STKaiti, serif',
      'BiauKaiTC': '"BiauKai TC", BiauKaiTC, "標楷體-繁", DFKai-SB, STKaiti, serif',
      'BiauKaiHK': '"BiauKai HK", BiauKaiHK, "標楷體-港澳", DFKai-SB, STKaiti, serif',
      '楷體': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',
      'KaiTi': '"Kaiti TC", "Kaiti SC", STKaiti, KaiTi, "楷體-繁", DFKai-SB, serif',
      '新細明體': 'PMingLiU, MingLiU, "Apple LiSung", "PingFang TC", serif',
      '微軟正黑體': '"Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans TC", sans-serif',
      'Times New Roman': '"Times New Roman", Times, Georgia, serif',
      'Arial': 'Arial, Helvetica, "PingFang TC", sans-serif',
      'Calibri': 'Calibri, "Helvetica Neue", Arial, sans-serif',
      'Verdana': 'Verdana, Geneva, Arial, sans-serif'
    }

    let families = []

    if (fontName) {
      families.push(fontMap[fontName] || `"${fontName}"`)
    }

    if (cjkFontName) {
      families.push(fontMap[cjkFontName] || `"${cjkFontName}"`)
    }

    if (families.length === 0) {
      return 'serif'
    }

    return families.join(', ')
  }

  // 載入範本列表 - 改用 API route 繞過 RLS
  React.useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/templates?filter=toc')

        if (!response.ok) {
          throw new Error('Failed to fetch templates')
        }

        const { templates: data } = await response.json()
        setTemplates(data || [])
      } catch (error) {
        console.error('Error fetching templates:', error)
        toast.error('載入範本失敗')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  // 建立章節樹狀結構
  const buildSectionTree = (sections: Section[]): Section[] => {
    const sectionMap = new Map<string, Section>()
    const rootSections: Section[] = []

    // 先建立所有節點的映射
    sections.forEach(section => {
      sectionMap.set(section.id, { ...section, children: [] })
    })

    // 建立樹狀結構
    sections.forEach(section => {
      const node = sectionMap.get(section.id)!
      if (section.parent_id && sectionMap.has(section.parent_id)) {
        sectionMap.get(section.parent_id)!.children?.push(node)
      } else {
        rootSections.push(node)
      }
    })

    return rootSections
  }

  // 獲取段落層級對應的樣式
  const getStyleForLevel = (template: Template, level: number): any => {
    if (!template.paragraphs || template.paragraphs.length === 0) {
      return null
    }

    // 先嘗試根據 Word 樣式映射（適用於有 Heading 樣式的範本）
    const styleMap: Record<number, string[]> = {
      1: ['Heading 1', 'Heading1', 'Title', '標題 1', '標題1'],
      2: ['Heading 2', 'Heading2', '標題 2', '標題2'],
      3: ['Heading 3', 'Heading3', '標題 3', '標題3'],
      4: ['Heading 4', 'Heading4', '標題 4', '標題4'],
    }

    const possibleStyles = styleMap[level] || styleMap[1]

    // 尋找匹配的段落樣式
    for (const styleName of possibleStyles) {
      const matchingParagraph = template.paragraphs.find(
        p => p.style?.toLowerCase().includes(styleName.toLowerCase())
      )
      if (matchingParagraph) {
        return matchingParagraph.format
      }
    }

    // 如果找不到 Heading 樣式，嘗試根據文字內容匹配（適用於 Normal 樣式的範本）
    // 例如：第一層找「壹、」「貳、」，第二層找「一、」「二、」
    const contentPatterns: Record<number, RegExp[]> = {
      1: [/^[壹貳參肆伍陸柒捌玖拾]、/],  // 第一層：壹、貳、參...
      2: [/^[一二三四五六七八九十]+、/],  // 第二層：一、二、三...
      3: [/^\d+、/, /^\(\d+\)/],          // 第三層：1、2、或 (1)(2)
      4: [/^\([一二三四五六七八九十]+\)/], // 第四層：(一)(二)...
    }

    const patterns = contentPatterns[level]
    if (patterns) {
      for (const pattern of patterns) {
        const matchingParagraph = template.paragraphs.find(
          p => p.text && pattern.test(p.text.trim())
        )
        if (matchingParagraph) {
          return matchingParagraph.format
        }
      }
    }

    // 如果還是找不到，返回有內容的第一個段落的格式（跳過標題段落）
    const contentParagraph = template.paragraphs.find(
      p => p.text && p.text.trim().length > 0 && p.index > 0
    )
    return contentParagraph?.format || template.paragraphs[0]?.format || null
  }

  // 套用格式到章節
  const applyStylingToSections = (template: Template, sectionTree: Section[]): any[] => {
    const styledSections: any[] = []

    const processSection = (section: Section, level: number) => {
      const format = getStyleForLevel(template, level)

      styledSections.push({
        id: section.id,
        title: section.title,
        level: level,
        format: format,
      })

      // 遞迴處理子章節
      if (section.children && section.children.length > 0) {
        section.children.forEach(child => {
          processSection(child, level + 1)
        })
      }
    }

    sectionTree.forEach(section => {
      processSection(section, 1)
    })

    return styledSections
  }

  // 生成預覽 HTML - 模仿範本的 runs 結構
  const generatePreviewHtml = (template: Template, styledSections: any[]): string => {
    let html = '<div style="font-family: serif; padding: 40px; max-width: 800px; margin: 0 auto;">'

    // 從範本中找到「目錄」標題的格式
    if (template.paragraphs && template.paragraphs.length > 0) {
      // 尋找包含「目錄」的段落（通常是第一個段落）
      const titlePara = template.paragraphs.find(p =>
        p.text?.includes('目錄') || p.style?.toLowerCase().includes('title')
      ) || template.paragraphs[0]

      const titleStyles: string[] = []

      // 對齊方式
      if (titlePara.format?.alignment) {
        const alignMap: Record<string, string> = {
          left: 'left',
          center: 'center',
          right: 'right',
          both: 'justify',
          LEFT: 'left',
          CENTER: 'center',
          RIGHT: 'right',
          BOTH: 'justify',
          DISTRIBUTE: 'justify'
        }
        const align = alignMap[titlePara.format.alignment] || alignMap[titlePara.format.alignment.toLowerCase()] || 'center'
        titleStyles.push(`text-align: ${align}`)
      } else {
        titleStyles.push('text-align: center')
      }

      // 使用字體映射函數
      if (titlePara.format?.font_name || titlePara.format?.font_name_cjk) {
        const fontFamily = getFontFamily(titlePara.format.font_name, titlePara.format.font_name_cjk)
        titleStyles.push(`font-family: ${fontFamily}`)
      }

      // 字體大小（不使用預設值，必須從範本讀取）
      if (titlePara.format?.font_size) {
        titleStyles.push(`font-size: ${titlePara.format.font_size}pt`)
      }

      if (titlePara.format?.bold) {
        titleStyles.push('font-weight: bold')
      }
      if (titlePara.format?.italic) {
        titleStyles.push('font-style: italic')
      }
      if (titlePara.format?.underline) {
        titleStyles.push('text-decoration: underline')
      }

      // 間距
      if (titlePara.format?.spacing) {
        if (titlePara.format.spacing.before > 0) {
          titleStyles.push(`margin-top: ${titlePara.format.spacing.before}pt`)
        }
        if (titlePara.format.spacing.after > 0) {
          titleStyles.push(`margin-bottom: ${titlePara.format.spacing.after}pt`)
        } else {
          titleStyles.push('margin-bottom: 40px') // 預設段後間距
        }

        // 行距
        const line = titlePara.format.spacing.line_spacing || titlePara.format.spacing.line
        const rule = titlePara.format.spacing.line_spacing_rule || titlePara.format.spacing.lineRule || 'SINGLE'

        if (line > 0) {
          if (rule === 'SINGLE') titleStyles.push('line-height: 1.15')
          else if (rule === '1.5') titleStyles.push('line-height: 1.5')
          else if (rule === 'DOUBLE') titleStyles.push('line-height: 2.0')
          else if (rule === 'AT_LEAST' || rule === 'EXACTLY') {
            titleStyles.push(`line-height: ${line}pt`)
          } else {
            titleStyles.push(`line-height: ${line}`)
          }
        } else {
          titleStyles.push('line-height: 1.15')
        }
      } else {
        titleStyles.push('margin-bottom: 40px')
        titleStyles.push('line-height: 1.15')
      }

      html += `<h1 style="${titleStyles.join('; ')}">目錄</h1>`
    } else {
      // 完全沒有範本數據的備選方案
      html += '<h1 style="text-align: center; font-size: 16pt; margin-bottom: 40px; line-height: 1.15;">目錄</h1>'
    }

    // 生成目錄條目 - 模仿範本的多字體 runs 結構
    styledSections.forEach(section => {
      const format = section.format || {}

      // 決定層級：優先使用範本的 numbering.level，否則使用 section.level
      let actualLevel: number
      if (format.numbering && typeof format.numbering.level === 'number') {
        // 範本有多層次清單資訊，使用 numbering.level (0-based)
        actualLevel = format.numbering.level
      } else {
        // 沒有 numbering 資訊，使用傳入的 level (1-based)
        actualLevel = section.level - 1
      }

      // 計算多層次縮排
      const indent = actualLevel * 30

      const lineStyles: string[] = []

      // 對齊方式
      if (format.alignment) {
        const alignMap: Record<string, string> = {
          left: 'left',
          center: 'center',
          right: 'right',
          both: 'justify',
          LEFT: 'left',
          CENTER: 'center',
          RIGHT: 'right',
          BOTH: 'justify',
          DISTRIBUTE: 'justify'
        }
        const align = alignMap[format.alignment] || alignMap[format.alignment?.toLowerCase?.()] || 'left'
        lineStyles.push(`text-align: ${align}`)
      } else {
        lineStyles.push('text-align: left')
      }

      // 縮排（左側縮排 + 多層次縮排）
      let totalLeftIndent = indent
      if (format.indentation?.left > 0) {
        totalLeftIndent += format.indentation.left
      }
      if (totalLeftIndent > 0) {
        lineStyles.push(`margin-left: ${totalLeftIndent}px`)
      }

      // 右側縮排
      if (format.indentation?.right > 0) {
        lineStyles.push(`padding-right: ${format.indentation.right}pt`)
      }

      // 首行縮排
      if (format.indentation?.firstLine > 0 || format.indentation?.first_line > 0) {
        const firstLine = format.indentation.firstLine || format.indentation.first_line
        lineStyles.push(`text-indent: ${firstLine}pt`)
      }

      // 間距
      if (format.spacing) {
        if (format.spacing.before > 0) {
          lineStyles.push(`margin-top: ${format.spacing.before}pt`)
        } else {
          lineStyles.push('margin-top: 0')
        }

        if (format.spacing.after > 0) {
          lineStyles.push(`margin-bottom: ${format.spacing.after}pt`)
        } else {
          lineStyles.push('margin-bottom: 0')
        }

        // 行距
        const line = format.spacing.line_spacing || format.spacing.line
        const rule = format.spacing.line_spacing_rule || format.spacing.lineRule || 'SINGLE'

        if (line > 0) {
          if (rule === 'SINGLE') lineStyles.push('line-height: 1.15')
          else if (rule === '1.5') lineStyles.push('line-height: 1.5')
          else if (rule === 'DOUBLE') lineStyles.push('line-height: 2.0')
          else if (rule === 'AT_LEAST' || rule === 'EXACTLY') {
            lineStyles.push(`line-height: ${line}pt`)
          } else {
            lineStyles.push(`line-height: ${line}`)
          }
        } else {
          lineStyles.push('line-height: 1.15')
        }
      } else {
        lineStyles.push('margin-top: 0')
        lineStyles.push('margin-bottom: 0')
        lineStyles.push('line-height: 1.15')
      }

      // 標題文字的樣式（使用範本字體，如 BiauKaiTC）
      const titleFontStyles: string[] = []

      // 使用字體映射函數
      if (format.font_name || format.font_name_cjk) {
        const fontFamily = getFontFamily(format.font_name, format.font_name_cjk)
        titleFontStyles.push(`font-family: ${fontFamily}`)
      }
      if (format.font_size) {
        titleFontStyles.push(`font-size: ${format.font_size}pt`)
      }
      if (format.bold) {
        titleFontStyles.push('font-weight: bold')
      }
      if (format.italic) {
        titleFontStyles.push('font-style: italic')
      }
      if (format.underline) {
        titleFontStyles.push('text-decoration: underline')
      }

      // 虛線和頁碼的樣式（模仿範本使用 Times New Roman）
      const leaderFontFamily = getFontFamily('Times New Roman')
      const leaderFontStyles: string[] = [
        `font-family: ${leaderFontFamily}`,
      ]
      if (format.font_size) {
        leaderFontStyles.push(`font-size: ${format.font_size}pt`)
      }

      // 建立目錄條目：標題（範本字體） + 點 + 虛線（Times New Roman） + 頁碼
      html += `<div style="${lineStyles.join('; ')}">`

      // 標題部分
      html += `<span style="${titleFontStyles.join('; ')}">${section.title}</span>`

      // 點 + 虛線部分（模仿範本的 "…" 字符）
      html += `<span style="${leaderFontStyles.join('; ')}">.</span>`
      html += `<span style="${leaderFontStyles.join('; ')}">…………………………………………………………………</span>`

      // 頁碼部分
      html += `<span style="${leaderFontStyles.join('; ')}">0</span>`

      html += '</div>'
    })

    html += '</div>'
    return html
  }

  // 預覽功能
  const handlePreview = async () => {
    if (!selectedTemplateId) {
      toast.error('請先選擇範本')
      return
    }

    setGenerating(true)
    try {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (!template) {
        throw new Error('找不到範本')
      }

      const sectionTree = buildSectionTree(sections)
      const styledSections = applyStylingToSections(template, sectionTree)
      const html = generatePreviewHtml(template, styledSections)

      setPreviewHtml(html)
      setPreviewOpen(true)
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('預覽失敗')
    } finally {
      setGenerating(false)
    }
  }

  // 產生 Word 文檔
  const handleGenerateWord = async () => {
    if (!selectedTemplateId) {
      toast.error('請先選擇範本')
      return
    }

    setGenerating(true)
    try {
      const template = templates.find(t => t.id === selectedTemplateId)
      if (!template) {
        throw new Error('找不到範本')
      }

      const sectionTree = buildSectionTree(sections)
      const styledSections = applyStylingToSections(template, sectionTree)

      // 調用後端 API 產生 Word 文檔
      const response = await fetch('/api/generate-toc-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          templateId: selectedTemplateId,
          sections: styledSections,
          template: template, // 傳遞完整範本資料以讀取標題格式
        }),
      })

      if (!response.ok) {
        throw new Error('文檔生成失敗')
      }

      // 下載文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `目錄_${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('目錄文檔已下載')
    } catch (error) {
      console.error('Generate Word error:', error)
      toast.error('文檔生成失敗')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-none border-2 border-black dark:border-white">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="rounded-none border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
        <CardHeader className="border-b-2 border-black dark:border-white bg-black/5 dark:bg-white/5">
          <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#FA4028]" />
            產生目錄頁
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">尚未建立目錄範本</p>
              <Button
                variant="outline"
                onClick={() => window.open('/dashboard/templates', '_blank')}
                className="rounded-none border-2 border-black dark:border-white"
              >
                前往建立範本
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider">
                  選擇目錄範本
                </label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="rounded-none border-2 border-black dark:border-white">
                    <SelectValue placeholder="選擇範本..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.category && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({template.category})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePreview}
                  disabled={!selectedTemplateId || generating}
                  variant="outline"
                  className="flex-1 rounded-none border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-bold uppercase"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      預覽
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGenerateWord}
                  disabled={!selectedTemplateId || generating}
                  className="flex-1 rounded-none bg-[#FA4028] hover:bg-[#FA4028]/90 text-white font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      下載 Word
                    </>
                  )}
                </Button>
              </div>

              {selectedTemplateId && (
                <div className="text-xs text-muted-foreground border-l-2 border-[#FA4028] pl-3 py-1">
                  <p className="font-bold">目錄生成說明：</p>
                  <ul className="mt-1 space-y-0.5">
                    <li>• 使用專案的章節標題（來自規劃頁面）</li>
                    <li>• 套用範本的字體、大小、粗體等格式</li>
                    <li>• 多層次格式：第一層 → 標題 1，第二層 → 標題 2</li>
                    <li>• 頁碼統一顯示 "0"（需手動更新實際頁數）</li>
                    <li>• 虛線引導線自動生成</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="!max-w-[1000px] h-[90vh] p-0 overflow-hidden bg-muted/20 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-black dark:border-white bg-background shrink-0">
            <DialogTitle>目錄預覽</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            <div
              className="bg-white text-black shadow-sm border border-black/10 origin-top transform scale-90 md:scale-100"
              style={{
                width: '794px', // A4 width at 96 DPI
                minHeight: '1123px', // A4 height at 96 DPI
                padding: '96px', // Approx 1 inch margin
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
