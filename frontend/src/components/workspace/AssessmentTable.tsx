
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CitationRenderer } from "./CitationRenderer";
import { Evidence } from "./CitationBadge";
import { SourceDetailPanel } from "./SourceDetailPanel";

// Mock Data for Verification (Simulating NotebookLM output)
const MOCK_ASSESSMENT_DATA = {
    summary: {
        label: "標案摘要",
        content: "本案旨在建置「新一代 AI 智慧客服系統」，透過導入大型語言模型 (LLM) 技術，優化現有民眾諮詢流程 [1]。執行範圍包含：系統架構規劃、AI 模型微調 (Fine-tuning)、知識庫建置 [1]、以及與現有 CRM 系統之介接整合 [2]。",
    },
    basic_info: {
        label: "基本資料",
        content: "標案名稱：114年度 AI 智慧服務精進計畫\n案號：114-AI-001\n機關：數位發展部 [4]\n性質：勞務採購 (限制性招標) [3]",
    },
    budget: {
        label: "預算/金額",
        content: "新台幣 8,500,000 元整 (採固定金額給付) [3]。\n註：本案保留後續擴充權利，期間 1 年，金額上限 200 萬元 [3]。",
    },
    dates: {
        label: "關鍵日期",
        content: "截止投標：114年1月15日 17:00 [4]。\n開標時間：114年1月16日 10:00 [4]。\n評選簡報：時間與地點將另行通知合格廠商。",
    },
    risks: {
        label: "主要風險",
        content: "1. 資安要求高：需通過源碼檢測與弱點掃描，未通過無法驗收 [5]。\n2. 罰則：逾期違約金為每日契約價金總額 1‰ (千分之一) [6]。"
    }
};

const MOCK_EVIDENCES: Record<string, Evidence> = {
    "1": { id: 1, source_id: "doc-1", page: 1, source_title: "建議書徵求文件.pdf", quote: "本計畫旨在透過導入LLM技術...優化民眾諮詢體驗...包含架構規劃、Knowledge Base建置" },
    "2": { id: 2, source_id: "doc-1", page: 2, source_title: "建議書徵求文件.pdf", quote: "廠商需負責與現行CRM系統進行API對接..." },
    "3": { id: 3, source_id: "doc-2", page: 3, source_title: "投標須知.pdf", quote: "本案預算金額為新台幣8,500,000元整...保留後續擴充權利..." },
    "4": { id: 4, source_id: "doc-2", page: 1, source_title: "投標須知.pdf", quote: "機關名稱：數位發展部...截止投標時間：114年1月15日..." },
    "5": { id: 5, source_id: "doc-3", page: 8, source_title: "資安規範書.pdf", quote: "...必須通過源碼檢測(Code Review)及弱點掃描，報告須為高風險0項..." },
    "6": { id: 6, source_id: "doc-4", page: 12, source_title: "契約草案.pdf", quote: "逾期違約金，以日為單位，按契約價金總額千分之一計算..." },
};

export function AssessmentTable() {
    const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

    const handleCitationClick = (evidence: Evidence) => {
        setSelectedEvidence(evidence);
    };

    return (
        <div className="flex w-full h-full gap-6 relative">
            {/* Main Content Area */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">標案初評分析 (Assessment)</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Summary - Full Width */}
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle>{MOCK_ASSESSMENT_DATA.summary.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm leading-7 text-muted-foreground">
                                <CitationRenderer
                                    text={MOCK_ASSESSMENT_DATA.summary.content}
                                    evidences={MOCK_EVIDENCES}
                                    onCitationClick={handleCitationClick}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Other Fields */}
                    {Object.entries(MOCK_ASSESSMENT_DATA).map(([key, data]) => {
                        if (key === 'summary') return null;
                        return (
                            <Card key={key}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{data.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm leading-7 text-muted-foreground whitespace-pre-line">
                                        <CitationRenderer
                                            text={data.content}
                                            evidences={MOCK_EVIDENCES}
                                            onCitationClick={handleCitationClick}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Slide-over Source Panel */}
            {selectedEvidence && (
                <div className="sticky top-4 h-[calc(100vh-140px)]">
                    <SourceDetailPanel
                        evidence={selectedEvidence}
                        onClose={() => setSelectedEvidence(null)}
                    />
                </div>
            )}
        </div>
    );
}
