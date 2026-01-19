
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF08-RAG-Query.json';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log("JSON is valid");
} catch (e) {
    console.error("JSON Error:", e.message);
    // Try to find the position
    if (e.message.match(/at position (\d+)/)) {
        const pos = parseInt(e.message.match(/at position (\d+)/)[1]);
        const content = fs.readFileSync(filePath, 'utf8');
        const before = content.substring(Math.max(0, pos - 50), pos);
        const after = content.substring(pos, Math.min(content.length, pos + 50));
        console.log("Context:");
        console.log(before + ">>>ERROR<<<" + after);
    }
}
