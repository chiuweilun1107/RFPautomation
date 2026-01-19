"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UploadZone } from "./UploadZone"

export function UploadResourcesDialog({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const [open, setOpen] = React.useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-none border-2 border-black bg-black hover:bg-zinc-800 text-white font-mono uppercase tracking-[0.2em] px-6">
                    <Plus className="mr-2 h-4 w-4" />
                    INGEST_RESOURCE
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] rounded-none border-4 border-black p-0">
                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight">Resource_Ingestion // PORT_01</DialogTitle>
                        <DialogDescription className="font-mono text-black dark:text-gray-400 uppercase text-xs mt-2 italic font-bold">
                            // UPLOAD_DATA_FOR_MODEL_SYNCHRONIZATION.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border-[1.5px] border-black dark:border-white p-2">
                        <UploadZone />
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-none border-2 border-black font-mono font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                        >
                            CLOSE_PORT
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
