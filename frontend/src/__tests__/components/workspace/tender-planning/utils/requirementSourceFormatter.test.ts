/**
 * Tests for Requirement Source Formatter
 *
 * 測試需求出處標註功能
 */

import {
  appendSourceToRequirement,
  formatSingleSource,
  formatMultipleSources,
  extractSourceFromRequirement,
  hasSourceAnnotation,
  formatRequirementsWithSources,
} from '@/components/workspace/tender-planning/utils/requirementSourceFormatter';
import type { Citation } from '@/components/workspace/types';

describe('requirementSourceFormatter', () => {
  const mockCitation: Citation = {
    source_id: 'uuid-123-456',
    page: 1,
    title: '3-需求說明書.docx',
    quote: '這是一段引用文字',
  };

  const mockCitation2: Citation = {
    source_id: 'uuid-789-012',
    page: 5,
    title: '4-技術規格.docx',
  };

  describe('formatSingleSource', () => {
    it('should format citation with title and page', () => {
      const result = formatSingleSource(mockCitation);
      expect(result).toBe('3-需求說明書.docx P.1');
    });

    it('should handle missing title', () => {
      const citation: Citation = {
        source_id: 'uuid-123',
        page: 10,
      };
      const result = formatSingleSource(citation);
      expect(result).toBe('未知來源 P.10');
    });

    it('should format page number correctly', () => {
      const citation: Citation = {
        ...mockCitation,
        page: 999,
      };
      const result = formatSingleSource(citation);
      expect(result).toBe('3-需求說明書.docx P.999');
    });
  });

  describe('formatMultipleSources', () => {
    it('should format single citation', () => {
      const result = formatMultipleSources([mockCitation]);
      expect(result).toBe('3-需求說明書.docx P.1');
    });

    it('should format multiple citations with comma separator', () => {
      const result = formatMultipleSources([mockCitation, mockCitation2]);
      expect(result).toBe('3-需求說明書.docx P.1, 4-技術規格.docx P.5');
    });

    it('should return empty string for empty array', () => {
      const result = formatMultipleSources([]);
      expect(result).toBe('');
    });

    it('should handle three citations', () => {
      const citation3: Citation = {
        source_id: 'uuid-345',
        page: 8,
        title: '5-使用手冊.docx',
      };
      const result = formatMultipleSources([mockCitation, mockCitation2, citation3]);
      expect(result).toBe('3-需求說明書.docx P.1, 4-技術規格.docx P.5, 5-使用手冊.docx P.8');
    });
  });

  describe('appendSourceToRequirement', () => {
    it('should append single source to requirement text', () => {
      const text = '本專案緣起於現有業務系統未整合';
      const result = appendSourceToRequirement(text, [mockCitation]);
      expect(result).toBe('本專案緣起於現有業務系統未整合 (出處：3-需求說明書.docx P.1)。');
    });

    it('should append multiple sources to requirement text', () => {
      const text = '新系統應支援多種格式';
      const result = appendSourceToRequirement(text, [mockCitation, mockCitation2]);
      expect(result).toBe('新系統應支援多種格式 (出處：3-需求說明書.docx P.1, 4-技術規格.docx P.5)。');
    });

    it('should return original text if no citations', () => {
      const text = '需求說明';
      const result = appendSourceToRequirement(text, []);
      expect(result).toBe('需求說明');
    });

    it('should handle undefined citations', () => {
      const text = '需求說明';
      const result = appendSourceToRequirement(text, undefined as any);
      expect(result).toBe('需求說明');
    });

    it('should remove ending punctuation before appending source', () => {
      const text = '需求說明。';
      const result = appendSourceToRequirement(text, [mockCitation]);
      expect(result).toBe('需求說明 (出處：3-需求說明書.docx P.1)。');
      expect(result).not.toContain('。。'); // 確保沒有雙句號
    });

    it('should handle multiple ending punctuation marks', () => {
      const text = '需求說明！？';
      const result = appendSourceToRequirement(text, [mockCitation]);
      expect(result).toBe('需求說明 (出處：3-需求說明書.docx P.1)。');
    });

    it('should trim whitespace', () => {
      const text = '  需求說明  ';
      const result = appendSourceToRequirement(text, [mockCitation]);
      expect(result).toBe('需求說明 (出處：3-需求說明書.docx P.1)。');
    });

    it('should handle long requirement text', () => {
      const longText = '新系統應符合新北市政府動物保護防疫處多元組織業務需求，包括動物疾病衛生保健、檢診、調查、管理及教育宣導等，以支援日漸成長的救援及陳情案件量，預估每年合計約2萬件案量，需透過資訊科技提升作業自動化與流程標準化';
      const result = appendSourceToRequirement(longText, [mockCitation]);
      expect(result).toContain(longText);
      expect(result).toContain('(出處：3-需求說明書.docx P.1)。');
    });
  });

  describe('extractSourceFromRequirement', () => {
    it('should extract source from formatted text', () => {
      const text = '需求說明 (出處：3-需求說明書.docx P.1)。';
      const result = extractSourceFromRequirement(text);
      expect(result.text).toBe('需求說明');
      expect(result.sources).toBe('3-需求說明書.docx P.1');
    });

    it('should handle multiple sources in text', () => {
      const text = '需求說明 (出處：文檔A.docx P.1, 文檔B.docx P.5)。';
      const result = extractSourceFromRequirement(text);
      expect(result.text).toBe('需求說明');
      expect(result.sources).toBe('文檔A.docx P.1, 文檔B.docx P.5');
    });

    it('should return null sources if no annotation found', () => {
      const text = '需求說明';
      const result = extractSourceFromRequirement(text);
      expect(result.text).toBe('需求說明');
      expect(result.sources).toBeNull();
    });

    it('should handle text without ending period', () => {
      const text = '需求說明 (出處：文檔.docx P.1)';
      const result = extractSourceFromRequirement(text);
      expect(result.text).toBe('需求說明');
      expect(result.sources).toBe('文檔.docx P.1');
    });
  });

  describe('hasSourceAnnotation', () => {
    it('should return true if source annotation exists', () => {
      const text = '需求說明 (出處：文檔.docx P.1)。';
      expect(hasSourceAnnotation(text)).toBe(true);
    });

    it('should return true without ending period', () => {
      const text = '需求說明 (出處：文檔.docx P.1)';
      expect(hasSourceAnnotation(text)).toBe(true);
    });

    it('should return false if no annotation', () => {
      const text = '需求說明';
      expect(hasSourceAnnotation(text)).toBe(false);
    });

    it('should return false for partial match', () => {
      const text = '需求說明 (出處：';
      expect(hasSourceAnnotation(text)).toBe(false);
    });

    it('should handle multiple sources annotation', () => {
      const text = '需求 (出處：A.docx P.1, B.docx P.2)。';
      expect(hasSourceAnnotation(text)).toBe(true);
    });
  });

  describe('formatRequirementsWithSources', () => {
    it('should format array of requirements', () => {
      const requirements = [
        {
          id: '1',
          requirement_text: '需求1',
          citations: [mockCitation],
          status: 'pending' as const,
        },
        {
          id: '2',
          requirement_text: '需求2',
          citations: [mockCitation2],
          status: 'approved' as const,
        },
      ];

      const result = formatRequirementsWithSources(requirements);

      expect(result).toHaveLength(2);
      expect(result[0].formatted_text).toBe('需求1 (出處：3-需求說明書.docx P.1)。');
      expect(result[1].formatted_text).toBe('需求2 (出處：4-技術規格.docx P.5)。');
      expect(result[0].id).toBe('1');
      expect(result[1].status).toBe('approved');
    });

    it('should preserve original fields', () => {
      const requirements = [
        {
          id: 'abc-123',
          requirement_text: '測試需求',
          citations: [mockCitation],
          status: 'pending' as const,
          customField: 'custom value',
        },
      ];

      const result = formatRequirementsWithSources(requirements);

      expect(result[0].id).toBe('abc-123');
      expect(result[0].status).toBe('pending');
      expect((result[0] as any).customField).toBe('custom value');
      expect(result[0].formatted_text).toContain('測試需求');
    });

    it('should handle empty requirements array', () => {
      const result = formatRequirementsWithSources([]);
      expect(result).toEqual([]);
    });

    it('should handle requirements with no citations', () => {
      const requirements = [
        {
          id: '1',
          requirement_text: '無來源需求',
          citations: [],
          status: 'pending' as const,
        },
      ];

      const result = formatRequirementsWithSources(requirements);
      expect(result[0].formatted_text).toBe('無來源需求');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle real-world requirement scenario', () => {
      const requirement = {
        id: 'req-001',
        requirement_text: '新系統應符合新北市政府動物保護防疫處多元組織業務需求，包括動物疾病衛生保健、檢診、調查、管理及教育宣導等，以支援日漸成長的救援及陳情案件量，預估每年合計約2萬件案量，需透過資訊科技提升作業自動化與流程標準化',
        citations: [
          {
            source_id: 'doc-uuid-123',
            page: 1,
            title: '3-需求說明書.docx',
            quote: '需透過資訊科技提升作業自動化與流程標準化',
          },
        ],
        status: 'pending' as const,
      };

      const formatted = formatRequirementsWithSources([requirement]);
      const formattedText = formatted[0].formatted_text;

      expect(formattedText).toContain('新系統應符合新北市政府');
      expect(formattedText).toContain('(出處：3-需求說明書.docx P.1)。');
      expect(formattedText.split('(出處：').length).toBe(2); // 只有一個出處標註
    });

    it('should handle round-trip extraction and formatting', () => {
      const originalText = '原始需求文本';
      const citations = [mockCitation];

      // 格式化
      const formatted = appendSourceToRequirement(originalText, citations);

      // 提取
      const extracted = extractSourceFromRequirement(formatted);

      // 再次格式化
      const reformatted = appendSourceToRequirement(extracted.text, citations);

      expect(formatted).toBe(reformatted);
    });

    it('should handle task with missing citation title gracefully', () => {
      const task = {
        id: 'task-1',
        requirement_text: '需求說明',
        citations: [
          {
            source_id: 'uuid-123',
            page: 1,
            // title is missing
          } as Citation,
        ],
        status: 'pending' as const,
      };

      const result = formatRequirementsWithSources([task]);
      expect(result[0].formatted_text).toBe('需求說明 (出處：未知來源 P.1)。');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string requirement text', () => {
      const result = appendSourceToRequirement('', [mockCitation]);
      expect(result).toBe(' (出處：3-需求說明書.docx P.1)。');
    });

    it('should handle requirement text with only whitespace', () => {
      const result = appendSourceToRequirement('   ', [mockCitation]);
      expect(result).toBe(' (出處：3-需求說明書.docx P.1)。');
    });

    it('should handle very large page numbers', () => {
      const citation: Citation = {
        ...mockCitation,
        page: 99999,
      };
      const result = formatSingleSource(citation);
      expect(result).toBe('3-需求說明書.docx P.99999');
    });

    it('should handle special characters in title', () => {
      const citation: Citation = {
        source_id: 'uuid',
        page: 1,
        title: '需求書 (2026版本) [最終].docx',
      };
      const result = formatSingleSource(citation);
      expect(result).toBe('需求書 (2026版本) [最終].docx P.1');
    });

    it('should handle requirement text with newlines', () => {
      const text = '第一行\n第二行\n第三行';
      const result = appendSourceToRequirement(text, [mockCitation]);
      expect(result).toContain('第一行\n第二行\n第三行');
      expect(result).toContain('(出處：');
    });
  });
});
