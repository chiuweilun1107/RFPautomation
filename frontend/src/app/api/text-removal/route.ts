import { NextRequest, NextResponse } from 'next/server';

interface TextRemovalRequest {
  mode: 'manual' | 'vision' | 'auto'; // 三種模式
  image_url?: string; // 圖片 URL（可選）
  image_base64?: string; // Base64 圖片（可選）
  bboxes?: Array<[number, number, number, number]>; // 手動標記的邊界框
  model?: 'sd15' | 'lama' | 'mat'; // 使用的模型
}

interface TextRemovalResponse {
  status: 'success' | 'error';
  image_base64?: string; // 處理後的圖片
  model?: string; // 使用的模型
  processing_time_ms?: number; // 處理時間
  mode?: string; // 使用的模式
  bboxes?: Array<[number, number, number, number]>; // 偵測到的邊界框
  error?: string; // 錯誤信息
}

/**
 * 文字清除 API
 *
 * 三種模式：
 * 1. manual - 手動標記區域（需要提供 bboxes）
 * 2. vision - 使用 Vision AI 自動偵測文字
 * 3. auto - 全圖智能清除（使用 SD15 的 prompt-based）
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TextRemovalRequest = await request.json();

    // 驗證必要參數
    if (!body.image_url && !body.image_base64) {
      return NextResponse.json(
        { status: 'error', error: 'Either image_url or image_base64 is required' },
        { status: 400 }
      );
    }

    // 驗證模式
    const validModes = ['manual', 'vision', 'auto'];
    const mode = body.mode || 'manual';
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { status: 'error', error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      );
    }

    // 手動模式需要 bboxes
    if (mode === 'manual' && (!body.bboxes || body.bboxes.length === 0)) {
      return NextResponse.json(
        { status: 'error', error: 'bboxes is required for manual mode' },
        { status: 400 }
      );
    }

    // 呼叫 n8n Webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_TEXT_REMOVAL ||
      'http://localhost:5679/webhook/remove-text';

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode,
        image_url: body.image_url,
        image_base64: body.image_base64,
        bboxes: body.bboxes || [],
        model: body.model || 'sd15',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Text Removal] n8n error:', response.status, errorData);
      return NextResponse.json(
        {
          status: 'error',
          error: `n8n error: ${response.status} ${errorData}`
        },
        { status: response.status }
      );
    }

    const result: TextRemovalResponse = await response.json();

    // 添加處理元數據
    return NextResponse.json({
      status: result.status,
      image_base64: result.image_base64,
      model: result.model,
      processing_time_ms: result.processing_time_ms,
      mode: result.mode,
      bboxes: result.bboxes,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Text Removal] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - 返回 API 文檔
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'Text Removal API',
    version: '1.0',
    description: '智能文字清除服務 - 支援三種模式',
    modes: {
      manual: {
        description: '手動標記文字區域',
        required: ['image_url or image_base64', 'bboxes'],
        example: {
          mode: 'manual',
          image_url: 'https://example.com/image.jpg',
          bboxes: [[100, 50, 150, 200], [200, 100, 250, 300]],
          model: 'sd15'
        }
      },
      vision: {
        description: '使用 Vision AI 自動偵測文字',
        required: ['image_url or image_base64'],
        example: {
          mode: 'vision',
          image_base64: 'iVBORw0KGgoAAAANS...',
          model: 'sd15'
        }
      },
      auto: {
        description: '全圖智能清除',
        required: ['image_url or image_base64'],
        example: {
          mode: 'auto',
          image_url: 'https://example.com/image.jpg',
          model: 'sd15'
        }
      }
    },
    models: {
      sd15: 'Stable Diffusion 1.5 (推薦，最佳品質，速度較慢)',
      lama: 'LaMa (最快，適合簡單文字)',
      mat: 'MAT (平衡速度與品質)'
    }
  });
}
