
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF10-Task-Generation.json';

try {
    let content = fs.readFileSync(filePath, 'utf8');
    // The problematic pattern is: closing brace, closing brace, backslash, quote, comma, quote, options
    // content should be: ... }}", "options": {}
    // content is likely: ... }}\","options": {}

    // We look for the end of the jsonBody value followed immediately by options
    // The jsonBody value ends with response_format: { type: 'json_object' } }) }}

    // Let's search for the unique tail of the string
    const searchPattern = "response_format: { type: 'json_object' } }) }}\\\",\"options\": {}";
    const replacePattern = "response_format: { type: 'json_object' } }) }}\",\n                \"options\": {}";

    if (content.indexOf("}}\\\",\"options\"") !== -1) {
        console.log("Found pattern 1: }}\\\",\"options\"");
        content = content.replace("}}\\\",\"options\"", "}}\",\n                \"options\"");
    } else if (content.indexOf("}}\",\"options\"") !== -1) {
        console.log("Found pattern 2: }}\",\"options\" (missing newline only?)");
        content = content.replace("}}\",\"options\"", "}}\",\n                \"options\"");
    } else {
        console.log("Pattern not found by simple string match. Trying regex.");
        // Regex to find "jsonBody": "..." followed by "options" without a comma or bad escape
        // But "jsonBody" is huge.
        // Let's just look at the tail.
        // ... }}", "options": {}
        // If it is escaped: ... }}\", "options"

        const regex = /}}\\",\s*"options"/;
        if (regex.test(content)) {
            console.log("Found regex match for escaped quote");
            content = content.replace(/}}\\",\s*"options"/, '}}",\n                "options"');
        } else {
            console.log("No specific error pattern found. Dumping tail of line 127?");
            // Find line 127 roughly
            const lines = content.split('\n');
            if (lines.length >= 127) {
                const line = lines[126]; // 0-indexed
                console.log("Line 127 tail:", line.substring(line.length - 100));
            }
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("File written.");

    // Verify
    try {
        JSON.parse(content);
        console.log("Verification: JSON is valid NOW.");
    } catch (e) {
        console.error("Verification Failed:", e.message);
    }

} catch (e) {
    console.error("Error:", e);
}
