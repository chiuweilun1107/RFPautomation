/**
 * Unit tests for citationTextParser utilities
 */

import { convertCitationMarksToNumbers, collectAllEvidences } from '@/components/workspace/tender-planning/utils/citationTextParser';
import type { Citation } from '@/components/workspace/types';

describe('citationTextParser', () => {
  const mockCitations: Citation[] = [
    {
      source_id: 'uuid-1',
      page: 1,
      title: '3-需求說明書.docx',
      quote: '需求引文'
    },
    {
      source_id: 'uuid-2',
      page: 5,
      title: 'RFP.xlsx',
      quote: 'RFP 引文'
    },
    {
      source_id: 'uuid-3',
      page: 2,
      title: '3-需求說明書.docx',
      quote: '另一段引文'
    }
  ];

  describe('convertCitationMarksToNumbers', () => {
    it('should convert single citation mark to number (fullwidth colon)', () => {
      const text = '系統應支援多種格式 (出處：3-需求說明書.docx P.1)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      expect(result.textWithNumbers).toBe('系統應支援多種格式 [1]。');
      expect(result.evidences[1]).toEqual({
        id: 1,
        source_id: 'uuid-1',
        page: 1,
        source_title: '3-需求說明書.docx',
        quote: '需求引文'
      });
    });

    it('should convert single citation mark to number (halfwidth colon)', () => {
      const text = '系統應支援多種格式 (出處: 3-需求說明書.docx P.1)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      expect(result.textWithNumbers).toBe('系統應支援多種格式 [1]。');
      expect(result.evidences[1]).toEqual({
        id: 1,
        source_id: 'uuid-1',
        page: 1,
        source_title: '3-需求說明書.docx',
        quote: '需求引文'
      });
    });

    it('should convert multiple citation marks to numbers', () => {
      const text = '需求1 (出處：3-需求說明書.docx P.1) 和需求2 (出處：RFP.xlsx P.5)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      expect(result.textWithNumbers).toBe('需求1 [1] 和需求2 [2]。');
      expect(Object.keys(result.evidences).length).toBe(2);
      expect(result.evidences[1].source_title).toBe('3-需求說明書.docx');
      expect(result.evidences[2].source_title).toBe('RFP.xlsx');
    });

    it('should handle comma-separated sources in one mark', () => {
      const text = '需求 (出處：3-需求說明書.docx P.1, RFP.xlsx P.5)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      expect(result.textWithNumbers).toBe('需求 [1] [2]。');
      expect(Object.keys(result.evidences).length).toBe(2);
    });

    it('should deduplicate same citations', () => {
      const text = '需求1 (出處：3-需求說明書.docx P.1) 和需求2 (出處：3-需求說明書.docx P.1)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      expect(result.textWithNumbers).toBe('需求1 [1] 和需求2 [1]。');
      expect(Object.keys(result.evidences).length).toBe(1);
    });

    it('should handle unmatched citations gracefully by creating synthetic citation', () => {
      const text = '需求 (出處：不存在的文件.docx P.99)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      // Should create a synthetic citation instead of [?]
      expect(result.textWithNumbers).toBe('需求 [1]。');
      expect(result.evidences[1]).toEqual({
        id: 1,
        source_id: 'unknown',
        page: 99,
        source_title: '不存在的文件.docx',
        quote: undefined
      });
    });

    it('should handle text without citation marks', () => {
      const text = '這是一個沒有引用的需求說明。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      expect(result.textWithNumbers).toBe('這是一個沒有引用的需求說明。');
      expect(Object.keys(result.evidences).length).toBe(0);
    });

    it('should handle empty citations array by creating synthetic citation', () => {
      const text = '需求 (出處：3-需求說明書.docx P.1)。';
      const result = convertCitationMarksToNumbers(text, []);

      // Should create synthetic citation even with empty citations array
      expect(result.textWithNumbers).toBe('需求 [1]。');
      expect(result.evidences[1]).toEqual({
        id: 1,
        source_id: 'unknown',
        page: 1,
        source_title: '3-需求說明書.docx',
        quote: undefined
      });
    });

    it('should match by title when page differs', () => {
      const text = '需求 (出處：3-需求說明書.docx P.99)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      // Should match uuid-1 (page 1) even though requested page is 99
      expect(result.textWithNumbers).toBe('需求 [1]。');
      expect(result.evidences[1].page).toBe(1); // Uses the actual page from citation
    });

    it('should handle multiple citations with same source but different pages', () => {
      const text = '需求1 (出處：3-需求說明書.docx P.1) 和需求2 (出處：3-需求說明書.docx P.2)。';
      const result = convertCitationMarksToNumbers(text, mockCitations);

      expect(result.textWithNumbers).toBe('需求1 [1] 和需求2 [2]。');
      expect(Object.keys(result.evidences).length).toBe(2);
      expect(result.evidences[1].page).toBe(1);
      expect(result.evidences[2].page).toBe(2);
    });

    it('should match by page when citations have no title field', () => {
      // Simulate incomplete citations (only page and quote, no title or source_id)
      const incompleteCitations: Citation[] = [
        {
          source_id: undefined as any,
          page: 1,
          quote: '這是引文內容'
        }
      ];

      const text = '需求 (出處：3-需求說明書.docx P.1)。';
      const result = convertCitationMarksToNumbers(text, incompleteCitations);

      expect(result.textWithNumbers).toBe('需求 [1]。');
      expect(result.evidences[1].page).toBe(1);
      expect(result.evidences[1].source_title).toBe('3-需求說明書.docx'); // Title from parsed text
      expect(result.evidences[1].quote).toBe('這是引文內容'); // Quote from matched citation
    });
  });

  describe('collectAllEvidences', () => {
    it('should collect all evidences from citations array', () => {
      const evidences = collectAllEvidences(mockCitations);

      expect(Object.keys(evidences).length).toBe(3);
      expect(evidences[1].source_title).toBe('3-需求說明書.docx');
      expect(evidences[1].page).toBe(1);
      expect(evidences[2].source_title).toBe('RFP.xlsx');
      expect(evidences[2].page).toBe(5);
      expect(evidences[3].source_title).toBe('3-需求說明書.docx');
      expect(evidences[3].page).toBe(2);
    });

    it('should handle empty citations array', () => {
      const evidences = collectAllEvidences([]);

      expect(Object.keys(evidences).length).toBe(0);
    });

    it('should assign sequential IDs starting from 1', () => {
      const evidences = collectAllEvidences(mockCitations);

      expect(evidences[1].id).toBe(1);
      expect(evidences[2].id).toBe(2);
      expect(evidences[3].id).toBe(3);
    });

    it('should handle citations without title gracefully', () => {
      const citationsWithoutTitle: Citation[] = [
        {
          source_id: 'uuid-1',
          page: 1,
          quote: '引文'
        }
      ];

      const evidences = collectAllEvidences(citationsWithoutTitle);

      expect(evidences[1].source_title).toBe('Unknown Source');
    });
  });
});
