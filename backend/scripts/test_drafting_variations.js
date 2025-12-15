
const fetch = require('node-fetch');

async function testHook() {
    // Try explicit invocation by Workflow ID if supported, or variations
    const urls = [
        'http://localhost:5678/webhook/ibK6vTUH17ANDK9S/webhook/draft', // ID + Node + Path
    ];

    for (const url of urls) {
        console.log(`Testing ${url}...`);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requirement: "Test",
                    context: "Test"
                })
            });
            console.log(`[${response.status}] ${url}`);
            if (response.ok) {
                console.log("SUCCESS BODY:", await response.text());
                break;
            }
        } catch (e) {
            console.error("Error:", e);
        }
    }
}

testHook();
