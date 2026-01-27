/**
 * Template Preview Dialog Component
 *
 * Shows a preview of the outline with template formatting applied.
 * Uses Microsoft Office Online Viewer to display .docx files.
 */

import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface TemplatePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    previewContent?: string; // Now this is the file URL
    templateName?: string;
}

/**
 * Dialog component for previewing template-formatted content
 * Uses Microsoft Office Online to render .docx files
 */
export function TemplatePreviewDialog({
    open,
    onOpenChange,
    previewContent,
    templateName
}: TemplatePreviewDialogProps) {
    // 生成 Microsoft Office Online 預覽 URL
    const officeViewerUrl = previewContent
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewContent)}`
        : '';

    const handleDownload = () => {
        if (previewContent) {
            const link = document.createElement('a');
            link.href = previewContent;
            link.download = `${templateName || 'preview'}.docx`;
            link.click();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* 
                Redesigned:
                - max-w-5xl: Standard document reading width (better than full screen width)
                - h-[95vh]: Maximum vertical space for content
                - p-0 gap-0: Remove default padding/gap for custom layout 
                - bg-background/95 backdrop-blur-md: Modern glass effect
                - border-white/10: Subtle border
                - overflow-hidden: Prevent body scroll, let iframe scroll
            */}
            <DialogContent className="max-w-5xl w-full h-[95vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-md border border-white/10 sm:rounded-lg overflow-hidden focus:outline-none">

                {/* Header: Minimalist, compact */}
                <DialogHeader className="flex-none px-4 py-3 border-b border-border/40 flex flex-row items-center justify-between space-y-0 min-h-[50px]">
                    <div className="flex flex-row items-baseline gap-3">
                        <DialogTitle className="text-lg font-medium tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                            範本預覽
                        </DialogTitle>
                        {templateName && (
                            <p className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium translate-y-[-1px]">
                                {templateName}
                            </p>
                        )}
                    </div>
                </DialogHeader>

                {/* Content: Iframe takes all remaining space */}
                <div className="flex-1 w-full bg-muted/20 relative">
                    {officeViewerUrl ? (
                        // iframe content itself scrolls
                        <iframe
                            src={officeViewerUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            title="Document Preview"
                        >
                            <p className="p-4 text-center">您的瀏覽器不支援 iframe。請點擊下載按鈕下載檔案。</p>
                        </iframe>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                            <span className="text-sm tracking-wide">載入預覽中...</span>
                        </div>
                    )}
                </div>

                {/* Footer: Compact */}
                <div className="flex-none px-4 py-2 border-t border-border/40 bg-background/50 backdrop-blur-sm flex justify-between items-center min-h-[50px]">
                    <div className="text-[10px] text-muted-foreground/60 font-mono hidden sm:block">
                        POWERED BY OFFICE ONLINE
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleDownload}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-mono tracking-wide hover:bg-muted/50"
                            disabled={!previewContent}
                        >
                            <Download className="mr-2 h-3 w-3" />
                            下載
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="default"
                            size="sm"
                            className="h-8 text-xs font-mono tracking-wide bg-primary/90 hover:bg-primary shadow-sm"
                        >
                            <X className="mr-2 h-3 w-3" />
                            關閉
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
