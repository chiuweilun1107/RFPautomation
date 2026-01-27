import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Type } from "lucide-react";

export type ProjectType = 'website' | 'maintenance' | 'mobile' | 'arvr' | 'iot' | 'analytics' | 'general';

export interface TaskGenerationOptions {
    mode: 'auto' | 'manual';
    projectType?: ProjectType;
    userDescription?: string;
}

interface TaskGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sectionTitle: string;
    onGenerate: (options: TaskGenerationOptions) => Promise<void>;
}

const PROJECT_TYPE_OPTIONS = [
    { value: 'website', label: '網站建置 (Website)' },
    { value: 'maintenance', label: '系統維護 (Maintenance)' },
    { value: 'mobile', label: '移動應用 (Mobile App)' },
    { value: 'arvr', label: 'AR/VR 項目 (AR/VR)' },
    { value: 'iot', label: '物聯網 (IoT)' },
    { value: 'analytics', label: '數據分析 (Analytics)' },
    { value: 'general', label: '一般項目 (General)' }
];

const STORAGE_KEY = 'wf11_last_selection';

export function TaskGenerationDialog({
    open,
    onOpenChange,
    sectionTitle,
    onGenerate
}: TaskGenerationDialogProps) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'auto' | 'manual'>('auto');
    const [projectType, setProjectType] = useState<ProjectType>('website');
    const [userDescription, setUserDescription] = useState('');

    // Load last selection from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.mode) setMode(parsed.mode);
                if (parsed.projectType) setProjectType(parsed.projectType);
            }
        } catch (error) {
            console.error('Failed to load last selection:', error);
        }
    }, []);

    // Save selection to localStorage when mode or projectType changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                mode,
                projectType
            }));
        } catch (error) {
            console.error('Failed to save selection:', error);
        }
    }, [mode, projectType]);

    const handleGenerateClick = async () => {
        setLoading(true);
        try {
            await onGenerate({
                mode,
                projectType: mode === 'manual' ? projectType : undefined,
                userDescription: userDescription.trim() || undefined
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Task generation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    生成任務 PRD
                </div>
            }
            description={`為章節「${sectionTitle}」生成產品需求文檔`}
            maxWidth="lg"
            loading={loading}
            showFooter={true}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleGenerateClick} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loading ? "生成中..." : "開始生成"}
                    </Button>
                </div>
            }
        >
            <div className="py-4">
                <Tabs value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="auto" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            AI 智慧判斷
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            手動選擇類型
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="auto" className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">AI 將自動分析模組名稱和文件內容，選擇最合適的項目類型：</p>
                            <ul className="list-disc pl-5 space-y-1 opacity-90">
                                <li>網站建置 (website)</li>
                                <li>系統維護 (maintenance)</li>
                                <li>移動應用 (mobile)</li>
                                <li>AR/VR 項目 (arvr)</li>
                                <li>物聯網 (iot)</li>
                                <li>數據分析 (analytics)</li>
                                <li>一般項目 (general)</li>
                            </ul>
                        </div>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4">
                        <div className="grid gap-2">
                            <Label>選擇項目類型</Label>
                            <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" className="z-[9999]">
                                    {PROJECT_TYPE_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>

                    <div className="mt-6 border-t pt-4">
                        <Label className="mb-2 block">補充描述（可選）</Label>
                        <Textarea
                            placeholder="例如：需要支援手機版、需要多語言、需要整合第三方 API..."
                            value={userDescription}
                            onChange={(e) => setUserDescription(e.target.value)}
                            className="h-24 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            補充描述將傳遞給 AI，幫助生成更符合需求的內容。
                        </p>
                    </div>
                </Tabs>
            </div>
        </BaseDialog>
    );
}
