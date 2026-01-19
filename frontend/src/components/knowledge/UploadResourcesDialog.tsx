"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BaseDialog } from "@/components/common"
import { UploadZone } from "./UploadZone"

export function UploadResourcesDialog({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const [open, setOpen] = React.useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="rounded-none border-2 border-black bg-black hover:bg-zinc-800 text-white font-mono uppercase tracking-[0.2em] px-6"
            >
                <Plus className="mr-2 h-4 w-4" />
                INGEST_RESOURCE
            </Button>

            <BaseDialog
                open={open}
                onOpenChange={setOpen}
                title="Resource_Ingestion // PORT_01"
                description="// UPLOAD_DATA_FOR_MODEL_SYNCHRONIZATION."
                maxWidth="lg"
                showFooter={true}
                footer={
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-none border-2 border-black font-mono font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                        >
                            CLOSE_PORT
                        </Button>
                    </div>
                }
            >
                <div className="border-[1.5px] border-black dark:border-white p-2">
                    <UploadZone onCloseDialog={() => setOpen(false)} />
                </div>
            </BaseDialog>
        </>
    )
}
