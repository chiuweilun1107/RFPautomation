
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the typo
content = content.replace('normalize(s.title) ===內normalizedTitle', 'normalize(s.title) === normalizedTitle');

// 2. Fix the unbalanced braces
// We need to find the specific block and ensure it has two closing braces for the else-if and while
const oldBlock = `                                                                             lastIndex = regex.lastIndex;
                                                                        }
                                                                        if (lastIndex < text.length)`;

const newBlock = `                                                                                lastIndex = regex.lastIndex;
                                                                            }
                                                                        }
                                                                        if (lastIndex < text.length)`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    console.log('Fixed unbalanced braces.');
} else {
    // If exact whitespace match fails, try a more flexible one
    console.log('Exact block match failed, attempting flexible fix.');
    content = content.replace(/lastIndex = regex\.lastIndex;\s+\}\s+if \(lastIndex < text\.length\)/,
        'lastIndex = regex.lastIndex;\n                                                                            }\n                                                                        }\n                                                                        if (lastIndex < text.length)');
}

fs.writeFileSync(filePath, content);
console.log('Successfully applied build fix.');
