export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "上傳招標文件",
      description: "支援 PDF、DOCX、Excel 等多種格式，系統自動解析需求和評分標準。",
    },
    {
      number: "02",
      title: "AI 智慧配對",
      description: "從知識庫中搜尋相關內容，AI 自動生成初稿，節省 80% 的編寫時間。",
    },
    {
      number: "03",
      title: "團隊協作優化",
      description: "團隊成員共同編輯、審核，AI 持續學習改進，確保回應質量。",
    },
    {
      number: "04",
      title: "一鍵生成文件",
      description: "保留格式，匯出完整提案，直接提交。支援 Word、PDF 多種格式。",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950">
      <div className="container mx-auto px-4 md:px-6">

        {/* 區塊標題 */}
        <div className="text-center mb-16">
          <div className="inline-block rounded-full bg-teal-100 dark:bg-teal-900/30 px-4 py-2 text-sm font-medium text-teal-700 dark:text-teal-300 mb-4">
            簡單流程
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            4 步驟完成提案
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-[600px] mx-auto">
            從上傳到生成，只需幾分鐘
          </p>
        </div>

        {/* 步驟展示 */}
        <div className="relative max-w-[1000px] mx-auto">

          {/* 連接線（桌面版） */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-teal-200 to-blue-200 dark:from-blue-900 dark:via-teal-900 dark:to-blue-900" />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative">

                {/* 步驟卡片 */}
                <div className="relative z-10 text-center">

                  {/* 圓形編號 */}
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>

                  {/* 標題 */}
                  <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                    {step.title}
                  </h3>

                  {/* 描述 */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
