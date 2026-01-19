
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find renderSection start
let renderSectionStart = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const renderSection = (section: Section, depth: number')) {
        renderSectionStart = i;
        break;
    }
}
console.log(`renderSection starts at line ${renderSectionStart + 1}`);

// Track brace depth starting from renderSection
let braceDepth = 0;
let renderSectionEnd = -1;
let insideRenderSection = false;
for (let i = renderSectionStart; i < lines.length; i++) {
    const line = lines[i];

    for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
    }

    // renderSection starts with depth going from 0 to 1
    if (i === renderSectionStart) {
        insideRenderSection = true;
    }

    // When we get back to depth 0, that's the end of renderSection
    if (insideRenderSection && braceDepth === 0) {
        renderSectionEnd = i;
        console.log(`renderSection ends at line ${i + 1}: "${line.trim()}"`);
        break;
    }
}

if (renderSectionEnd === -1) {
    console.log('renderSection never ends - this is the problem!');
    console.log(`Final depth: ${braceDepth}`);

    // Find where brace depth goes from 1 to 0 (potential end point)
    braceDepth = 0;
    for (let i = renderSectionStart; i < lines.length; i++) {
        const line = lines[i];
        let prevDepth = braceDepth;
        for (const char of line) {
            if (char === '{') braceDepth++;
            if (char === '}') braceDepth--;
        }
        // Log significant depth changes
        if (prevDepth === 1 && braceDepth === 0) {
            console.log(`Line ${i + 1} brings depth from 1 to 0: "${line.trim()}"`);
        }
    }
}
