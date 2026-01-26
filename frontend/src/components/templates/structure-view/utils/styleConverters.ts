import type { RunFormat } from "@/types/template-structure"
import { getFontFamily } from "./fontMapping"

/**
 * 將 Run 格式轉換為 CSS 樣式
 */
export function getRunStyle(runFormat?: RunFormat): React.CSSProperties {
    const style: React.CSSProperties = {}

    if (!runFormat) return style

    // 字體
    if (runFormat.font) {
        style.fontFamily = getFontFamily(runFormat.font)
    }

    // 字體大小
    if (runFormat.size) {
        style.fontSize = `${runFormat.size}pt`
    }

    // 顏色
    if (runFormat.color && runFormat.color !== 'auto') {
        style.color = `#${runFormat.color}`
    }

    // 粗體
    if (runFormat.bold) {
        style.fontWeight = 'bold'
    }

    // 斜體
    if (runFormat.italic) {
        style.fontStyle = 'italic'
    }

    // 底線
    if (runFormat.underline) {
        style.textDecoration = 'underline'
    }

    // 刪除線
    if (runFormat.strike) {
        style.textDecoration = style.textDecoration
            ? `${style.textDecoration} line-through`
            : 'line-through'
    }

    return style
}

/**
 * 對齊值轉換
 */
export function getTextAlign(align?: string): 'left' | 'center' | 'right' | 'justify' {
    switch (align) {
        case 'center': return 'center'
        case 'right': return 'right'
        case 'both': return 'justify'
        default: return 'left'
    }
}
