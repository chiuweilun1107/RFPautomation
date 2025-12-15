
const fetch = require('node-fetch');

const API_KEY = 'AIzaSyDkre1QTNfODUPXj5U-Zt8YTGasZNE4PkM';
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        const response = await fetch(URL);
        const data = await response.json();

        if (response.ok) {
            console.log("✅ Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.error("❌ Error:", data);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

listModels();
