import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      template_id,
      name,
      description,
      category,
      folder_id
    } = body

    // Validate request
    if (!template_id || !name) {
      return NextResponse.json(
        { error: "Missing required fields: template_id, name" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get original template
    const { data: originalTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (fetchError || !originalTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Create new template
    const { data: newTemplate, error: insertError } = await supabase
      .from('templates')
      .insert({
        name,
        description: description || null,
        category: category || null,
        folder_id: folder_id || null,
        file_path: originalTemplate.file_path,
        // Copy original structure
        structure: originalTemplate.structure,
        styles: originalTemplate.styles,
        paragraphs: originalTemplate.paragraphs,
        parsed_tables: originalTemplate.parsed_tables,
        sections: originalTemplate.sections,
        page_breaks: originalTemplate.page_breaks,
        template_version: originalTemplate.template_version,
        engine: originalTemplate.engine,
        // Initialize empty design config
        design_config: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error("[Save As New] Insert error:", insertError)
      return NextResponse.json(
        { error: insertError.message || "Failed to create new template" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Template saved as new successfully",
      data: {
        template_id: newTemplate.id,
        name: newTemplate.name
      }
    })

  } catch (error) {
    console.error("[Save As New] Error:", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}