import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export async function POST(request: Request) {
    try {
        const { url, project_id } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 1. Fetch Web Page Content
        let content = '';
        let title = url;

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.status}`);
            }

            const html = await response.text();

            // 2. Parse HTML with JSDOM
            const dom = new JSDOM(html, { url });
            const doc = dom.window.document;

            // 3. Extract Main Content with Readability (NotebookLM style)
            // Readability strips navs, footers, ads, and sidebars.
            const reader = new Readability(doc);
            const article = reader.parse();

            // 4. Convert to Markdown
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                hr: '---',
                bulletListMarker: '-',
                emDelimiter: '*'
            });

            // Remove scripts and styles explicitly if Reader didn't catch them (Reader usually does)
            turndownService.remove(['script', 'style', 'noscript', 'iframe', 'svg'] as any);

            if (article && article.content) {
                title = article.title || title;
                // Convert the "reader view" HTML to Markdown
                content = turndownService.turndown(article.content);

                // Add metadata header
                content = `# ${title}\n\n${content}`;
            } else {
                // Fallback: If Readability fails to find an article, try to convert the body
                // but still create a cleaner version than raw regex
                console.warn('Readability failed to identify article, falling back to body cleanup');
                const body = doc.body;
                if (body) {
                    content = turndownService.turndown(body.innerHTML);
                }
            }

            // Cleanup whitespace
            content = content.trim();

        } catch (fetchError: any) {
            console.error('Fetch URL error:', fetchError);
            return NextResponse.json({
                error: `無法抓取網頁：${fetchError.message}`
            }, { status: 400 });
        }

        if (!content || content.length < 50) {
            return NextResponse.json({
                error: '網頁內容太少或無法解析'
            }, { status: 400 });
        }

        const supabase = await createClient();

        // 5. Create Source Record
        const { data: source, error: insertError } = await supabase
            .from('sources')
            .insert({
                title,
                origin_url: url,
                type: 'web_crawl',
                content,
                status: 'processing',
                project_id: project_id || null,
                source_type: 'url'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // 6. Link to Project
        if (project_id) {
            const { error: linkError } = await supabase
                .from('project_sources')
                .insert({
                    project_id,
                    source_id: source.id
                });

            if (linkError) {
                console.warn('Auto-link warning:', linkError);
            }
        }

        return NextResponse.json({
            success: true,
            source,
            message: '網頁內容已優化並添加，正在處理中...'
        });

    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
