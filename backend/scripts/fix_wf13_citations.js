
const fs = require('fs');
const path = require('path');

const filePath = '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF13-Task-Generation-Management.json';
const folderPath = '/Users/chiuyongren/Desktop/AI dev/backend/n8n';

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const updateNodeJsonBody = (nodeId, newJsonBody) => {
    const node = data.nodes.find(n => n.id === nodeId);
    if (node && node.parameters) {
        node.parameters.jsonBody = newJsonBody;
        return true;
    }
    return false;
};

const newPrompt = `={{ JSON.stringify({ messages: [{ role: 'system', content: \"你是一位【標案撰寫專家 - 內容產製者 (Strategic Proposal Writer)】。\\n\\n你的任務是【完全依據標案文件】，為【\" + $json.moduleName + \"】撰寫細緻且具備專業水準的規劃內容。\\n\\n**核心排他性規則 (Exclusive Implementation)：**\\n1. **邊界檢查 (Boundaries)**：請確認所產出的內容確實屬於當前章節【\" + $json.sectionTitle + \"】的核心任務。如果你發現這項要求在【完整章節清單】中有更專門的章節處理（如：資安、保密、人力），則**絕對禁止**在此寫入，請保持章節純淨。\\n2. **禁止越界描述**：例如在「專案管理」章節中，不要撰寫具體的「資安實作細節\" + \"」或「系統開發技術」。\\n\\n請輸出以下資訊（JSON Format）：\\n1. \`requirement_text\`：詳細的規劃規格與內容。**必須使用 Markdown 條列式格式 (List)**。每一點必須換行。\\n   **重要規則：每一點的結尾，必須具體標註來源 \`(出處: 標題 P.頁碼)\`**。例如：\`- 團隊成員皆具備 PMP 證照 ...(出處: 需求說明書 P.5)\`。\\n2. \`citations\`：Array of Objects (請列出所有引用來源)，每個物件包含：\\n   - \`source_id\`：**重要**：請查看引文所在的區塊標頭 \`SOURCE_ID: ...\`，必須填寫該 UUID。\\n   - \`quote\`：引用到的原文片段（必須與原文完全一致）。\\n   - \`page\`：**重要**：請查看引文所在的區塊標頭 \`PAGE_NUMBER: ...\`，填寫該數字。嚴禁推測頁碼。\\n   - \`title\`：文件標題。\\n\\n規則：\\n1. **聯集策略 (Union Strategy)**：請整合需求書與附錄中的所有論點，不得遺漏任何細部規範。\\n2. **引用準確性**：引文必須真實存在於下方提供的 Content 中，且 Page/Source ID 必須對應標頭。\\n3. 請參考以下原始文件內容（這是你的聖經，最大 25 萬字元）：\\n\" + $('Format Context').first().json.combinedContent }], response_format: { type: 'json_object' } }) }}`;

if (updateNodeJsonBody('llm-generate-detail', newPrompt)) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    console.log('Successfully updated llm-generate-detail in WF13');
} else {
    console.error('Could not find node llm-generate-detail');
}
