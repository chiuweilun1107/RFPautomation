import React, { useEffect, useState } from 'react';

/**
 * 表格單元格類型定義
 */
interface TableCell {
  text: string;
  rowspan: number;
  colspan: number;
}

/**
 * 表格行類型定義
 */
interface TableRow {
  cells: TableCell[];
}

/**
 * 解析的表格類型定義
 */
interface ParsedTable {
  rows: TableRow[];
}

/**
 * PDF 表格渲染器組件
 * 
 * 功能：
 * - 從 HTML 表格中提取並渲染表格
 * - 支援合併單元格（rowspan/colspan）
 * - 自動應用樣式區分合併單元格
 * 
 * @param {Object} props
 * @param {string} props.htmlContent - 包含 HTML 表格的字符串
 * @param {string} props.className - 額外的 CSS 類名
 * 
 * @example
 * ```tsx
 * <TableRenderer htmlContent="<table>...</table>" />
 * ```
 */
export const TableRenderer: React.FC<{
  htmlContent: string;
  className?: string;
}> = ({ htmlContent, className = '' }) => {
  const [parsedTables, setParsedTables] = useState<ParsedTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseHTML = () => {
      try {
        setIsLoading(true);
        setError(null);

        // 檢查瀏覽器環境
        if (typeof window === 'undefined') {
          // Server-side: 直接返回空
          setParsedTables([]);
          return;
        }

        // 使用 DOMParser 解析 HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const tables = doc.querySelectorAll('table');

        const parsed: ParsedTable[] = [];

        // 解析每個表格
        tables.forEach(table => {
          const rows: TableRow[] = [];
          const tableRows = table.querySelectorAll('tr');

          tableRows.forEach(row => {
            const cells: TableCell[] = [];
            const tableCells = row.querySelectorAll('td');

            // 解析每個單元格
            tableCells.forEach(cell => {
              cells.push({
                text: cell.textContent || '',
                rowspan: parseInt(cell.getAttribute('rowspan') || '1'),
                colspan: parseInt(cell.getAttribute('colspan') || '1'),
              });
            });

            // 只包含有內容的行
            if (cells.length > 0) {
              rows.push({ cells });
            }
          });

          if (rows.length > 0) {
            parsed.push({ rows });
          }
        });

        setParsedTables(parsed);
      } catch (err) {
        console.error('Failed to parse HTML table:', err);
        setError(err instanceof Error ? err.message : '解析表格失敗');
      } finally {
        setIsLoading(false);
      }
    };

    parseHTML();
  }, [htmlContent]);

  // 加載狀態
  if (isLoading) {
    return (
      <div className="table-loader">
        <div className="spinner"></div>
        <p>載入表格中...</p>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="table-error">
        <p>⚠️ 無法解析表格: {error}</p>
        <pre className="error-details">{htmlContent}</pre>
      </div>
    );
  }

  // 沒有找到表格
  if (parsedTables.length === 0) {
    return (
      <div className="no-table">
        <p>未找到表格內容</p>
      </div>
    );
  }

  // 渲染表格
  return (
    <div className={`pdf-table-container ${className}`}>
      {parsedTables.map((table, tableIndex) => (
        <div key={tableIndex} className="pdf-table-wrapper">
          <table className="pdf-table">
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="table-row">
                  {row.cells.map((cell, cellIndex) => {
                    const isMerged = cell.rowspan > 1 || cell.colspan > 1;
                    
                    return (
                      <td
                        key={cellIndex}
                        rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
                        colSpan={cell.colspan > 1 ? cell.colspan : undefined}
                        className={`table-cell ${isMerged ? 'merged-cell' : ''} ${
                          !cell.text.trim() ? 'empty-cell' : ''
                        }`}
                        style={{
                          width: `${100 / row.cells.length}%`,
                        }}
                      >
                        {cell.text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

/**
 * 簡單版本：直接渲染 HTML（適用於快速原型）
 * 
 * 警告：使用 dangerouslySetInnerHTML 可能有安全風險
 * 僅在確信 HTML 內容安全時使用
 */
export const SimpleTableRenderer: React.FC<{
  htmlContent: string;
  className?: string;
}> = ({ htmlContent, className = '' }) => {
  // 提取 HTML 表格
  const extractTables = (content: string) => {
    const tableRegex = /<table>[\s\S]*?<\/table>/g;
    return content.match(tableRegex) || [];
  };

  const tables = extractTables(htmlContent);

  if (tables.length === 0) {
    return <div className="no-table">未找到表格內容</div>;
  }

  return (
    <div className={`simple-table-container ${className}`}>
      {tables.map((tableHtml, index) => (
        <div
          key={index}
          dangerouslySetInnerHTML={{ __html: tableHtml }}
          className="pdf-table"
        />
      ))}
    </div>
  );
};
