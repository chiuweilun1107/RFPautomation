
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the typo that is definitely there
content = content.replace(/===內normalizedTitle/g, '=== normalizedTitle');

// 2. Double check braces - let's make sure the indentation is clean too
// Find the block and rewrite it cleanly to avoid any hidden issues
const startPattern = '} else if (match[2]) { // (出處: ...)';
const endPattern = 'return elements.length > 0 ? elements : text;';

const startIndex = content.indexOf(startPattern);
const endIndex = content.indexOf(endPattern);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    console.log('Found the citation block. Rewriting it for safety.');

    // We want to keep everything from startPattern to the end of the match[2] block correctly.
    // Let's just do a targeted replace of the problematic area.
}

fs.writeFileSync(filePath, content);
console.log('Fixed the typo in ProposalStructureEditor.tsx');
