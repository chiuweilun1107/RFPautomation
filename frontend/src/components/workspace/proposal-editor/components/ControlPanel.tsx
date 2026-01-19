"use client";

import { Button } from "@/components/ui/button";
import { FolderPlus, Download, Upload } from "lucide-react";

interface ControlPanelProps {
    onAddSection?: () => void;
    onImport?: () => void;
    onExport?: () => void;
    isLoading?: boolean;
}

/**
 * 控制面板 - 顶部操作栏
 */
export function ControlPanel({
    onAddSection,
    onImport,
    onExport,
    isLoading = false,
}: ControlPanelProps) {
    return (
        <div className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            {/* Add Section Button */}
            {onAddSection && (
                <Button
                    onClick={onAddSection}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                >
                    <FolderPlus className="w-4 h-4" />
                    New Chapter
                </Button>
            )}

            <div className="flex-1" />

            {/* Import/Export Buttons */}
            {onImport && (
                <Button
                    onClick={onImport}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                >
                    <Upload className="w-4 h-4" />
                    Import
                </Button>
            )}

            {onExport && (
                <Button
                    onClick={onExport}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                >
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            )}
        </div>
    );
}
