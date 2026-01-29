import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { aiRateLimiter } from '@/lib/rate-limiter';

/**
 * Azure OpenAI Chat Completions API (OpenAI 兼容路徑)
 *
 * 路徑：/api/ai-proxy/azure-openai/v1/chat/completions
 * 兼容 OpenAI API 標準格式
 */

// 智能查找欄位值（自動適應不同的欄位名稱）
function getField(data: any, fieldType: 'name' | 'agency' | 'summary' | 'description'): string | undefined {
  if (!data) return undefined;

  const fieldMaps = {
    name: ['name', 'title', 'project_name', 'tender_name', 'tender_title'],
    agency: ['agency_entity', 'agency', 'agency_name', 'organization'],
    summary: ['requirement_summary', 'summary', 'requirements', 'brief'],
    description: ['description', 'desc', 'details', 'content']
  };

  const possibleFields = fieldMaps[fieldType];
  for (const field of possibleFields) {
    if (data[field]) {
      return data[field];
    }
  }
  return undefined;
}

// Azure OpenAI 配置（從環境變數讀取）
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

const RATE_LIMIT_MAX_REQUESTS = 20;

export async function POST(request: NextRequest) {
  try {
    // 1. 驗證環境變數配置
    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY || !AZURE_OPENAI_DEPLOYMENT || !AZURE_OPENAI_API_VERSION) {
      console.error('[AI Proxy v1] Missing Azure OpenAI configuration');
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }

    // 2. 驗證用戶身份
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // 檢查請求來源
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // 允許來自 onlyoffice.decaza.org 的請求（跨域無法攜帶 cookie）
    const isFromOnlyOffice =
      origin?.includes('onlyoffice.decaza.org') ||
      referer?.includes('onlyoffice.decaza.org');

    if (!session && !isFromOnlyOffice) {
      console.warn('[AI Proxy v1] Unauthorized request - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session?.user?.id || 'onlyoffice-user';

    // 3. 檢查速率限制
    const rateLimit = aiRateLimiter.check(userId);
    if (!rateLimit.allowed) {
      console.warn(`[AI Proxy v1] Rate limit exceeded for user: ${userId}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    // 4. 解析請求體
    const body = await request.json();
    console.log('[AI Proxy v1] Request from user:', userId, 'Messages:', body.messages?.length || 0);

    // 5. 檢查是否有選中的專案和文件
    // 優先順序：URL 參數 > Cookie > 資料庫查詢
    const url = new URL(request.url);
    let selectedProjectId = url.searchParams.get('project_id');
    let selectedSourceIds: string[] = [];
    let targetUserId = url.searchParams.get('user_id'); // 從 URL 讀取 user_id

    // 從 URL 查詢參數讀取 source_ids
    const sourceIdsParam = url.searchParams.get('source_ids');
    if (sourceIdsParam) {
      try {
        selectedSourceIds = JSON.parse(decodeURIComponent(sourceIdsParam));
        console.log('[AI Proxy v1] Source IDs from URL query:', selectedSourceIds.length);
      } catch (e) {
        console.warn('[AI Proxy v1] Failed to parse source_ids from URL:', e);
      }
    }

    if (!selectedProjectId) {
      // 如果 URL 沒有，嘗試從 cookie 讀取
      const cookieHeader = request.headers.get('cookie');
      const projectIdMatch = cookieHeader?.match(/ai_project_id=([^;]+)/);
      selectedProjectId = projectIdMatch ? projectIdMatch[1] : null;

      if (selectedProjectId) {
        console.log('[AI Proxy v1] Project ID from cookie:', selectedProjectId);
      }

      // 從 cookie 讀取 source_ids
      const sourceIdsMatch = cookieHeader?.match(/ai_source_ids=([^;]+)/);
      if (sourceIdsMatch && !selectedSourceIds.length) {
        try {
          selectedSourceIds = JSON.parse(decodeURIComponent(sourceIdsMatch[1]));
          console.log('[AI Proxy v1] Source IDs from cookie:', selectedSourceIds.length);
        } catch (e) {
          console.warn('[AI Proxy v1] Failed to parse source_ids from cookie:', e);
        }
      }
    } else {
      console.log('[AI Proxy v1] Project ID from URL query:', selectedProjectId);
    }

    // 如果 URL 和 cookie 都沒有，從資料庫查詢用戶偏好
    if (!selectedProjectId) {
      // 確定要查詢哪個用戶的偏好
      let queryUserId = targetUserId || (session ? session.user.id : null);

      // 如果是 onlyoffice-user（匿名用戶），嘗試從環境變數讀取預設用戶 ID
      // 或查詢最近更新的偏好設置
      if (!queryUserId || userId === 'onlyoffice-user') {
        console.log('[AI Proxy v1] Anonymous user detected, attempting to load preferences');

        try {
          // 方案 1：使用 Supabase service role（繞過 RLS）
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

          if (serviceRoleKey && supabaseUrl) {
            try {
              const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
              const serviceSupabase = createSupabaseClient(
                supabaseUrl,
                serviceRoleKey,
                {
                  auth: {
                    autoRefreshToken: false,
                    persistSession: false
                  }
                }
              );

              // 查詢最近更新的偏好設置（假設用戶剛剛才設置）
              const { data: latestPref, error: latestError } = await serviceSupabase
                .from('ai_preferences')
                .select('user_id, project_id, source_ids')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

              if (!latestError && latestPref) {
                queryUserId = latestPref.user_id;
                selectedProjectId = latestPref.project_id;
                selectedSourceIds = latestPref.source_ids || [];

                // 如果 project_id 是 null，表示用戶已清除專案選擇
                if (!selectedProjectId || selectedProjectId === 'null') {
                  console.log('[AI Proxy v1] User cleared project selection, using general AI mode');
                  selectedProjectId = null;
                  selectedSourceIds = [];
                } else {
                  console.log('[AI Proxy v1] ✅ Using latest preferences from user:', queryUserId);
                  console.log('[AI Proxy v1] ✅ Project:', selectedProjectId);
                  console.log('[AI Proxy v1] ✅ Sources:', selectedSourceIds.length);
                }
              } else if (latestError) {
                console.log('[AI Proxy v1] Failed to query preferences:', latestError.message);
              } else {
                console.log('[AI Proxy v1] No preferences found in database');
              }
            } catch (importError) {
              console.error('[AI Proxy v1] Failed to create service client:', importError);
            }
          } else {
            console.warn('[AI Proxy v1] Service role key or URL not configured');
          }
        } catch (e) {
          console.warn('[AI Proxy v1] Failed to query latest preferences:', e);
        }
      }

      // 如果有明確的 user_id，查詢該用戶的偏好
      if (queryUserId && !selectedProjectId) {
        try {
          console.log('[AI Proxy v1] Querying preferences from database for user:', queryUserId);

          const { data: preferences, error: prefError } = await supabase
            .from('ai_preferences')
            .select('project_id, source_ids')
            .eq('user_id', queryUserId)
            .single();

          if (!prefError && preferences) {
            selectedProjectId = preferences.project_id;
            selectedSourceIds = preferences.source_ids || [];

            // 如果 project_id 是 null，表示用戶已清除專案選擇
            if (!selectedProjectId || selectedProjectId === 'null') {
              console.log('[AI Proxy v1] User cleared project selection, using general AI mode');
              selectedProjectId = null;
              selectedSourceIds = [];
            } else {
              console.log('[AI Proxy v1] ✅ Loaded from database - Project:', selectedProjectId);
              console.log('[AI Proxy v1] ✅ Loaded from database - Sources:', selectedSourceIds.length);
            }
          } else if (prefError && prefError.code !== 'PGRST116') {
            console.warn('[AI Proxy v1] Failed to query preferences:', prefError.message);
          }
        } catch (e) {
          console.warn('[AI Proxy v1] Failed to query database:', e);
        }
      }
    }

    let messages = body.messages;

    // 6. 如果有選中專案，注入專案上下文
    if (selectedProjectId && selectedProjectId !== 'null') {
      try {
        console.log('[AI Proxy v1] Fetching project context for ID:', selectedProjectId);

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', selectedProjectId)
          .single();

        if (projectError) {
          console.error('[AI Proxy v1] Failed to fetch project:', projectError.message);
        } else if (!project) {
          console.warn('[AI Proxy v1] Project not found:', selectedProjectId);
        } else {
          console.log('[AI Proxy v1] Project found, columns:', Object.keys(project));

          // 查詢專案的資料來源（標案文件）
          let sources: any[] = [];
          let sourcesError: any = null;

          if (selectedSourceIds.length > 0) {
            // 只查詢用戶選中的文件
            console.log('[AI Proxy v1] Fetching selected sources:', selectedSourceIds);
            const result = await supabase
              .from('sources')
              .select('*')
              .in('id', selectedSourceIds);

            sources = result.data || [];
            sourcesError = result.error;
          } else {
            // ❌ 如果沒有選擇文件，不要自動加載任何文件！
            console.log('[AI Proxy v1] No sources selected, skipping source loading');
            sources = [];
          }

          if (sourcesError) {
            console.error('[AI Proxy v1] Failed to fetch sources:', sourcesError.message);
          } else {
            console.log('[AI Proxy v1] Sources found:', sources?.length || 0);
            if (sources && sources.length > 0) {
              console.log('[AI Proxy v1] First source columns:', Object.keys(sources[0]));
            }
          }

          // 構建系統提示詞（使用智能欄位檢測）
          let systemPrompt = `# 你是專業的標案撰寫助手\n\n`;
          systemPrompt += `## 當前協助的標案專案\n\n`;

          const projectName = getField(project, 'name');
          const agencyName = getField(project, 'agency');
          const requirementSummary = getField(project, 'summary');
          const projectDescription = getField(project, 'description');

          systemPrompt += `**專案名稱**：${projectName || '未命名專案'}\n`;
          if (agencyName) {
            systemPrompt += `**發包機關**：${agencyName}\n`;
          }
          if (requirementSummary) {
            systemPrompt += `**需求摘要**：${requirementSummary}\n`;
          }
          if (projectDescription) {
            systemPrompt += `**專案說明**：${projectDescription}\n`;
          }

          // 添加所有專案欄位（除了 id 和 系統欄位）
          const excludeFields = ['id', 'created_at', 'updated_at', 'user_id'];
          systemPrompt += `\n**完整專案資訊**：\n`;
          Object.entries(project).forEach(([key, value]) => {
            if (!excludeFields.includes(key) && value && typeof value === 'string' && value.trim()) {
              systemPrompt += `- ${key}: ${value}\n`;
            }
          });

          // 添加參考文件（傳遞完整解析內容）
          if (sources && sources.length > 0) {
            systemPrompt += `\n## 參考資料（標案相關文件）\n\n`;
            systemPrompt += `以下是${selectedSourceIds.length > 0 ? '用戶選擇的' : ''}與本標案相關的 ${sources.length} 份文件，請在回答時參考這些資料：\n\n`;

            sources.forEach((source, index) => {
              const sourceTitle = getField(source, 'name') || source.title || source.file_name || `文件 ${index + 1}`;
              const sourceSummary = getField(source, 'summary') || source.summary;
              const sourceContent = source.content || getField(source, 'description') || source.text;
              const sourcePages = source.pages; // 分頁內容（如果有）

              systemPrompt += `### ${index + 1}. ${sourceTitle}\n\n`;

              if (sourceSummary) {
                systemPrompt += `**摘要**：${sourceSummary}\n\n`;
              }

              if (sourceContent) {
                // 完整傳遞文件內容（不截斷）
                systemPrompt += `**完整內容**（${sourceContent.length} 字元）：\n\`\`\`\n${sourceContent}\n\`\`\`\n\n`;
              } else if (sourcePages && Array.isArray(sourcePages) && sourcePages.length > 0) {
                // 完整傳遞所有分頁內容（不截斷）
                systemPrompt += `**文件內容（${sourcePages.length} 頁）**：\n`;
                sourcePages.forEach((page: any) => {
                  systemPrompt += `\n**第 ${page.page} 頁**：\n\`\`\`\n${page.content}\n\`\`\`\n`;
                });
                systemPrompt += `\n`;
              }

              systemPrompt += `---\n\n`;
            });
          } else {
            systemPrompt += `\n（注意：目前沒有找到相關的標案文件資料，請用戶先選擇要參考的文件）\n\n`;
          }

          systemPrompt += `## 重要指示\n\n`;

          if (sources && sources.length > 0) {
            // 有文件時的指示
            systemPrompt += `1. 你必須基於以上專案資料和參考文件來回答用戶的問題\n`;
            systemPrompt += `2. 回答時要明確引用專案名稱和相關資料\n`;
            systemPrompt += `3. 如果用戶詢問的內容與本標案相關，請結合上述資料給出具體、實用的建議\n`;
            systemPrompt += `4. 如果參考資料中沒有相關資訊，請明確告知用戶，不要編造內容\n`;
            systemPrompt += `5. 保持專業、準確、有條理的回答風格\n`;
          } else {
            // 沒有文件時的指示
            systemPrompt += `1. 用戶已選擇專案「${projectName}」但尚未選擇參考文件\n`;
            systemPrompt += `2. 你可以根據專案基本資訊（名稱、機關等）提供一般性建議\n`;
            systemPrompt += `3. 如果需要具體的標案文件內容才能回答，請提醒用戶先選擇要參考的文件\n`;
            systemPrompt += `4. 不要編造或假設文件內容，保持客觀和誠實\n`;
          }

          // 在訊息開頭添加系統提示
          messages = [
            { role: 'system', content: systemPrompt },
            ...body.messages
          ];

          console.log('[AI Proxy v1] ✅ Project context injected successfully');
          console.log('[AI Proxy v1] - Project:', projectName || '未命名');
          console.log('[AI Proxy v1] - Sources:', sources?.length || 0);
          console.log('[AI Proxy v1] - System prompt length:', systemPrompt.length, 'characters');

          // 警告：如果 system prompt 過長
          const estimatedTokens = Math.ceil(systemPrompt.length / 2); // 粗略估計 tokens（中文約 2 字/token）
          if (estimatedTokens > 100000) {
            console.warn('[AI Proxy v1] ⚠️  System prompt is very large:', estimatedTokens, 'tokens (estimated)');
            console.warn('[AI Proxy v1] ⚠️  This may exceed Azure OpenAI token limits!');
          } else if (estimatedTokens > 50000) {
            console.log('[AI Proxy v1] ℹ️  System prompt size:', estimatedTokens, 'tokens (estimated)');
          }
        }
      } catch (error) {
        console.error('[AI Proxy v1] Unexpected error fetching project context:', error);
        // 繼續執行，不中斷請求
      }
    } else {
      console.log('[AI Proxy v1] No project selected, using general AI mode');
    }

    // 7. 構建 Azure OpenAI API URL
    const azureUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

    // 8. 轉發到 Azure OpenAI
    const azureResponse = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: messages,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 4000, // 增加到 4000，讓 AI 可以給出更詳細的回答
        stream: false, // OnlyOffice 可能不支援 streaming
      }),
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('[AI Proxy v1] Azure OpenAI error:', azureResponse.status, errorText);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: azureResponse.status }
      );
    }

    // 9. 返回結果
    const data = await azureResponse.json();

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      }
    });

  } catch (error) {
    console.error('[AI Proxy v1] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS 請求處理（CORS preflight）
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
