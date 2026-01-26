'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnlyOfficeEditorWithUpload } from '@/components/templates/OnlyOfficeEditorWithUpload';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

interface EditSectionPageProps {
  params: Promise<{ id: string; sectionId: string }>;
}

export default function EditSectionPage({ params }: EditSectionPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [sectionId, setSectionId] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<any>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [isMounted, setIsMounted] = React.useState(false);

  // 確保只在客戶端渲染時使用 portal
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 解析 params
  React.useEffect(() => {
    params.then(({ id, sectionId: secId }) => {
      setProjectId(id);
      setSectionId(secId);
    });
  }, [params]);

  // 獲取當前用戶
  React.useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    fetchUser();
  }, [supabase]);

  // 獲取 section 數據
  React.useEffect(() => {
    if (!sectionId) return;

    async function fetchSection() {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('id', sectionId)
        .single();

      if (error) {
        console.error('Failed to fetch section:', error);
        toast.error('載入章節失敗');
        router.back();
        return;
      }

      setSection(data);
      setLoading(false);
    }

    fetchSection();
  }, [sectionId, supabase, router]);

  const handleBack = () => {
    if (projectId) {
      router.push(`/dashboard/${projectId}/writing`);
    } else {
      router.back();
    }
  };

  const handleSaveAndClose = () => {
    toast.success('文檔已自動保存');
    handleBack();
  };

  if (loading || !section || !currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-gray-600 dark:text-gray-400" />
          <p className="text-sm font-mono font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
            Loading_Editor...
          </p>
        </div>
      </div>
    );
  }

  // 生成穩定的 document.key（用於協作編輯）
  // 所有用戶訪問同一個 section 會使用相同的 key
  const stableDocumentKey = `section_${section.id}_stable`;

  // 編輯器 UI
  const editorUI = (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-black font-mono z-[9999]">
      {/* Header - 固定高度 */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b-2 border-black dark:border-white bg-[#FA4028] text-white z-10 relative">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="rounded-none border-2 border-white bg-transparent hover:bg-white hover:text-[#FA4028] font-black uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back_To_Writing
          </Button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight italic">
              {section.title || section.content}
            </h1>
            <p className="text-[8px] uppercase tracking-widest opacity-70 flex items-center gap-2">
              <Users className="w-3 h-3" />
              Collaborative_Editing_Mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveAndClose}
            className="rounded-none border-2 border-white bg-white text-[#FA4028] hover:bg-white/90 font-black uppercase text-[10px] tracking-widest"
          >
            <Save className="w-4 h-4 mr-2" />
            Save_&_Close
          </Button>
        </div>
      </div>

      {/* Editor - 佔據剩餘空間 */}
      <div className="flex-1 min-h-0">
        <OnlyOfficeEditorWithUpload
          template={{
            id: section.id,
            name: section.title || section.content,
            file_path: section.template_file_url || undefined,
          }}
          documentKey={stableDocumentKey}
          onDocumentReady={() => {
            toast.success('編輯器已就緒，可開始協作編輯');
          }}
          onError={(error) => {
            toast.error(`載入失敗: ${error}`);
          }}
        />
      </div>
    </div>
  );

  // 使用 Portal 將編輯器渲染到 body，完全脫離 Dashboard 布局限制
  if (!isMounted) {
    return null; // 避免 SSR 錯誤
  }

  return createPortal(editorUI, document.body);
}
