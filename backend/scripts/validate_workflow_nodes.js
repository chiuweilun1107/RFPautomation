const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../n8n/WF02-Evaluation.json');

try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const workflow = JSON.parse(raw);
    console.log(`✅ File Valid: ${path.basename(filePath)} is valid JSON.`);

    let errorCount = 0;

    workflow.nodes.forEach(node => {
        // Rule 1: Check Respond to Webhook - responseBody
        if (node.type === 'n8n-nodes-base.respondToWebhook') {
            const body = node.parameters?.responseBody;
            if (body && typeof body === 'string') {
                // If it starts with '=', it's an expression (n8n handles it), we assume user knows what they are doing OR we can check basic braces
                if (!body.startsWith('=')) {
                    try {
                        JSON.parse(body);
                        console.log(`[PASS] Node "${node.name}" (RespondToWebhook): responseBody is valid JSON.`);
                    } catch (e) {
                        console.error(`[FAIL] Node "${node.name}" (RespondToWebhook): responseBody is INVALID JSON.`);
                        console.error(`       Content: ${body}`);
                        errorCount++;
                    }
                } else {
                    console.log(`[INFO] Node "${node.name}" (RespondToWebhook): responseBody is an Expression (starts with =). Manual review recommended.`);
                }
            }
        }

        // Rule 2: Check HTTP Request - jsonBody
        if (node.type === 'n8n-nodes-base.httpRequest') {
            const jsonBody = node.parameters?.jsonBody;
            if (node.parameters?.specifyBody === 'json' && jsonBody && typeof jsonBody === 'string') {
                if (!jsonBody.startsWith('=')) {
                    try {
                        JSON.parse(jsonBody);
                        console.log(`[PASS] Node "${node.name}" (HttpRequest): jsonBody is valid JSON.`);
                    } catch (e) {
                        console.error(`[FAIL] Node "${node.name}" (HttpRequest): jsonBody is INVALID JSON.`);
                        console.error(`       Content: ${jsonBody}`);
                        errorCount++;
                    }
                } else {
                    // Simple heuristic for expressions: check if brackets are generally balanced
                    console.log(`[INFO] Node "${node.name}" (HttpRequest): jsonBody is an Expression.`);
                }
            }
        }
    });

    if (errorCount === 0) {
        console.log("\n✅ DEEP VALIDATION PASSED: All static JSON parameters are valid.");
    } else {
        console.error(`\n❌ DEEP VALIDATION FAILED: Found ${errorCount} errors.`);
        process.exit(1);
    }

} catch (e) {
    console.error("CRITICAL: Workflow file itself is invalid JSON.", e.message);
    process.exit(1);
}
