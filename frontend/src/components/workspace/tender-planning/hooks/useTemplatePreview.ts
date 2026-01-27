/**
 * Template Preview Hook
 *
 * Manages template selection and preview generation
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description?: string;
}

export function useTemplatePreview(projectId: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [previewing, setPreviewing] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState<string>('');
  const supabase = createClient();

  // 載入範本列表
  useEffect(() => {
    async function loadTemplates() {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('id, name, description')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setTemplates(data);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('無法載入範本列表');
      }
    }

    loadTemplates();
  }, [supabase]);

  // 生成預覽
  const handlePreview = async () => {
    if (!selectedTemplateId) {
      toast.error('請先選擇範本');
      return;
    }

    setPreviewing(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/preview-with-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '預覽生成失敗');
      }

      const result = await response.json();

      // 直接開啟 Office Online Viewer 新分頁
      // 使用 view.aspx 獲得完整的閱讀體驗
      if (result.previewUrl) {
        const directViewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(result.previewUrl)}`;
        window.open(directViewUrl, '_blank');
        toast.success('預覽已開啟於新分頁');
      } else {
        throw new Error('無法獲取預覽連結');
      }

    } catch (error) {
      console.error('Preview error:', error);
      toast.error(error instanceof Error ? error.message : '預覽失敗');
    } finally {
      setPreviewing(false);
    }
  };

  return {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    previewing,
    previewContent,
    previewDialogOpen, // 雖然不再使用，但為了避免破壞接口先保留
    setPreviewDialogOpen,
    templateName,
    handlePreview,
  };
}
