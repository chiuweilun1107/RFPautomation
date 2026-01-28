import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Azure OpenAI Models API
 *
 * 兼容 OpenAI API 的 /models 端點
 * 讓 OnlyOffice AI 插件可以獲取可用模型列表
 */

export async function GET(request: NextRequest) {
  try {
    // 驗證用戶身份（可選，因為這只是列出模型）
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('[AI Models] Unauthorized request');
      // 即使未登入，也返回模型列表（公開信息）
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

    console.log('[AI Models] Returning model list');

    return NextResponse.json(models);

  } catch (error) {
    console.error('[AI Models] Error:', error);
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
