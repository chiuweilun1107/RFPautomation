const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8007;
const TEMP_DIR = '/tmp/template-generation';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Multer 配置
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'template-generation-service v1.0',
    engine: 'docxtemplater'
  });
});

// 主要 API：生成文檔
app.post('/generate-document', upload.single('template'), async (req, res) => {
  let templatePath = null;
  let outputPath = null;

  try {
    // 1. 驗證輸入
    if (!req.file) {
      return res.status(400).json({ error: '缺少範本文件' });
    }

    const data = req.body.data ? JSON.parse(req.body.data) : {};

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: '缺少生成數據' });
    }

    templatePath = req.file.path;

    console.log(`📄 開始生成文檔`);
    console.log(`  範本: ${req.file.originalname}`);
    console.log(`  數據鍵: ${Object.keys(data).join(', ')}`);

    // 2. 讀取範本
    const content = await fs.readFile(templatePath, 'binary');
    const zip = new PizZip(content);

    // 3. 創建 docxtemplater 實例
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '', // 處理空值
    });

    // 4. 渲染數據
    doc.render(data);

    // 5. 生成文檔
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    // 6. 保存輸出
    const outputFilename = `generated_${Date.now()}.docx`;
    outputPath = path.join(TEMP_DIR, outputFilename);
    await fs.writeFile(outputPath, buffer);

    console.log(`✅ 文檔生成成功: ${outputFilename}`);

    // 7. 選項：上傳到 Supabase 或返回文件
    if (req.body.supabase_url && req.body.supabase_key) {
      // 上傳到 Supabase Storage
      const supabase = createClient(req.body.supabase_url, req.body.supabase_key);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`generated/${outputFilename}`, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(`generated/${outputFilename}`);

      res.json({
        success: true,
        filename: outputFilename,
        url: publicUrl,
        size: buffer.length,
      });
    } else {
      // 直接返回文件
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.send(buffer);
    }

  } catch (error) {
    console.error('❌ 生成文檔失敗:', error);

    // 解析 docxtemplater 錯誤
    if (error.properties && error.properties.errors) {
      const errorMessages = error.properties.errors.map(e => ({
        message: e.message,
        part: e.part,
        offset: e.offset,
      }));

      return res.status(400).json({
        error: '範本渲染失敗',
        details: errorMessages,
      });
    }

    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

  } finally {
    // 清理臨時文件
    try {
      if (templatePath) await fs.unlink(templatePath);
      if (outputPath && !req.body.supabase_url) {
        setTimeout(() => fs.unlink(outputPath), 60000); // 1分鐘後刪除
      }
    } catch (err) {
      console.error('清理文件失敗:', err);
    }
  }
});

// API：列出可用範本（從 Supabase 獲取）
app.post('/list-templates', async (req, res) => {
  try {
    const { supabase_url, supabase_key } = req.body;

    if (!supabase_url || !supabase_key) {
      return res.status(400).json({ error: '缺少 Supabase 配置' });
    }

    const supabase = createClient(supabase_url, supabase_key);

    const { data, error } = await supabase.storage
      .from('templates')
      .list();

    if (error) throw error;

    res.json({
      templates: data.map(file => ({
        name: file.name,
        size: file.metadata?.size,
        updated: file.updated_at,
      })),
    });

  } catch (error) {
    console.error('❌ 列出範本失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 啟動服務
app.listen(PORT, () => {
  console.log(`🚀 範本生成服務運行在 http://localhost:${PORT}`);
  console.log(`📚 引擎: docxtemplater v3.49`);
  console.log(`📂 臨時目錄: ${TEMP_DIR}`);
});
