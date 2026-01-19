
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

// Track brace depth at each line after the function starts
let braceDepth = 0;
let inFunc = false;
let depth1ReturnLines = [];
for (let i = funcStart; i < lines.length; i++) {
    const line = lines[i];

    // Count braces
    for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
    }

    // Log significant depth changes
    if (line.includes('const renderSection') && line.includes('=>')) {
        console.log(`Line ${i + 1}: renderSection starts at depth ${braceDepth}`);
    }

    // Find potential main-level returns (at depth 1 after opening brace)
    if (braceDepth === 1 && line.includes('return (')) {
        depth1ReturnLines.push(i + 1);
    }

    // Log closing braces at depth 1
    if (braceDepth === 1 && line.trim() === '};') {
        console.log(`Line ${i + 1}: Closing arrow function at depth 1`);
    }
}

console.log(`\nMain return statement candidates at depth 1: ${depth1ReturnLines.join(', ')}`);
console.log(`Final depth: ${braceDepth}`);
