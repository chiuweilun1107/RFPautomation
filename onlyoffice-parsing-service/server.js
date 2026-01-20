const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8005;

// 配置
const ONLYOFFICE_SERVER = process.env.ONLYOFFICE_SERVER || '5.78.118.41';
const SSH_KEY = process.env.SSH_KEY || '~/.ssh/id_hetzner_migration';
const TEMP_DIR = '/tmp/onlyoffice-parsing';

// Middleware
app.use(cors());
app.use(express.json());

// Multer 配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Supabase 客戶端
let supabase = null;

// 初始化 Supabase（從請求中獲取配置）
function initSupabase(url, key) {
  return createClient(url, key);
}

// ONLYOFFICE Builder 解析器
class ONLYOFFICEParser {
  constructor(serverIP, sshKey) {
    this.serverIP = serverIP;
    this.sshKey = sshKey;
  }

  // 檢查是否為本地服務
  isLocalhost() {
    return this.serverIP === 'localhost' || this.serverIP === '127.0.0.1';
  }

  // 上傳文檔到遠端伺服器
  async uploadToServer(localPath, remotePath) {
    try {
      if (this.isLocalhost()) {
        // 本地模式:直接複製文件
        await execPromise(`cp "${localPath}" "${remotePath}"`);
      } else {
        // 遠端模式:使用 SCP
        await execPromise(`scp -i ${this.sshKey} "${localPath}" root@${this.serverIP}:${remotePath}`);
      }
      return remotePath;
    } catch (error) {
      throw new Error(`上傳文檔失敗: ${error.message}`);
    }
  }

  // 執行 Builder 腳本
  async executeBuilder(scriptContent, scriptName = 'parse.js') {
    const scriptPath = `/tmp/${scriptName}`;

    try {
      if (this.isLocalhost()) {
        // 本地模式:直接寫入文件,複製到容器,然後執行
        await fs.writeFile(scriptPath, scriptContent);

        // 複製腳本到 ONLYOFFICE 容器
        await execPromise(`docker cp ${scriptPath} onlyoffice-documentserver:${scriptPath}`);

        // 在容器內執行
        const { stdout, stderr } = await execPromise(
          `docker exec onlyoffice-documentserver /var/www/onlyoffice/documentserver/server/FileConverter/bin/docbuilder ${scriptPath}`
        );
        if (stderr && !stderr.includes('Generating')) {
          console.error('Builder stderr:', stderr);
        }
        return stdout;
      } else {
        // 遠端模式:使用 SSH
        const command = `
          ssh -i ${this.sshKey} root@${this.serverIP} "
            cat > ${scriptPath} << 'EOFSCRIPT'
${scriptContent}
EOFSCRIPT
            docker exec onlyoffice-documentserver /var/www/onlyoffice/documentserver/server/FileConverter/bin/docbuilder ${scriptPath}
          "
        `;
        const { stdout, stderr } = await execPromise(command);
        if (stderr && !stderr.includes('Generating')) {
          console.error('Builder stderr:', stderr);
        }
        return stdout;
      }
    } catch (error) {
      throw new Error(`執行 Builder 失敗: ${error.message}`);
    }
  }

  // 解析範本
  async parseTemplate(localFilePath, supabaseClient) {
    const templateId = uuidv4();
    const remotePath = `/tmp/template_${templateId}.docx`;

    // 1. 上傳到伺服器
    await this.uploadToServer(localFilePath, remotePath);

    // 2. 複製到容器內
    if (this.isLocalhost()) {
      // 本地模式:直接使用 docker cp
      await execPromise(`docker cp ${remotePath} onlyoffice-documentserver:/tmp/template_${templateId}.docx`);
    } else {
      // 遠端模式:通過 SSH 執行 docker cp
      await execPromise(`
        ssh -i ${this.sshKey} root@${this.serverIP} "
          docker cp ${remotePath} onlyoffice-documentserver:/tmp/template_${templateId}.docx
        "
      `);
    }

    // 3. 執行解析腳本
    const parseScript = this.generateParseScript(templateId);
    const result = await this.executeBuilder(parseScript, `parse_${templateId}.js`);

    // 4. 解析結果
    const parsedData = this.parseBuilderOutput(result);

    // 5. 處理圖片上傳到 Supabase
    if (parsedData.images && parsedData.images.length > 0) {
      parsedData.images = await this.uploadImages(
        parsedData.images,
        templateId,
        supabaseClient
      );
    }

    return {
      template_id: templateId,
      template_name: path.basename(localFilePath),
      ...parsedData
    };
  }

