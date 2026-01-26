/**
 * TenderToolbar Component
 *
 * Action toolbar with save button and loading states.
 */

import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenderToolbarProps {
    /** Whether save operation is in progress */
    saving: boolean;
    /** Save handler callback */
    onSave: () => void;
}

/**
 * Simple toolbar with save functionality
 */
export function TenderToolbar({ saving, onSave }: TenderToolbarProps) {
    return (
        <div className="flex justify-end mb-8 max-w-4xl mx-auto">
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
