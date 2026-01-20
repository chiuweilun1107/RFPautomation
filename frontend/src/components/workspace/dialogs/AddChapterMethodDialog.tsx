"use client";

import { BaseDialog } from "@/components/common";
import { Button } from "@/components/ui/button";
import { FileText, Sparkles, PenTool } from "lucide-react";

interface AddChapterMethodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectMethod: (method: 'manual' | 'ai' | 'template') => void;
    title?: string;
    context?: 'chapter' | 'section';
}

export function AddChapterMethodDialog({
    open,
    onOpenChange,
    onSelectMethod,
    title = "ADD_NEW_CHAPTER",
    context = 'chapter',
}: AddChapterMethodDialogProps) {

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description="// SELECT_METHOD"
            maxWidth="2xl"
            showFooter={false}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 w-full overflow-x-hidden p-1">
                {/* Method 1: Manual */}
                <button
                    onClick={() => onSelectMethod('manual')}
                    className="group relative flex flex-col items-center justify-center p-4 border-2 border-black dark:border-white bg-white dark:bg-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                    <PenTool className="w-10 h-10 mb-3 stroke-[1.5]" />
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">MANUAL<br />ENTRY</h3>
                    <p className="text-[10px] font-mono opacity-60 text-center uppercase leading-tight">
                        {context === 'chapter' ? 'Create a blank chapter row manually' : 'Create a blank section row'}
                    </p>
                </button>

                {/* Method 2: AI Generation */}
                <button
                    onClick={() => onSelectMethod('ai')}
                    className="group relative flex flex-col items-center justify-center p-4 border-2 border-black dark:border-white bg-white dark:bg-black hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                    <Sparkles className="w-10 h-10 mb-3 stroke-[1.5]" />
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">AI<br />{context === 'chapter' ? 'GENERATION' : 'MARKER'}</h3>
                    <p className="text-[10px] font-mono opacity-60 text-center uppercase leading-tight">
                        {context === 'chapter' ? 'Auto-generate structure from requirements' : 'Mark for AI drafting (Writing Stage)'}
                    </p>
                </button>

                {/* Method 3: Template */}
                <button
                    onClick={() => onSelectMethod('template')}
                    className="group relative flex flex-col items-center justify-center p-4 border-2 border-black dark:border-white bg-white dark:bg-black hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                    <FileText className="w-10 h-10 mb-3 stroke-[1.5]" />
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">TEMPLATE<br />IMPORT</h3>
                    <p className="text-[10px] font-mono opacity-60 text-center uppercase leading-tight">
                        {context === 'chapter' ? 'Import structure from DOCX file' : 'Mark for Template Upload'}
                    </p>
                </button>
            </div>

            <div className="flex justify-center mt-4">
                <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-black dark:hover:text-white"
                >
                    Cancel Selection
                </Button>
            </div>
        </BaseDialog>
    );
}
