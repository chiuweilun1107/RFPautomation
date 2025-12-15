
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOThkZGNhNi1kMTA5LTQyMTgtODFlOC0xNWMzNDA4NDNjYjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1NjMyODA5fQ.L1FImsBbIx4Ol-eyZm3GDMeAIU6UkvSqr5eLx9ZU1WA';
const N8N_HOST = 'http://localhost:5678';
const GEMINI_KEY = 'AIzaSyDkre1QTNfODUPXj5U-Zt8YTGasZNE4PkM';

async function main() {
    try {
        console.log("🧠 Configuring Gemini Credential...");

        const payload = {
            name: "Google Gemini Account",
            type: "googleGeminiApi",
            data: {
                apiKey: GEMINI_KEY
            }
        };

        const response = await fetch(`${N8N_HOST}/api/v1/credentials`, {
            method: 'POST',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ SUCCESS: Gemini Connected!");
            console.log(`🆔 ID: ${data.id}`);
        } else {
            console.error("❌ FAILED:", response.status, data);
        }

    } catch (error) {
        console.error("💥 Error:", error);
    }
}

main();
