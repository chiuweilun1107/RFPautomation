/**
 * useImageGeneration Hook
 * 管理图片生成逻辑
 */

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ImageGenerationOptions } from '../types';

/**
 * 返回類型定義
 */
export interface UseImageGenerationReturn {
  generatingImage: boolean;
  handleGenerateTaskImage: (taskId: string, options: ImageGenerationOptions) => Promise<void>;
  handleDeleteImage: (imageId: string) => Promise<void>;
}

/**
 * 图片生成 Hook
 */
export function useImageGeneration(projectId: string) {
  const supabase = createClient();
  const [generatingImage, setGeneratingImage] = useState(false);

  // TODO: 实现 handleGenerateTaskImage
  const handleGenerateTaskImage = useCallback(
    async (taskId: string, options: ImageGenerationOptions) => {
      setGeneratingImage(true);
      try {
        // 待实现
        // TODO: Implement task image generation
      } finally {
        setGeneratingImage(false);
      }
    },
    [projectId, supabase]
  );

  // TODO: 实现 handleDeleteImage
  const handleDeleteImage = useCallback(
    async (taskId: string, imageUrl: string) => {
      try {
        // 待实现
        // TODO: Implement image deletion
      } catch (error) {
        toast.error('删除图片失败');
      }
    },
    [projectId, supabase]
  );

  return {
    generatingImage,
    handleGenerateTaskImage,
    handleDeleteImage,
  };
}