  // 生成解析腳本
  generateParseScript(templateId) {
    return `
// 函數定義必須在調用前

// 提取段落
function extractParagraphs(doc) {
  var paragraphs = [];
  var count = doc.GetElementsCount();

  for (var i = 0; i < count; i++) {
    var element = doc.GetElement(i);

    if (element.GetClassType() === "paragraph") {
      var para = element;
      var text = para.GetText();

      // 獲取段落格式
      var paraPr = para.GetParaPr();
      var textPr = para.GetTextPr();

      // 嘗試從第一個 Run 獲取更詳細的文字格式
      var runFormat = null;
      try {
        var runsCount = para.GetElementsCount ? para.GetElementsCount() : 0;
        if (runsCount > 0) {
          var firstRun = para.GetElement(0);
          if (firstRun && firstRun.GetClassType && firstRun.GetClassType() === "run") {
            var runTextPr = firstRun.GetTextPr ? firstRun.GetTextPr() : null;
            if (runTextPr) {
              runFormat = {
                font_family: runTextPr.GetFontFamily ? runTextPr.GetFontFamily() : null,
                font_size: runTextPr.GetFontSize ? (runTextPr.GetFontSize() / 2) : null,
                bold: runTextPr.GetBold ? runTextPr.GetBold() : false,
                italic: runTextPr.GetItalic ? runTextPr.GetItalic() : false,
                underline: runTextPr.GetUnderline ? runTextPr.GetUnderline() : false,
                color: runTextPr.GetColor ? runTextPr.GetColor() : null
              };
            }
          }
        }
      } catch (e) {
        // Run API 可能不可用，使用段落級別格式
      }

      // 使用 Run 格式(如果可用)或段落格式
      var finalFormat = runFormat || {
        font_family: textPr ? textPr.GetFontFamily() : null,
        font_size: textPr ? (textPr.GetFontSize() / 2) : 12,
        bold: textPr ? textPr.GetBold() : false,
        italic: textPr ? textPr.GetItalic() : false,
        underline: textPr ? textPr.GetUnderline() : false,
        color: null
      };

      paragraphs.push({
        id: "para_" + i,
        text: text,
        index: i,
        format: {
          alignment: para.GetJc() || "left",
          font_name: finalFormat.font_family,
          font_size: finalFormat.font_size || 12,
          bold: finalFormat.bold,
          italic: finalFormat.italic,
          underline: finalFormat.underline,
          color: finalFormat.color,
          indentation: {
            first_line: paraPr ? (paraPr.GetIndFirstLine() / 20) : 0,
            left: paraPr ? (paraPr.GetIndLeft() / 20) : 0,
            right: paraPr ? (paraPr.GetIndRight() / 20) : 0
          }
        }
      });
    }
  }

  return paragraphs;
}

// 提取章節信息
function extractSections(doc) {
  return [{
    index: 0,
    page_width: 595.3,
    page_height: 841.9,
    orientation: "PORTRAIT",
    margin_top: 72.0,
    margin_bottom: 72.0,
    margin_left: 54.0,
    margin_right: 54.0
  }];
}

// 提取樣式定義
function extractStyles(doc) {
  var styles = {};
  // ONLYOFFICE Builder 的樣式 API 較複雜，暫時返回空對象
  return styles;
}

// 主程序
builder.OpenFile("/tmp/template_${templateId}.docx");
var oDocument = Api.GetDocument();

console.log("=== START_JSON ===");
console.log(JSON.stringify({
  paragraphs: extractParagraphs(oDocument),
  sections: extractSections(oDocument),
  images: [],
  tables: [],
  headers_footers: [],
  styles: extractStyles(oDocument)
}));
console.log("=== END_JSON ===");

builder.CloseFile();
`;
  }

  // 解析 Builder 輸出
  parseBuilderOutput(output) {
    try {
      // 提取 JSON 部分
      const startMarker = '=== START_JSON ===';
      const endMarker = '=== END_JSON ===';

      const startIdx = output.indexOf(startMarker);
      const endIdx = output.indexOf(endMarker);

      if (startIdx === -1 || endIdx === -1) {
        throw new Error('無法找到 JSON 輸出標記');
      }

      const jsonStr = output.substring(startIdx + startMarker.length, endIdx).trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('解析輸出失敗:', output);
      throw new Error(`解析 Builder 輸出失敗: ${error.message}`);
    }
  }

  // 上傳圖片到 Supabase
  async uploadImages(images, templateId, supabaseClient) {
    // TODO: 實現圖片提取和上傳
    return images;
  }
}

// API 端點

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'onlyoffice-parsing-service v1.0',
    onlyoffice_server: ONLYOFFICE_SERVER
  });
});

// 解析範本
app.post('/parse-template', upload.single('file'), async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳文件' });
    }

    tempFilePath = req.file.path;
    const supabaseUrl = req.body.supabase_url;
    const supabaseKey = req.body.supabase_key;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: '缺少 Supabase 配置' });
    }

    // 初始化 Supabase
    supabase = initSupabase(supabaseUrl, supabaseKey);

    // 初始化解析器
    const parser = new ONLYOFFICEParser(ONLYOFFICE_SERVER, SSH_KEY);

    console.log(`開始解析: ${req.file.originalname}`);

    // 解析範本
    const result = await parser.parseTemplate(tempFilePath, supabase);

    console.log(`解析完成: ${result.template_id}`);

    res.json(result);

  } catch (error) {
    console.error('解析錯誤:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // 清理臨時文件
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (err) {
        console.error('清理臨時文件失敗:', err);
      }
    }
  }
});

// 啟動服務
app.listen(PORT, () => {
  console.log(`🚀 ONLYOFFICE 解析服務運行在 http://localhost:${PORT}`);
  console.log(`📡 連接到 ONLYOFFICE Server: ${ONLYOFFICE_SERVER}`);
  console.log(`🔑 使用 SSH Key: ${SSH_KEY}`);
});
