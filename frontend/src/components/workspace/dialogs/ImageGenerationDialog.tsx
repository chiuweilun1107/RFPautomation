import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Image as ImageIcon, Wand2, Type, Layout, Smartphone, Monitor } from "lucide-react";
import { Task, TaskImage } from "../types";
import { useImageGeneration, ImageGenerationOptions, ImageGenerationMode } from "../hooks/useImageGeneration";

export type { ImageGenerationOptions };

interface ImageGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    projectImages?: TaskImage[];
    onGenerate: (options: ImageGenerationOptions) => Promise<void>;
    onUpload?: (file: File) => Promise<string>;
}

export function ImageGenerationDialog({
    open,
    onOpenChange,
    task,
    projectImages = [],
    onGenerate,
    onUpload
}: ImageGenerationDialogProps) {
    const {
        loading,
        mode,
        selectedType,
        aspectRatio,
        customPrompt,
        referenceImage,
        selectedGalleryId,
        setMode,
        setSelectedType,
        setAspectRatio,
        setCustomPrompt,
        clearReferenceImage,
        handleFileChange,
        handleGallerySelect,
        handleGenerate,
    } = useImageGeneration({
        onGenerate,
        onUpload,
        onClose: () => onOpenChange(false),
    });

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    生成視覺化圖片
                </div>
            }
            description={`為任務「${task?.requirement_text.slice(0, 20) || ''}...」生成視覺化圖片`}
            maxWidth="lg"
            loading={loading}
            showFooter={true}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleGenerate} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loading ? "生成中..." : "開始生成"}
                    </Button>
                </div>
            }
        >
            <div className="py-4">
                <Tabs value={mode} onValueChange={(v) => setMode(v as ImageGenerationMode)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="auto" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            AI 智慧生成
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            手動選擇類型
                        </TabsTrigger>
                        <TabsTrigger value="custom" className="flex items-center gap-2">
                            <Wand2 className="w-4 h-4" />
                            自訂描述
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="auto" className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium mb-1">AI 將自動分析任務內容並選擇最合適的圖片類型，您也可以上傳參考圖輔助：</p>
                            <ul className="list-disc pl-5 space-y-1 opacity-90">
                                <li>流程圖、系統架構圖 (結構參考)</li>
                                <li>UI 截圖 (風格參考)</li>
                            </ul>
                        </div>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4">
                        <div className="grid gap-2">
                            <Label>選擇圖片類型</Label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="flowchart">流程圖 (Flowchart)</SelectItem>
                                    <SelectItem value="architecture">系統架構圖 (Architecture)</SelectItem>
                                    <SelectItem value="ui_concept">UI 介面概念圖 (UI Mockup)</SelectItem>
                                    <SelectItem value="infographic">資訊圖表 (Infographic)</SelectItem>
                                    <SelectItem value="hero">網站形象圖 (Hero Image)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4">
                        <div className="grid gap-2">
                            <Label>輸入圖片描述 (Prompt)</Label>
                            <Textarea
                                placeholder="例如：一張現代科技風格的數據儀表板，深色背景，帶有霓虹光效..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="h-32 resize-none"
                            />
                        </div>
                    </TabsContent>

                    <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />

                    <ReferenceImageSection
                        projectImages={projectImages}
                        referenceImage={referenceImage}
                        selectedGalleryId={selectedGalleryId}
                        onFileChange={handleFileChange}
                        onGallerySelect={handleGallerySelect}
                        onClear={clearReferenceImage}
                    />
                </Tabs>
            </div>
        </BaseDialog>
    );
}

// Sub-components for better organization

interface AspectRatioSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
    return (
        <div className="grid gap-2 mt-4">
            <Label>圖片比例 (Aspect Ratio)</Label>
            <Tabs value={value} onValueChange={onChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="16:9" className="text-xs">
                        <Monitor className="w-3 h-3 mr-1" />
                        16:9 寬螢幕
                    </TabsTrigger>
                    <TabsTrigger value="9:16" className="text-xs">
                        <Smartphone className="w-3 h-3 mr-1" />
                        9:16 手機版
                    </TabsTrigger>
                    <TabsTrigger value="3:4" className="text-xs">
                        <Layout className="w-3 h-3 mr-1" />
                        3:4 縱向
                    </TabsTrigger>
                    <TabsTrigger value="1:1" className="text-xs">
                        <div className="w-3 h-3 border-2 border-current rounded-sm mr-1" />
                        1:1 正方形
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}

interface ReferenceImageSectionProps {
    projectImages: TaskImage[];
    referenceImage: string | null;
    selectedGalleryId: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onGallerySelect: (img: TaskImage) => void;
    onClear: () => void;
}

function ReferenceImageSection({
    projectImages,
    referenceImage,
    selectedGalleryId,
    onFileChange,
    onGallerySelect,
    onClear,
}: ReferenceImageSectionProps) {
    return (
        <div className="mt-6 border-t pt-4">
            <Label className="mb-2 block">參考圖片 (Reference Image)</Label>

            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="upload">本機上傳</TabsTrigger>
                    <TabsTrigger value="gallery">專案圖庫 ({projectImages.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-0">
                    <UploadTab
                        referenceImage={referenceImage}
                        onFileChange={onFileChange}
                        onClear={onClear}
                    />
                </TabsContent>

                <TabsContent value="gallery" className="mt-0">
                    <GalleryTab
                        projectImages={projectImages}
                        selectedGalleryId={selectedGalleryId}
                        onGallerySelect={onGallerySelect}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface UploadTabProps {
    referenceImage: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
}

function UploadTab({ referenceImage, onFileChange, onClear }: UploadTabProps) {
    return (
        <div className="flex gap-4 items-start">
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-950">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">點擊上傳</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
            </label>

            {referenceImage && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-gray-100">
                    <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                    <button
                        onClick={onClear}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="text-xs text-gray-500 flex-1 pt-2 space-y-1">
                <p>上傳圖片讓 AI 參考其風格、配色或版面配置。</p>
                <p>支援 JPG, PNG 格式。</p>
            </div>
        </div>
    );
}

interface GalleryTabProps {
    projectImages: TaskImage[];
    selectedGalleryId: string | null;
    onGallerySelect: (img: TaskImage) => void;
}

function GalleryTab({ projectImages, selectedGalleryId, onGallerySelect }: GalleryTabProps) {
    if (projectImages.length === 0) {
        return (
            <>
                <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed">
                    <p>此專案尚未生成任何圖片</p>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    <p>點選圖片即可將其設為參考素材。</p>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                {projectImages.map((img) => (
                    <div
                        key={img.id}
                        className={`relative aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all group ${
                            selectedGalleryId === img.id
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => onGallerySelect(img)}
                    >
                        <img src={img.image_url} alt="Project Asset" className="w-full h-full object-cover" />
                        {selectedGalleryId === img.id && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="bg-blue-500 text-white rounded-full p-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
                <p>點選圖片即可將其設為參考素材。</p>
            </div>
        </>
    );
}
