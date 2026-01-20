import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function DebugTemplatePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !template) {
    notFound();
  }

  return (
    <div className="p-8 bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-4">Template Debug Info</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Basic Info</h2>
        <p><strong>ID:</strong> {template.id}</p>
        <p><strong>Name:</strong> {template.name}</p>
        <p><strong>Version:</strong> {template.template_version || 'N/A'}</p>
        <p><strong>Engine:</strong> {template.engine || 'N/A'}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Headers & Footers</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(template.headers_footers, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Numbering Definitions</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(template.numbering_definitions, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Paragraphs (first 3)</h2>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(template.paragraphs?.slice(0, 3), null, 2)}
        </pre>
      </div>
    </div>
  );
}
