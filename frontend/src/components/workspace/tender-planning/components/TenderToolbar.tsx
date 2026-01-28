/**
 * TenderToolbar Component
 *
 * Action toolbar with template selection, preview, and save functionality.
 */

import { Save, Loader2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TenderToolbarProps {
    /** Whether save operation is in progress */
    saving: boolean;
    /** Save handler callback */
    onSave: () => void;
    /** Selected template ID */
    selectedTemplateId?: string;
    /** Available templates */
    templates?: Array<{ id: string; name: string }>;
    /** Template selection handler */
    onTemplateSelect?: (templateId: string) => void;
    /** Preview handler */
    onPreview?: () => void;
    /** Whether preview is loading */
    previewing?: boolean;
}

/**
 * Toolbar with template selection and save functionality
 */
export function TenderToolbar({
    saving,
    onSave,
    selectedTemplateId,
    templates = [],
    onTemplateSelect,
    onPreview,
    previewing = false
}: TenderToolbarProps) {
    return (
        <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto gap-4">
            {/* Left: Template Selection */}
            <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Select value={selectedTemplateId} onValueChange={onTemplateSelect}>
                    <SelectTrigger className="w-[280px] rounded-none border-2 border-black dark:border-white font-mono text-xs">
                        <SelectValue placeholder="選擇範本..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-black dark:border-white">
                        {templates.map((template) => (
                            <SelectItem
                                key={template.id}
                                value={template.id}
                                className="font-mono text-xs"
                            >
                                {template.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Preview Button */}
                <Button
                    onClick={onPreview}
                    disabled={!selectedTemplateId || previewing}
                    variant="outline"
                    className="rounded-none border-2 border-black dark:border-white font-mono text-xs hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028]"
                >
                    {previewing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            預覽中...
                        </>
                    ) : (
                        <>
                            <Eye className="mr-2 h-4 w-4" />
                            預覽
                        </>
                    )}
                </Button>
            </div>

            {/* Right: Save Button */}
            <Button
                onClick={onSave}
                disabled={saving}
                className="rounded-none bg-black text-white hover:bg-[#FA4028] dark:bg-white dark:text-black dark:hover:bg-[#FA4028] transition-colors border-2 border-transparent hover:border-black font-bold uppercase tracking-wider"
            >
                {saving ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        SAVING...
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        SAVE_STRUCTURE
                    </>
                )}
            </Button>
        </div>
    );
}
