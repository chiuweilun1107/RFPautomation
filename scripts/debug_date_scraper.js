const https = require('https');

// The logic from n8n
function processHtml(html) {
    console.log(`HTML Length: ${html.length}`);

    // 1. Handle Status Logic
    let status = '招標中';
    // (Skipping title logic for this test as we focus on date)

    // 2. Handle ROC Date Parsing
    function parseRocDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const cleanStr = dateStr.replace(/\\/g, '').trim();

        if (cleanStr.match(/^\d{4}-\d{2}-\d{2}/)) return cleanStr;

        const rocMatch = cleanStr.match(/^(\d{2,3})[\/\.](\d{1,2})[\/\.](\d{1,2})/);
        if (rocMatch) {
            const rocYear = parseInt(rocMatch[1]);
            const month = rocMatch[2].padStart(2, '0');
            const day = rocMatch[3].padStart(2, '0');
            const adYear = rocYear + 1911;
            return `${adYear}-${month}-${day}`;
        }
        return null;
    }

    // 3. Robust Deadline Extraction via Distance Minimization
    let deadlineStr = null;
    const keywords = ['截止投標', '截止'];
    let bestDate = null;
    let minDistance = Infinity;

    // Find all ROC dates
    const dateRegex = /(\d{2,3})[\/.\\\\]{1,2}(\d{2})[\/.\\\\]{1,2}(\d{2})\s*(\d{2}:\d{2})?/g;
    let match;
    const dates = [];
    while ((match = dateRegex.exec(html)) !== null) {
        dates.push({
            full: match[0],
            index: match.index
        });
    }
    console.log(`Found ${dates.length} dates in total.`);

    // Find closest date AFTER the keyword
    for (const kw of keywords) {
        const kwRegex = new RegExp(kw, 'g');
        let kwMatch;
        while ((kwMatch = kwRegex.exec(html)) !== null) {
            const kwIndex = kwMatch.index;
            console.log(`Found keyword "${kw}" at index ${kwIndex}`);

            for (const date of dates) {
                const distance = date.index - kwIndex;
                if (distance > 0 && distance < 5000 && distance < minDistance) {
                    console.log(`  -> Candidate Date: ${date.full} at distance ${distance}`);
                    minDistance = distance;
                    bestDate = date.full;
                }
            }
        }
    }

    if (bestDate) deadlineStr = bestDate;

    return {
        deadlineRaw: deadlineStr,
        deadlineParsed: parseRocDate(deadlineStr)
    };
}

// Fetch the URL
const url = 'https://acebidx.com/zh-TW/docs/tender/id/c99dce3c-b927-4ad4-bb8d-6f725fa5d9e8';
console.log(`Fetching ${url}...`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const result = processHtml(data);
        console.log('--- RESULT ---');
        console.log(JSON.stringify(result, null, 2));
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
