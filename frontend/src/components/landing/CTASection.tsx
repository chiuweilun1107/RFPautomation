import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 p-12 md:p-16 lg:p-20 shadow-2xl">

          {/* 裝飾性漸層 */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl" />

          {/* 內容 */}
          <div className="relative z-10 max-w-[800px] mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              準備好提升您的提案效率了嗎？
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              加入 500+ 企業，讓 AI 幫您贏得更多標案
            </p>

            {/* CTA 按鈕 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="h-16 px-12 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 shadow-xl w-full sm:w-auto"
                >
                  免費開始使用
                  <span className="ml-2">→</span>
                </Button>
              </Link>
              <Link href="mailto:contact@example.com">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-12 text-lg font-semibold border-2 border-white text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  聯絡銷售團隊
                </Button>
              </Link>
            </div>

            {/* 額外資訊 */}
            <p className="mt-8 text-sm text-blue-200">
              14 天免費試用 • 隨時取消 • 無需信用卡
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
