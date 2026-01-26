
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    try {
        const supabase = await createClient();

        // 1. Fetch Project Details
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('title, status')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            throw new Error('Project not found');
        }

        // 2. Fetch Tasks with Drafts
        // Join with sections to confirm order if needed, but for now simple task list
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select(`
                id, 
                title, 
                description, 
                response_draft,
                section_id
            `)
            .eq('project_id', projectId)
            .not('response_draft', 'is', null) // Only tasks with drafts
            .order('section_id', { ascending: true }) // Rough ordering
        //.order('created_at', { ascending: true }); // Fallback

        if (tasksError) {
            throw tasksError;
        }

        const validTasks = tasks ? tasks.filter(t => t.response_draft && t.response_draft.trim().length > 0) : [];

        // 3. Generate DOCX
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        // Project Title
                        new Paragraph({
                            text: project.title,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                        }),

                        // Tasks
                        ...validTasks.flatMap(task => [
                            // Task Title
                            new Paragraph({
                                text: task.title || "Untitled Task",
                                heading: HeadingLevel.HEADING_2,
                                spacing: { before: 400, after: 200 },
                            }),
                            // Draft Content (Split by newlines to create paragraphs)
                            ...(task.response_draft?.split('\n').map((line: string) =>
                                new Paragraph({
                                    children: [new TextRun(line)],
                                    spacing: { after: 100 }
                                })
                            ) || [])
                        ])
                    ],
                },
            ],
        });

        // 4. Pack into Buffer
        const buffer = await Packer.toBuffer(doc);

        // 5. Return Response
        const filename = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.docx`;

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to export document' },
            { status: 500 }
        );
    }
}
