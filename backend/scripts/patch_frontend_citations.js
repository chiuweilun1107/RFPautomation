
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

let updatedCount = 0;
for (let i = 0; i < lines.length; i++) {
    // Look for the regex line
    if (lines[i].includes('const regex = /(\\(建議實作\\))|(\\(出處:\\s*(.*?)\\s+P\\.(\\d+)\\))/g;')) {
        lines[i] = lines[i].replace('P\\.(\\d+)', 'P\\.([\\d\\-\\,\\s]+)');
        updatedCount++;
    }
    // Look for the page parsing line
    if (lines[i].includes('const page = parseInt(match[4]);')) {
        lines[i] = lines[i].replace('const page = parseInt(match[4]);', 'const pageRaw = match[4]; const page = parseInt(pageRaw) || 0;');
        updatedCount++;
    }
}

if (updatedCount >= 2) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Successfully updated ${updatedCount} locations in ProposalStructureEditor.tsx`);
} else {
    console.error(`Update failed. Found ${updatedCount} out of 2 expected locations.`);
}
