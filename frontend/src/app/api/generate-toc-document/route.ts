import { NextResponse } from "next/server"
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, templateId, sections, template } = body

    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { error: "No sections provided" },
        { status: 400 }
      )
    }

    // 建立 Word 文檔
    const paragraphs: Paragraph[] = []

    interface TitleFormat {
      font: string;
      size: number;
      bold: boolean;
      italics: boolean;
      underline: boolean;
      alignment: typeof AlignmentType[keyof typeof AlignmentType];
      spacingBefore: number;
      spacingAfter: number;
    }

    // 添加標題 - 從範本中讀取完整格式
    let titleFormat: TitleFormat = {
      font: "Times New Roman",
      size: 32, // 16pt * 2 (docx uses half-points) - 預設備選
      bold: false,
      italics: false,
      underline: false,
      alignment: AlignmentType.CENTER,
      spacingBefore: 0,
      spacingAfter: 400,
    }

    interface TemplateParagraph {
      text?: string;
      style?: string;
      format?: {
        font_name?: string;
        font_name_cjk?: string;
        font_size?: number;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        alignment?: string;
        spacing?: { before?: number; after?: number };
      };
    }

    // 從範本中找到「目錄」標題的格式
    if (template?.paragraphs && template.paragraphs.length > 0) {
      const titlePara = (template.paragraphs as TemplateParagraph[]).find((p) =>
        p.text?.includes('目錄') || p.style?.toLowerCase().includes('title')
      ) || template.paragraphs[0]

      if (titlePara.format) {
        titleFormat = {
          font: titlePara.format.font_name || titlePara.format.font_name_cjk || "Times New Roman",
          size: titlePara.format.font_size ? titlePara.format.font_size * 2 : 32,
          bold: titlePara.format.bold || false,
          italics: titlePara.format.italic || false,
          underline: titlePara.format.underline || false,
          alignment: titlePara.format.alignment === 'center' || titlePara.format.alignment === 'CENTER'
            ? AlignmentType.CENTER
            : titlePara.format.alignment === 'right' || titlePara.format.alignment === 'RIGHT'
            ? AlignmentType.RIGHT
            : AlignmentType.LEFT,
          spacingBefore: titlePara.format.spacing?.before ? titlePara.format.spacing.before * 20 : 0,
          spacingAfter: titlePara.format.spacing?.after ? titlePara.format.spacing.after * 20 : 400,
        }
      }
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "目錄",
            font: titleFormat.font,
            size: titleFormat.size,
            bold: titleFormat.bold,
            italics: titleFormat.italics,
            underline: titleFormat.underline ? {} : undefined,
          })
        ],
        alignment: titleFormat.alignment,
        spacing: {
          before: titleFormat.spacingBefore,
          after: titleFormat.spacingAfter,
        },
      })
    )

    interface SectionInput {
      title: string;
      level: number;
      format?: {
        numbering?: { level?: number };
        alignment?: string;
        font_size?: number;
        font_name?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        spacing?: { before?: number; after?: number };
      };
    }

    // 添加章節內容 - 模仿範本的 runs 結構
    sections.forEach((section: SectionInput) => {
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

      const indent = actualLevel * 720 // 每層縮排 0.5 inch (720 twips)

      // 決定對齊方式
      let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT
      if (format.alignment === 'center' || format.alignment === 'CENTER') alignment = AlignmentType.CENTER
      else if (format.alignment === 'right' || format.alignment === 'RIGHT') alignment = AlignmentType.RIGHT
      else if (format.alignment === 'both' || format.alignment === 'justify' || format.alignment === 'BOTH' || format.alignment === 'JUSTIFIED') alignment = AlignmentType.JUSTIFIED

      const fontSize = format.font_size ? format.font_size * 2 : 24

      // 間距（轉換為 twips: 1pt = 20 twips）
      const spacingBefore = format.spacing?.before ? format.spacing.before * 20 : 120
      const spacingAfter = format.spacing?.after ? format.spacing.after * 20 : 120

      // 模仿範本的多 runs 結構：標題（範本字體） + 點 + 虛線（Times New Roman） + 頁碼

      // Run 1: 標題文字（使用範本字體，如 BiauKaiTC）
      const titleRun = new TextRun({
        text: section.title,
        font: format.font_name || "Times New Roman",
        size: fontSize,
        bold: format.bold || false,
        italics: format.italic || false,
        underline: format.underline ? {} : undefined,
      })

      // Run 2: 點（Times New Roman）
      const dotRun = new TextRun({
        text: ".",
        font: "Times New Roman",
        size: fontSize,
      })

      // Run 3: 虛線引導線（Times New Roman 的 "…" 字符）
      const leaderRun = new TextRun({
        text: "…………………………………………………………………",
        font: "Times New Roman",
        size: fontSize,
      })

      // Run 4: 頁碼（Times New Roman）
      const pageNumberRun = new TextRun({
        text: "0",
        font: "Times New Roman",
        size: fontSize,
      })

      paragraphs.push(
        new Paragraph({
          children: [titleRun, dotRun, leaderRun, pageNumberRun],
          alignment: alignment,
          indent: {
            left: indent,
          },
          spacing: {
            before: spacingBefore,
            after: spacingAfter,
          },
        })
      )
    })

    // 創建文檔
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    })

    // 生成 buffer
    const buffer = await Packer.toBuffer(doc)

    // 返回文檔
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="table-of-contents-${new Date().toISOString().split('T')[0]}.docx"`,
      },
    })
  } catch (error) {
    console.error("[Generate TOC] Error:", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
