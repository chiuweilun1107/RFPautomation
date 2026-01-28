// Supabase Edge Function: 每日更新標案狀態
// 用途：將已過期的標案狀態從「招標中」更新為「已截止」
// 執行方式：配合 Supabase Cron 每天自動執行
// 部署：supabase functions deploy update-tender-status

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusUpdateResult {
  success: boolean
  message: string
  updatedCount?: number
  beforeStats?: Record<string, number>
  afterStats?: Record<string, number>
  timestamp: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting tender status update function...')

    // 驗證請求來源
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.warn('⚠️ Missing authorization header')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization header',
          timestamp: new Date().toISOString()
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 建立 Supabase 客戶端（使用 Service Role Key 以繞過 RLS）
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 步驟 1：查詢更新前的統計資料
    console.log('📊 Fetching before stats...')
    const { data: beforeData, error: beforeError } = await supabase
      .from('tenders')
      .select('status')

    if (beforeError) {
      console.error('❌ Error fetching before stats:', beforeError)
      throw beforeError
    }

    const beforeStats = beforeData?.reduce((acc: Record<string, number>, tender: any) => {
      const status = tender.status || 'null'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    console.log('📈 Before stats:', beforeStats)

    // 步驟 2：直接執行 UPDATE SQL（不使用 RPC）
    console.log('🔄 Executing status update via direct SQL...')

    // 獲取所有需要更新的標案
    const { data: expiredTenders, error: fetchError } = await supabase
      .from('tenders')
      .select('id')
      .not('status', 'in', '("已撤案","已廢標","已決標")')
      .eq('status', '招標中')
      .lte('deadline_date', new Date().toISOString())

    if (fetchError) {
      console.error('❌ Error fetching expired tenders:', fetchError)
      throw fetchError
    }

    console.log(`📋 Found ${expiredTenders?.length || 0} tenders to update`)

    let updatedCount = 0

    // 批量更新
    if (expiredTenders && expiredTenders.length > 0) {
      const idsToUpdate = expiredTenders.map(t => t.id)

      const { error: updateError } = await supabase
        .from('tenders')
        .update({ status: '已截止' })
        .in('id', idsToUpdate)

      if (updateError) {
        console.error('❌ Error updating tenders:', updateError)
        throw updateError
      }

      updatedCount = expiredTenders.length
      console.log(`✅ Successfully updated ${updatedCount} tenders`)
    } else {
      console.log('ℹ️ No tenders need updating')
    }

    // 步驟 3：查詢更新後的統計資料
    console.log('📊 Fetching after stats...')
    const { data: afterData, error: afterError } = await supabase
      .from('tenders')
      .select('status')

    if (afterError) {
      console.error('❌ Error fetching after stats:', afterError)
    }

    const afterStats = afterData?.reduce((acc: Record<string, number>, tender: any) => {
      const status = tender.status || 'null'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    console.log('📈 After stats:', afterStats)

    // 步驟 4：返回結果
    const result: StatusUpdateResult = {
      success: true,
      message: `Successfully updated ${updatedCount} tender(s)`,
      updatedCount,
      beforeStats,
      afterStats,
      timestamp: new Date().toISOString()
    }

    console.log('🎉 Tender status update completed successfully!')
    console.log('📄 Result:', JSON.stringify(result, null, 2))

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Function error:', error)

    // 正確處理各種錯誤類型
    let errorMessage = 'Unknown error'
    let errorDetails = null

    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      errorDetails = error
      errorMessage = JSON.stringify(error)
    } else {
      errorMessage = String(error)
    }

    console.error('📝 Error details:', errorDetails || errorMessage)

    const errorResult: StatusUpdateResult = {
      success: false,
      message: 'Failed to update tender status',
      error: errorMessage,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(errorResult),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
