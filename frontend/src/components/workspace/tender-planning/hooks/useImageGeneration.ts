
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Task } from "../types";

interface UseImageGenerationProps {
    fetchData: () => Promise<void>;
}

export function useImageGeneration({ fetchData }: UseImageGenerationProps) {
    const [generatingImage, setGeneratingImage] = useState(false);

    const generateImage = useCallback(
        async (taskId: string, options: any) => {
            setGeneratingImage(true);
            try {
                const response = await fetch("/api/webhook/generate-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        task_id: taskId,
                        ...options,
                    }),
                });

                if (!response.ok) {
                    throw new Error("圖片生成失敗 (Image Generation Failed)");
                }

                const result = await response.json();
                toast.success("圖片已生成 (Image Generated)");
                await fetchData();
                return result;
            } catch (error) {
                console.error("Image gen error:", error);
                toast.error(`圖片生成失敗: ${error instanceof Error ? error.message : "Unknown error"}`);
                throw error;
            } finally {
                setGeneratingImage(false);
            }
        },
        [fetchData]
    );

    return {
        generatingImage,
        generateImage
    };
}
