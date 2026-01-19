const fs = require('fs');
const path = '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF10-Task-Generation.json';

const rawData = fs.readFileSync(path, 'utf8');
const workflow = JSON.parse(rawData);

// 1. Remove task-related nodes
const nodesToRemove = ['map-tasks', 'check-tasks', 'insert-tasks-batch'];
workflow.nodes = workflow.nodes.filter(node => !nodesToRemove.includes(node.id));

// 2. Clear old connections for removed nodes
delete workflow.connections['Map Tasks'];
delete workflow.connections['Check Tasks'];
delete workflow.connections['Insert Tasks Batch'];

// 3. Update connections for upstream nodes to point to Success
// Create Sections Batch -> Success
workflow.connections['Create Sections Batch'] = {
    "main": [
        [
            {
                "node": "Success",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

// Passthrough -> Success
workflow.connections['Passthrough'] = {
    "main": [
        [
            {
                "node": "Success",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

// 4. Update Success node position (optional but good for visual)
const successNode = workflow.nodes.find(n => n.id === 'success');
if (successNode) {
    successNode.position = [2000, 300];
}

const respondNode = workflow.nodes.find(n => n.id === 'respond-webhook');
if (respondNode) {
    respondNode.position = [2200, 300];
}


fs.writeFileSync(path, JSON.stringify(workflow, null, 4));
console.log('WF10 updated successfully.');
