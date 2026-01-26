import { NextRequest, NextResponse } from 'next/server'
import { getErrorMessage } from '@/lib/errorUtils';
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // 驗證使用者
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: '未授權' }, { status: 401 })
        }

        const body = await request.json()
        const { project_id, template_id, sections } = body

        if (!project_id || !template_id || !sections) {
            return NextResponse.json(
                { error: '缺少必要參數' },
                { status: 400 }
            )
        }

        // 獲取範本資訊
        const { data: template, error: templateError } = await supabase
            .from('templates')
            .select('*')
            .eq('id', template_id)
            .single()

        if (templateError || !template) {
            return NextResponse.json(
                { error: '找不到範本' },
                { status: 404 }
            )
        }

        // 獲取專案資訊
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', project_id)
            .single()

        if (projectError || !project) {
            return NextResponse.json(
                { error: '找不到專案' },
                { status: 404 }
            )
        }

        // 準備 n8n webhook 資料
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5679/webhook/generate-document'
        
        const webhookPayload = {
            project_id,
            project_title: project.title,
            template_id,
            template_name: template.name,
            template_file_path: template.file_path,
            sections: sections.map((section: { id: string; title: string; content: string }) => ({
                id: section.id,
                title: section.title,
                content: section.content
            })),
            user_id: user.id,
            timestamp: new Date().toISOString()
        }

        // 觸發 n8n webhook
        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('❌ n8n webhook failed:', errorText)
            throw new Error(`n8n workflow failed: ${errorText}`)
        }

        const n8nResult = await n8nResponse.json()

        // 返回結果
        return NextResponse.json({
            success: true,
            message: '文件生成中',
            workflow_id: n8nResult.workflow_id || 'unknown',
            download_url: n8nResult.download_url || null
        })

    } catch (error) {
        console.error('❌ Generate document error:', error)
        return NextResponse.json(
            { error: getErrorMessage(error) || '生成文件失敗' },
            { status: 500 }
        )
    }
}

