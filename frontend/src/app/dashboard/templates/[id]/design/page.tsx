import { TemplateDesigner } from "@/components/templates/TemplateDesigner";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function TemplateDesignPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 獲取範本資料
  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !template) {
    notFound();
  }

  return (
    <>
      <TemplateDesigner template={template} />
    </>
  );
}