'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function TestMarkdown() {
    const testContent = `**(一) 計畫緣起**

觀光賦能e學院自103年設立以來，已連續服務產業逾十年。

1. **現有架構不符最新數位互動設計**，介面操作流程繁瑣，響應式設計不足。

2. **課程內容分類、檢索功能受限**，導致資源整合與用戶體驗成效遞減。

3. **原技術基礎與資安維能量不足**，未能完全符應政府資通安全管理法。

產業現場反映迫切提升平台穩定性。`;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Markdown List Test</h1>

            <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                <h2 className="text-lg font-semibold mb-2">原始 Markdown 內容：</h2>
                <pre className="text-xs whitespace-pre-wrap">{testContent}</pre>
            </div>

            <div className="prose dark:prose-invert max-w-none prose-sm prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-p:leading-relaxed border p-4 rounded">
                <h2 className="text-lg font-semibold mb-2">渲染結果：</h2>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-2" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-2" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />
                    }}
                >
                    {testContent}
                </ReactMarkdown>
            </div>
        </div>
    );
}
