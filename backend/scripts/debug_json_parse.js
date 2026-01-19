
const rawString = `[
 {
  "page": 1,
  "content": "經濟部商業發展署\\n倉儲業者倉庫資訊系統建置與維運計\\n畫\\n建議書徵求文件\\n中華民國114年11月"
 },
 {
  "page": 2,
  "content": "目\\n錄\\n1\\n壹、計畫概述\\n一、緣起\\n1\\n二、計畫名稱\\n2\\n三、計畫目標\\n2"
 }
]`;

console.log("Raw String Length:", rawString.length);

try {
    const parsed = JSON.parse(rawString);
    console.log("Success! Parsed length:", parsed.length);
    console.log("Type of content:", typeof parsed[0].content);
} catch (e) {
    console.error("Parse Failed:", e.message);

    // Try to find the position
    if (e.message.includes('position')) {
        const pos = parseInt(e.message.match(/position (\d+)/)[1]);
        console.log("Error around:", rawString.substring(pos - 20, pos + 20));
    }
}

// Test what Gemini might actually send (wrapped in triple escaped quotes??)
const messyString = `
\`\`\`json
[
 {
  "page": 1,
  "content": "Some content with \\"quotes\\" and \\n newlines"
 }
]
\`\`\`
`;

const cleaned = messyString.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
console.log("Cleaned:", cleaned);
try {
    JSON.parse(cleaned);
    console.log("Messy Parse Success");
} catch (e) {
    console.error("Messy Parse Failed:", e.message);
}
