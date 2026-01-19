import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { template_id, design_config } = body

    // Validate request
    if (!template_id) {
      return NextResponse.json(
        { error: "Missing required field: template_id" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update template with design config
    const { error } = await supabase
      .from('templates')
      .update({
        design_config: design_config,
        updated_at: new Date().toISOString()
      })
      .eq('id', template_id)

    if (error) {
      console.error("[Template Update] Error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to update template" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Template updated successfully",
      data: { template_id, design_config }
    })

  } catch (error) {
    console.error("[Template Update] Error:", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}