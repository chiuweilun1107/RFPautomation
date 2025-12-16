
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

        let pages: { page: number; content: string }[] = [];

        // 2. Handle DOCX locally using mammoth
        if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || path.endsWith('.docx')) {
            console.log("Detected DOCX, processing locally with mammoth...");
            try {
                const uint8Array = new Uint8Array(arrayBuffer);
                const result = await mammoth.extractRawText({ buffer: uint8Array });
                // DOCX doesn't support pagination easily, strictly mapping to "Page 1"
                pages = [{ page: 1, content: result.value }];
                console.log("Mammoth extraction complete.");
            } catch (err) {
                console.error("Mammoth conversion failed:", err);
                throw new Error(`Failed to parse DOCX: ${err.message}`);
            }
        } else {
            // 3. Use Gemini for PDF or Images
            console.log("Using Gemini for page-aware extraction...");
            const base64Data = encode(new Uint8Array(arrayBuffer));

            const API_KEY = bodyApiKey || Deno.env.get('GOOGLE_GEMINI_API_KEY');
            if (!API_KEY) throw new Error('Missing GOOGLE_GEMINI_API_KEY');

            const prompt = `
            You are a precise document parser. 
            Extract the text from this document page by page.
            
            **OUTPUT FORMAT:**
            Return a valid JSON array where each item represents a page.
            Structure:
            [
              { "page": 1, "content": "Markdown text of page 1..." },
              { "page": 2, "content": "Markdown text of page 2..." }
            ]

            **RULES:**
            1. Convert tables to Markdown tables.
            2. Do NOT summarize. Extract full text.
            3. Return ONLY the JSON object. Do not wrap in markdown code blocks (e.g. no \`\`\`json).
            4. If the document is an image, treat it as Page 1.
            `;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
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
            const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

            // Allow for some flexibility if model wraps in code blocks despite instructions
            const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                pages = JSON.parse(cleanJson);
                // Validate structure
                if (!Array.isArray(pages)) throw new Error("Output is not an array");
            } catch (e) {
                console.error("Failed to parse Gemini JSON output:", rawText);
                // Fallback: treat entire text as page 1
                pages = [{ page: 1, content: rawText }];
            }

            console.log(`Gemini extraction complete. Extracted ${pages.length} pages.`);
        }

        return new Response(
            JSON.stringify({ pages }),
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
