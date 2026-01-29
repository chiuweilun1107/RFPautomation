import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Azure OpenAI Models API (OpenAI 兼容路徑)
 *
 * 路徑：/api/ai-proxy/azure-openai/v1/models
 * 兼容 OpenAI API 標準格式
 */

export async function GET(request: NextRequest) {
  try {
    // 驗證用戶身份（可選）
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('[AI Models v1] Unauthorized request');
    }

    // 返回兼容 OpenAI API 的模型列表
    const models = {
      object: "list",
      data: [
        {
          id: "gpt-4",
          object: "model",
          created: 1687882411,
          owned_by: "azure-openai",
          permission: [],
          root: "gpt-4",
          parent: null
        }
      ]
    };

    console.log('[AI Models v1] Returning model list');

    return NextResponse.json(models);

  } catch (error) {
    console.error('[AI Models v1] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
