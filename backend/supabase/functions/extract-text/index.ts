
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { bucket, path } = await req.json()
        console.log(`Processing file: ${bucket}/${path}`);

        if (!bucket || !path) {
            throw new Error('Missing bucket or path')
        }

        // 1. Download File from Supabase Storage
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: fileData, error: downloadError } = await supabaseClient
            .storage
            .from(bucket)
            .download(path)

        if (downloadError) {
            console.error('Download error:', downloadError);
            throw downloadError
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const contentType = fileData.type;

        console.log(`File downloaded. Type: ${contentType}, Size: ${arrayBuffer.byteLength}`);

        // 2. Call Gemini API for Multimodal Parsing
        const API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
        if (!API_KEY) throw new Error('Missing GOOGLE_GEMINI_API_KEY');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: "Please extract all text from this document. **CRITICAL: Convert any tables you see into structured Markdown tables.** Do not summarize. Return the full content in Markdown format."
                            },
                            {
                                inline_data: {
                                    mime_type: contentType,
                                    data: base64Data
                                }
                            }
                        ]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        const result = await response.json();
        const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("Gemini extraction complete. Length:", extractedText.length);

        return new Response(
            JSON.stringify({ text: extractedText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error processing file:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
