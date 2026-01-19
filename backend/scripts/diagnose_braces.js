
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find ProposalStructureEditor function start
let funcStart = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export function ProposalStructureEditor')) {
        funcStart = i;
        break;
    }
}
console.log(`ProposalStructureEditor starts at line ${funcStart + 1}`);

// Count braces after function start
let braceCount = 0;
let firstUnbalancedLine = -1;
for (let i = funcStart; i < lines.length; i++) {
    const line = lines[i];
    // Skip string literals and comments
    for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
    }
    if (braceCount < 0 && firstUnbalancedLine === -1) {
        firstUnbalancedLine = i + 1;
    }
}

console.log(`Final brace count: ${braceCount}`);
console.log(`First unbalanced line (if negative): ${firstUnbalancedLine}`);

// Check if there's a top-level return statement in the function
let hasTopLevelReturn = false;
let returnLineNo = -1;
braceCount = 0;
for (let i = funcStart; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
    }
    // At depth 1 (inside the main function only)
    if (braceCount === 1 && line.trim().startsWith('return (')) {
        hasTopLevelReturn = true;
        returnLineNo = i + 1;
        break;
    }
}

console.log(`Has top-level return in main function: ${hasTopLevelReturn}`);
if (hasTopLevelReturn) {
    console.log(`Return line: ${returnLineNo}`);
}
