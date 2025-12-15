
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
        // Call ListModels to see what is actually available
        const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

        console.log(`Debug: Listing models from ${URL.replace(API_KEY, 'HIDDEN')}`);

        const response = await fetch(URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        const modelNames = data.models ? data.models.map((m: any) => m.name) : [];

        return new Response(
            JSON.stringify({
                modelNames,
                nextPageToken: data.nextPageToken
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
