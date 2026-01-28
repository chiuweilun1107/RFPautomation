import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { aiRateLimiter } from '@/lib/rate-limiter';

/**
 * Azure OpenAI API 代理
 *
 * 為 OnlyOffice AI 插件提供安全的 API 代理層
 * - 驗證用戶身份
 * - 保護 API 密鑰不暴露到前端
 * - 轉發請求到 Azure OpenAI
 */

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
      console.error('[AI Proxy] Missing Azure OpenAI configuration');
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }

    // 2. 驗證用戶身份
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('[AI Proxy] Unauthorized request - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 3. 檢查速率限制
    const rateLimit = aiRateLimiter.check(userId);
    if (!rateLimit.allowed) {
      console.warn(`[AI Proxy] Rate limit exceeded for user: ${userId}`);
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
    console.log('[AI Proxy] Request from user:', userId, 'Messages:', body.messages?.length || 0);

    // 5. 構建 Azure OpenAI API URL
    const azureUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

    // 6. 轉發到 Azure OpenAI
    const azureResponse = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: body.messages,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 1000,
        stream: false, // OnlyOffice 可能不支援 streaming
      }),
    });

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('[AI Proxy] Azure OpenAI error:', azureResponse.status, errorText);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: azureResponse.status }
      );
    }

    // 7. 返回結果
    const data = await azureResponse.json();

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      }
    });

  } catch (error) {
    console.error('[AI Proxy] Unexpected error:', error);
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
