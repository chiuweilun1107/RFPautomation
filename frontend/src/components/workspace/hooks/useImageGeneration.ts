import { useState, useCallback } from "react";
import { TaskImage } from "../types";

export type ImageGenerationMode = "auto" | "manual" | "custom";

export interface ImageGenerationOptions {
    type: string;
    customPrompt?: string;
    referenceImage?: string; // base64
    aspectRatio?: string;
}

export interface UseImageGenerationProps {
    onGenerate: (options: ImageGenerationOptions) => Promise<void>;
    onUpload?: (file: File) => Promise<string>;
    onClose: () => void;
}

export interface UseImageGenerationReturn {
    // State
    loading: boolean;
    mode: ImageGenerationMode;
    selectedType: string;
    aspectRatio: string;
    customPrompt: string;
    referenceImage: string | null;
    selectedGalleryId: string | null;

    // Actions
    setMode: (mode: ImageGenerationMode) => void;
    setSelectedType: (type: string) => void;
    setAspectRatio: (ratio: string) => void;
    setCustomPrompt: (prompt: string) => void;
    clearReferenceImage: () => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleGallerySelect: (img: TaskImage) => Promise<void>;
    handleGenerate: () => Promise<void>;
}

export function useImageGeneration({
    onGenerate,
    onUpload,
    onClose,
}: UseImageGenerationProps): UseImageGenerationReturn {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<ImageGenerationMode>("auto");
    const [selectedType, setSelectedType] = useState("flowchart");
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [customPrompt, setCustomPrompt] = useState("");
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

    const clearReferenceImage = useCallback(() => {
        setReferenceImage(null);
        setSelectedGalleryId(null);
    }, []);

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (onUpload) {
                setLoading(true);
                try {
                    const uploadedUrl = await onUpload(file);
                    setReferenceImage(uploadedUrl);
                    setSelectedGalleryId(null);
                } catch (error) {
                    console.error("Upload failed", error);
                } finally {
                    setLoading(false);
                }
            } else {
                // Fallback to local preview if no upload handler
                const reader = new FileReader();
                reader.onloadend = () => {
                    setReferenceImage(reader.result as string);
                    setSelectedGalleryId(null);
                };
                reader.readAsDataURL(file);
            }
        },
        [onUpload]
    );

    const handleGallerySelect = useCallback(async (img: TaskImage) => {
        try {
            setSelectedGalleryId(img.id);
            // Fetch the image and convert to base64
            const response = await fetch(img.image_url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error("Failed to load gallery image", error);
        }
    }, []);

    const handleGenerate = useCallback(async () => {
        setLoading(true);
        try {
            await onGenerate({
                type: mode === "manual" ? selectedType : mode,
                customPrompt: mode === "custom" ? customPrompt : undefined,
                referenceImage: referenceImage || undefined,
                aspectRatio,
            });
            onClose();
        } catch (error) {
            console.error("Image generation failed:", error);
        } finally {
            setLoading(false);
        }
    }, [mode, selectedType, customPrompt, referenceImage, aspectRatio, onGenerate, onClose]);

    return {
        // State
        loading,
        mode,
        selectedType,
        aspectRatio,
        customPrompt,
        referenceImage,
        selectedGalleryId,

        // Actions
        setMode,
        setSelectedType,
        setAspectRatio,
        setCustomPrompt,
        clearReferenceImage,
        handleFileChange,
        handleGallerySelect,
        handleGenerate,
    };
}
