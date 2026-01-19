'use client';

import React, { useState } from 'react';
import { TableRenderer, SimpleTableRenderer } from '@/components/pdf/TableRenderer';
import '@/components/pdf/TableRenderer.css';

/**
 * 表格演示頁面
 * 
 * 展示如何使用 TableRenderer 組件渲染 MinerU 輸出的表格
 */
export default function TableDemoPage() {
  const [activeTab, setActiveTab] = useState<'advanced' | 'simple'>('advanced');
  
  // 示例：從 MinerU 輸出的 HTML 表格
  const sampleHtmlContent = `<table><tr><td rowspan="4">電子憑據資料</td><td>機關代碼</td><td>A.13.1</td></tr><tr><td>機關名稱</td><td>經濟部商業發展署</td></tr><tr><td></td><td>標案案號</td><td>D115301</td></tr><tr><td></td><td>公告序號</td><td>01</td></tr><tr><td rowspan="3"></td><td>標案名稱</td><td>倉儲業者倉庫資訊系統建置與維運計畫</td></tr><tr><td>領標電子憑證序號</td><td>915000000000003339579</td></tr><tr><td>使用者IP</td><td>61.220.163.19</td></tr></table>`;

  const [htmlContent, setHtmlContent] = useState(sampleHtmlContent);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PDF 表格渲染器演示
          </h1>
          <p className="text-gray-600">
            展示如何使用 TableRenderer 組件渲染 MinerU 輸出的 HTML 表格
          </p>
        </div>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">控制面板</h2>
          
          {/* 標籤切換 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'advanced'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              進階渲染器（推薦）
            </button>
            <button
              onClick={() => setActiveTab('simple')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'simple'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              簡單渲染器
            </button>
          </div>

          {/* HTML 輸入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML 內容
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-48 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="在此輸入或貼上 HTML 表格代碼..."
            />
          </div>

          {/* 重置按鈕 */}
          <button
            onClick={() => setHtmlContent(sampleHtmlContent)}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            重置為示例內容
          </button>
        </div>

        {/* 渲染區域 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">表格預覽</h2>
          
          {activeTab === 'advanced' ? (
            <TableRenderer htmlContent={htmlContent} />
          ) : (
            <SimpleTableRenderer htmlContent={htmlContent} />
          )}
        </div>

        {/* 說明區域 */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* 進階渲染器說明 */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              進階渲染器特點
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li>✅ 完全解析 HTML 結構</li>
              <li>✅ 支援合併單元格（rowspan/colspan）</li>
              <li>✅ 自動樣式區分合併單元格</li>
              <li>✅ 載入和錯誤狀態處理</li>
              <li>✅ 安全性更高（不使用 dangerouslySetInnerHTML）</li>
            </ul>
          </div>

          {/* 簡單渲染器說明 */}
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              簡單渲染器特點
            </h3>
            <ul className="space-y-2 text-yellow-800">
              <li>✅ 最簡單的實現方式</li>
              <li>✅ 直接渲染 HTML</li>
              <li>⚠️ 使用 dangerouslySetInnerHTML（有安全風險）</li>
              <li>⚠️ 適用於可信賴的 HTML 內容</li>
            </ul>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">使用說明</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. 後端處理流程</h3>
              <code className="block bg-white p-3 rounded border font-mono text-sm">
                PDF → MinerU → Markdown (含 HTML) → 後處理腳本 → 優化的 Markdown
              </code>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. 前端整合</h3>
              <pre className="bg-white p-3 rounded border overflow-x-auto text-sm">
{`import { TableRenderer } from '@/components/pdf/TableRenderer';

function MyComponent() {
  const htmlContent = '<table>...</table>';
  
  return (
    <div>
      <h2>PDF 表格</h2>
      <TableRenderer htmlContent={htmlContent} />
    </div>
  );
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. 從 API 加載</h3>
              <pre className="bg-white p-3 rounded border overflow-x-auto text-sm">
{`async function loadTable() {
  const response = await fetch('/api/get-table');
  const data = await response.json();
  setHtmlContent(data.html);
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* 技術細節 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">技術細節</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">為什麼需要後處理？</h3>
              <p className="text-gray-700">
                MinerU 使用機器學習識別 PDF 表格，但有時會出現識別錯誤，
                例如將合併單元格的標題識別為分散的單元格。後處理腳本
                使用 Python + BeautifulSoup 智能修復這些問題，不需要重新識別。
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">HTML 表格格式</h3>
              <p className="text-gray-700 mb-2">
                MinerU 輸出的表格使用標準 HTML 格式，包含：
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">{`<table>`}</code> - 表格容器</li>
                <li><code className="bg-gray-100 px-1 rounded">{`<tr>`}</code> - 表格行</li>
                <li><code className="bg-gray-100 px-1 rounded">{`<td>`}</code> - 表格單元格</li>
                <li><code className="bg-gray-100 px-1 rounded">rowspan</code> - 跨越的行數</li>
                <li><code className="bg-gray-100 px-1 rounded">colspan</code> - 跨越的列數</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">性能優化</h3>
              <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
                <li>使用 React.memo 避免不必要的重渲染</li>
                <li>虛擬滾動處理大型表格</li>
                <li>延遲加載圖片資源</li>
                <li>CSS 硬件加速（transform, opacity）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
