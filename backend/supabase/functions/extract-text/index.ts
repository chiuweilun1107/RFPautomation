
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import mammoth from "npm:mammoth@1.6.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { bucket, path, apiKey: bodyApiKey } = await req.json()
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
        const contentType = fileData.type;
        console.log(`File downloaded. Type: ${contentType}, Size: ${arrayBuffer.byteLength}`);

        let extractedText = "";

        // 2. Handle DOCX locally using mammoth (Gemini doesn't support DOCX inline)
        if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || path.endsWith('.docx')) {
            console.log("Detected DOCX, processing locally with mammoth...");
            try {
                // Convert ArrayBuffer to Buffer for mammoth compatibility in Deno
                const uint8Array = new Uint8Array(arrayBuffer);

                // Debug: Check the first few bytes to verify it's a ZIP (DOCX is a ZIP file)
                // ZIP files start with PK (0x50, 0x4B)
                const header = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
                console.log(`File header bytes: ${header}`);

                if (uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
                    console.error("File does not start with ZIP signature (PK). This may not be a valid DOCX file.");
                    console.log("First 100 bytes as string:", new TextDecoder().decode(uint8Array.slice(0, 100)));
                    throw new Error("Invalid DOCX file: missing ZIP signature. File may be corrupted or not a real DOCX.");
                }

                const result = await mammoth.extractRawText({ buffer: uint8Array });
                extractedText = result.value;
                console.log("Mammoth extraction complete. Length:", extractedText.length);
                if (result.messages.length > 0) {
                    console.log("Mammoth messages:", result.messages);
                }
            } catch (err) {
                console.error("Mammoth conversion failed:", err);
                throw new Error(`Failed to parse DOCX: ${err.message}`);
            }
        } else {
            // 3. Use Gemini for PDF or Images
            console.log("Using Gemini for extraction...");
            const base64Data = encode(new Uint8Array(arrayBuffer));

            const API_KEY = bodyApiKey || Deno.env.get('GOOGLE_GEMINI_API_KEY');
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
            extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
            console.log("Gemini extraction complete. Length:", extractedText.length);
        }

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
