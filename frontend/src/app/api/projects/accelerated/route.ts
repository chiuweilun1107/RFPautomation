import { createClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const shouldRefresh = searchParams.get('refresh') === 'true';

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cacheKey = `projects_list:${user.id}`;

        // 1. 嘗試從 Redis 獲取快取 (除非要求強制刷新)
        if (!shouldRefresh) {
            const cachedProjects = await redis.get(cacheKey);
            if (cachedProjects) {
                console.log('🚀 Redis Cache Hit: projects_list');
                return NextResponse.json({ data: JSON.parse(cachedProjects), source: 'cache' });
            }
        }

        // 2. 快取失效，從 Supabase 抓取
        console.log('🔄 Redis Cache Miss: Fetching from Supabase...');
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_assessments(*)
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // 3. 存入 Redis 快取 (設定 5 分鐘過期)
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);

        return NextResponse.json({ data, source: 'supabase' });
    } catch (error) {
        console.error('Speedup API Error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
