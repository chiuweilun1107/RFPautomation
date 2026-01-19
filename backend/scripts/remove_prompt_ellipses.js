
const fs = require('fs');

const files = [
    '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF11-Task-Generation-Advanced.json',
    '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF13-Task-Generation-Management.json'
];

files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the ellipsis from the examples
    // Case 1: Functional point example with ...
    content = content.replace(/功能點一\.\.\./g, '功能點一');

    // Case 2: The citation example with ...
    content = content.replace(/ \.\.\.\(出處:/g, ' (出處:');

    fs.writeFileSync(filePath, content);
    console.log(`Successfully removed ellipses from ${filePath}`);
});
