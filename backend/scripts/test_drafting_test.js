
const fetch = require('node-fetch');

async function testHook() {
    const url = 'http://localhost:5678/webhook-test/draft';
    console.log(`Testing ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requirement: "Ensure all data is encrypted at rest using AES-256.",
                context: "Project is a banking application."
            })
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}

testHook();
