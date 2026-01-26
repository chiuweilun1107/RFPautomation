/**
 * Requirement Source Formatter
 *
 * 格式化需求文本，在末尾自動附加出處標註
 * 格式：(出處：文件名.docx P.頁碼)
 */

import type { Citation } from '@/components/workspace/types';

/**
 * 格式化單個出處
 * @param citation - 引用信息
 * @returns 格式化的出處字符串，例如 "3-需求說明書.docx P.1"
 */
export function formatSingleSource(citation: Citation): string {
  const title = citation.title || '未知來源';
  const page = citation.page;

  return `${title} P.${page}`;
}

/**
 * 格式化多個出處
 * @param citations - 引用信息數組
 * @returns 格式化的出處字符串，例如 "3-需求說明書.docx P.1, 4-技術規格.docx P.5"
 */
export function formatMultipleSources(citations: Citation[]): string {
  if (!citations || citations.length === 0) {
    return '';
  }

  return citations
    .map(cit => formatSingleSource(cit))
    .join(', ');
}

/**
 * 在需求文本末尾附加出處標註
 * @param requirementText - 原始需求文本
 * @param citations - 引用信息數組
 * @returns 附加出處後的完整文本
 */
export function appendSourceToRequirement(
  requirementText: string,
  citations: Citation[]
): string {
  if (!citations || citations.length === 0) {
    return requirementText;
  }

  const sourcesText = formatMultipleSources(citations);
  const trimmedText = requirementText.trim();

  // 移除末尾標點符號（如果有）
  const textWithoutEndingPunct = trimmedText.replace(/[。！？\.\!\?]+$/, '');

  // 附加出處標註
  return `${textWithoutEndingPunct} (出處：${sourcesText})。`;
}

/**
 * 從需求文本中提取出處信息（用於解析已有出處的文本）
 * @param text - 包含出處的完整文本
 * @returns { text: 純文本, sources: 出處字符串 }
 */
export function extractSourceFromRequirement(text: string): {
  text: string;
  sources: string | null;
} {
  // 匹配模式：(出處：...)。
  const sourcePattern = /\s*\(出處：([^)]+)\)[。]?$/;
  const match = text.match(sourcePattern);

  if (match) {
    return {
      text: text.replace(sourcePattern, '').trim(),
      sources: match[1],
    };
  }

  return {
    text: text,
    sources: null,
  };
}

/**
 * 檢查文本是否已包含出處標註
 * @param text - 需求文本
 * @returns true 如果已包含出處
 */
export function hasSourceAnnotation(text: string): boolean {
  return /\(出處：[^)]+\)[。]?$/.test(text);
}

/**
 * 格式化需求列表，為每個需求附加出處
 * @param requirements - 需求對象數組，包含 text 和 citations
 * @returns 格式化後的需求對象數組
 */
export function formatRequirementsWithSources<T extends {
  requirement_text: string;
  citations: Citation[];
}>(requirements: T[]): Array<T & { formatted_text: string }> {
  return requirements.map(req => ({
    ...req,
    formatted_text: appendSourceToRequirement(req.requirement_text, req.citations),
  }));
}
