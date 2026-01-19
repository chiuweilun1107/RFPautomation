
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find the breakpoint: line 1553 has "</div>" closing the section row
// Line 1555 starts the "Editor Card" which should be in main return, not renderSection

// The fix:
// 1. After line 1553 (</div> closing section row), we need to close renderSection's return div
// 2. Then close renderSection function
// 3. Add main component's return statement

// Looking at the structure:
// renderSection returns a <div> starting at line 1494
// This div should close BEFORE the Editor Card

// Current structure around line 1553:
//   1547:                     </div>   (closes Title flex div)
//   1548:
//   1549:                     {/* Actions */}
//   1550:                     <div className="flex items-center gap-1">
//   1551:
//   1552:                     </div>
//   1553:                 </div>    <-- This closes the section row div (started at line 1496)
//   1554:
//   1555:                 {/* Editor Card */}  <-- THIS IS WRONG! Should not be in renderSection
//   ...

// The renderSection's outer div (line 1494: <div key={section.id}>) should close after section row
// Then renderSection function should close
// Then main return should start

// Let me insert the fix after line 1553

const insertAfterLine = 1553; // "</div>" closing the section row

// Build the new content
const beforeInsert = lines.slice(0, insertAfterLine).join('\n');
const afterInsert = lines.slice(insertAfterLine).join('\n');

const insertContent = `
            </div>
        );
    };

    // --- Main Component Return ---
    return (
        <div className="flex h-full">
            {/* Left Panel: Proposal Structure */}
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
`;

// We also need to find where line 1555's comment "Editor Card" is and remove the extra stuff
// Actually, looking more carefully:
// After the fix, we need to REPLACE lines 1554-1558 area

// Let me do a more targeted fix:
// Find the exact pattern and replace it

const oldPattern = `                </div>

                {/* Editor Card */}
                <div className="w-full bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    {/* Tree Content */}
                    <div className="p-4 min-h-[400px]">`;

const newPattern = `                </div>
            </div>
        );
    };

    // --- Main Component Return ---
    return (
        <div className="flex h-full">
            {/* Left Panel: Proposal Structure */}
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
                {/* Editor Card */}
                <div className="w-full bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    {/* Tree Content */}
                    <div className="p-4 min-h-[400px]">`;

if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    fs.writeFileSync(filePath, content);
    console.log('Successfully fixed the component structure!');
} else {
    console.log('Pattern not found. Let me try a different approach...');

    // Try line-by-line fix
    const lines = content.split('\n');

    // Find line that ends the renderSection's section row div (should be around 1553)
    for (let i = 1550; i < 1560; i++) {
        console.log(`Line ${i + 1}: ${lines[i]}`);
    }
}
