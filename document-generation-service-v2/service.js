/**
 * 高保真文件生成服務 (easy-template-x)
 * 
 * 功能:
 * 1. 接收範本檔案 + JSON 數據
 * 2. 使用 easy-template-x 渲染文件
 * 3. 100% 保留原始樣式
 * 4. 支援複雜排版、圖片、多層表格
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { TemplateHandler } = require('easy-template-x');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 設定檔案上傳
const upload = multer({ 
    dest: '/tmp/uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// 確保輸出目錄存在
const OUTPUT_DIR = '/tmp/output';
fs.mkdir(OUTPUT_DIR, { recursive: true }).catch(console.error);

/**
 * 健康檢查
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'document-generation-v2',
        engine: 'easy-template-x',
        version: '2.0.0'
    });
});

/**
 * 生成文件 (從上傳的範本)
 * 
 * POST /generate
 * Body (multipart/form-data):
 *   - template: .docx 檔案
 *   - data: JSON 字串
 */
app.post('/generate', upload.single('template'), async (req, res) => {
    let templatePath = null;
    let outputPath = null;

    try {
        console.log('📄 開始生成文件...');

        // 1. 驗證輸入
        if (!req.file) {
            return res.status(400).json({ error: '缺少範本檔案' });
        }

        if (!req.body.data) {
            return res.status(400).json({ error: '缺少數據' });
        }

        templatePath = req.file.path;
        console.log('📂 範本路徑:', templatePath);

        // 2. 解析 JSON 數據
        let contextData;
        try {
            contextData = JSON.parse(req.body.data);
            console.log('📊 數據欄位:', Object.keys(contextData));
        } catch (error) {
            return res.status(400).json({ error: 'JSON 格式錯誤: ' + error.message });
        }

        // 3. 讀取範本檔案
        const templateBuffer = await fs.readFile(templatePath);
        console.log('✅ 範本載入成功:', templateBuffer.length, 'bytes');

        // 4. 使用 easy-template-x 渲染
        const handler = new TemplateHandler();
        const docBuffer = await handler.process(templateBuffer, contextData);
        console.log('✅ 文件渲染成功:', docBuffer.length, 'bytes');

        // 5. 儲存生成的文件
        const outputFilename = `generated_${Date.now()}.docx`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);
        await fs.writeFile(outputPath, docBuffer);
        console.log('💾 文件已儲存:', outputPath);

        // 6. 返回文件
        res.download(outputPath, outputFilename, async (err) => {
            // 清理暫存檔案
            if (templatePath) await fs.unlink(templatePath).catch(() => {});
            if (outputPath) await fs.unlink(outputPath).catch(() => {});

            if (err) {
                console.error('❌ 下載失敗:', err);
            } else {
                console.log('✅ 文件已下載');
            }
        });

    } catch (error) {
        console.error('❌ 生成失敗:', error);
        
        // 清理暫存檔案
        if (templatePath) await fs.unlink(templatePath).catch(() => {});
        if (outputPath) await fs.unlink(outputPath).catch(() => {});

        res.status(500).json({ 
            error: '文件生成失敗',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * 從 URL 下載範本並生成文件
 * 
 * POST /generate-from-url
 * Body (JSON):
 *   - template_url: 範本檔案的 URL
 *   - data: JSON 數據
 */
app.post('/generate-from-url', async (req, res) => {
    let templatePath = null;
    let outputPath = null;

    try {
        console.log('📄 從 URL 生成文件...');

        const { template_url, data } = req.body;

        // 1. 驗證輸入
        if (!template_url) {
            return res.status(400).json({ error: '缺少 template_url' });
        }

        if (!data) {
            return res.status(400).json({ error: '缺少 data' });
        }

        console.log('🌐 下載範本:', template_url);

        // 2. 下載範本
        const response = await axios.get(template_url, { responseType: 'arraybuffer' });
        const templateBuffer = Buffer.from(response.data);
        console.log('✅ 範本下載成功:', templateBuffer.length, 'bytes');

        // 3. 使用 easy-template-x 渲染
        const handler = new TemplateHandler();
        const docBuffer = await handler.process(templateBuffer, data);
        console.log('✅ 文件渲染成功:', docBuffer.length, 'bytes');

        // 4. 儲存生成的文件
        const outputFilename = `generated_${Date.now()}.docx`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);
        await fs.writeFile(outputPath, docBuffer);
        console.log('💾 文件已儲存:', outputPath);

        // 5. 返回文件
        res.download(outputPath, outputFilename, async (err) => {
            // 清理暫存檔案
            if (outputPath) await fs.unlink(outputPath).catch(() => {});

            if (err) {
                console.error('❌ 下載失敗:', err);
            } else {
                console.log('✅ 文件已下載');
            }
        });

    } catch (error) {
        console.error('❌ 生成失敗:', error);

        // 清理暫存檔案
        if (outputPath) await fs.unlink(outputPath).catch(() => {});

        res.status(500).json({
            error: '文件生成失敗',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== 輔助解析函數 ====================

/**
 * 解析節屬性 (Section Properties)
 * 包含頁面設定、頁首頁尾、欄位等資訊
 */
function parseSectionProperties(sectPr) {
    const section = {
        type: 'nextPage' // 預設
    };

    if (!sectPr) return section;

    // 節類型
    if (sectPr['w:type']) {
        section.type = sectPr['w:type'][0]['$']['w:val']; // continuous, nextPage, evenPage, oddPage
    }

    // 頁面大小
    if (sectPr['w:pgSz']) {
        const pgSz = sectPr['w:pgSz'][0]['$'];
        section.pageSize = {
            width: pgSz['w:w'] ? parseInt(pgSz['w:w']) / 20 : 612, // twips to pt
            height: pgSz['w:h'] ? parseInt(pgSz['w:h']) / 20 : 792,
            orientation: pgSz['w:orient'] || 'portrait'
        };
    }

    // 頁面邊距
    if (sectPr['w:pgMar']) {
        const pgMar = sectPr['w:pgMar'][0]['$'];
        section.margins = {
            top: pgMar['w:top'] ? parseInt(pgMar['w:top']) / 20 : 72,
            bottom: pgMar['w:bottom'] ? parseInt(pgMar['w:bottom']) / 20 : 72,
            left: pgMar['w:left'] ? parseInt(pgMar['w:left']) / 20 : 72,
            right: pgMar['w:right'] ? parseInt(pgMar['w:right']) / 20 : 72,
            header: pgMar['w:header'] ? parseInt(pgMar['w:header']) / 20 : 36,
            footer: pgMar['w:footer'] ? parseInt(pgMar['w:footer']) / 20 : 36,
            gutter: pgMar['w:gutter'] ? parseInt(pgMar['w:gutter']) / 20 : 0
        };
    }

    // 欄位設定
    if (sectPr['w:cols']) {
        const cols = sectPr['w:cols'][0]['$'];
        section.columns = {
            num: cols['w:num'] ? parseInt(cols['w:num']) : 1,
            space: cols['w:space'] ? parseInt(cols['w:space']) / 20 : 36,
            equalWidth: cols['w:equalWidth'] !== 'false'
        };
    }

    // 頁首頁尾參照
    if (sectPr['w:headerReference']) {
        section.headers = sectPr['w:headerReference'].map(ref => ({
            type: ref['$']['w:type'], // default, first, even
            id: ref['$']['r:id']
        }));
    }

    if (sectPr['w:footerReference']) {
        section.footers = sectPr['w:footerReference'].map(ref => ({
            type: ref['$']['w:type'],
            id: ref['$']['r:id']
        }));
    }

    // 行號
    if (sectPr['w:lnNumType']) {
        const lnNum = sectPr['w:lnNumType'][0]['$'];
        section.lineNumbers = {
            countBy: lnNum['w:countBy'] ? parseInt(lnNum['w:countBy']) : 1,
            start: lnNum['w:start'] ? parseInt(lnNum['w:start']) : 1,
            restart: lnNum['w:restart'] || 'newPage'
        };
    }

    // 頁碼類型
    if (sectPr['w:pgNumType']) {
        const pgNum = sectPr['w:pgNumType'][0]['$'];
        section.pageNumbers = {
            format: pgNum['w:fmt'] || 'decimal',
            start: pgNum['w:start'] ? parseInt(pgNum['w:start']) : 1
        };
    }

    return section;
}

/**
 * 解析表格行屬性 (Table Row Properties)
 */
function parseTableRowProperties(trPr) {
    const rowFormat = {};

    if (!trPr) return rowFormat;

    // 表頭行（重複於每頁）
    if (trPr['w:tblHeader']) {
        rowFormat.isHeader = true;
    }

    // 行高
    if (trPr['w:trHeight']) {
        const trHeight = trPr['w:trHeight'][0]['$'];
        rowFormat.height = {
            value: trHeight['w:val'] ? parseInt(trHeight['w:val']) / 20 : null,
            rule: trHeight['w:hRule'] || 'auto' // exact, atLeast, auto
        };
    }

    // 不允許跨頁分割
    if (trPr['w:cantSplit']) {
        rowFormat.cantSplit = true;
    }

    // 垂直對齊
    if (trPr['w:jc']) {
        rowFormat.alignment = trPr['w:jc'][0]['$']['w:val'];
    }

    return rowFormat;
}

// ==================== API 路由 ====================

/**
 * 從 Supabase Storage 解析範本欄位
 *
 * POST /parse-from-supabase
 * Body (JSON):
 *   - file_path: Supabase Storage 中的檔案路徑 (例如: "templates/xxx.docx")
 *   - bucket: Bucket 名稱 (例如: "raw-files")
 *   - template_id: 範本 ID (可選)
 */
app.post('/parse-from-supabase', async (req, res) => {
    try {
        console.log('🔍 從 Supabase 解析範本...');

        const { file_path, bucket = 'raw-files', template_id } = req.body;

        // 1. 驗證輸入
        if (!file_path) {
            return res.status(400).json({ error: '缺少 file_path' });
        }

        // 2. 建構 Supabase Storage URL
        const baseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!baseUrl || !serviceKey) {
            return res.status(500).json({ error: 'Supabase 配置未設定' });
        }

        // 使用 authenticated 路徑
        const templateUrl = `${baseUrl}/storage/v1/object/authenticated/${bucket}/${file_path}`;
        console.log('🌐 下載範本:', templateUrl);

        // 3. 下載範本 (使用 Service Role Key)
        const response = await axios.get(templateUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Authorization': `Bearer ${serviceKey}`
            }
        });
        const templateBuffer = Buffer.from(response.data);
        console.log('✅ 範本下載成功:', templateBuffer.length, 'bytes');

        // 4. 解析文件樣式結構
        const AdmZip = require('adm-zip');
        const xml2js = require('xml2js');

        const zip = new AdmZip(templateBuffer);
        const documentXml = zip.readAsText('word/document.xml');
        const stylesXml = zip.readAsText('word/styles.xml');

        const parser = new xml2js.Parser();
        const docData = await parser.parseStringPromise(documentXml);
        const stylesData = await parser.parseStringPromise(stylesXml);

        // 提取樣式資訊
        const styles = [];
        const paragraphs = [];
        const tables = [];
        const sections = [];      // === 新增：節 ===
        const pageBreaks = [];    // === 新增：換頁 ===
        const documentElements = []; // === 新增：完整文件結構 ===

        // 解析段落樣式
        if (docData['w:document'] && docData['w:document']['w:body']) {
            const body = docData['w:document']['w:body'][0];

            // === 新增：解析完整文件結構（包含段落和表格的順序） ===
            let elementIndex = 0;
            const bodyChildren = [];

            // 遍歷 body 中的所有子元素（保持順序）
            for (const key of Object.keys(body)) {
                if (key === 'w:p') {
                    body[key].forEach((p, idx) => {
                        bodyChildren.push({ type: 'paragraph', element: p, originalIndex: idx });
                    });
                } else if (key === 'w:tbl') {
                    body[key].forEach((tbl, idx) => {
                        bodyChildren.push({ type: 'table', element: tbl, originalIndex: idx });
                    });
                } else if (key === 'w:sectPr') {
                    // 文件級別節屬性
                    bodyChildren.push({ type: 'section', element: body[key][0] });
                }
            }

            // 提取段落 (完整版 - 包含所有格式資訊)
            if (body['w:p']) {
                body['w:p'].forEach((p, idx) => {
                    const pPr = p['w:pPr'] ? p['w:pPr'][0] : {};
                    const pStyle = pPr['w:pStyle'] ? pPr['w:pStyle'][0]['$']['w:val'] : 'Normal';

                    // 段落級別格式
                    const paragraphFormat = {};

                    // 對齊方式
                    if (pPr['w:jc']) {
                        paragraphFormat.alignment = pPr['w:jc'][0]['$']['w:val'];
                    }

                    // 縮排
                    if (pPr['w:ind']) {
                        const ind = pPr['w:ind'][0]['$'];
                        paragraphFormat.indentation = {
                            left: ind['w:left'] ? parseInt(ind['w:left']) / 20 : 0,
                            right: ind['w:right'] ? parseInt(ind['w:right']) / 20 : 0,
                            firstLine: ind['w:firstLine'] ? parseInt(ind['w:firstLine']) / 20 : 0,
                            hanging: ind['w:hanging'] ? parseInt(ind['w:hanging']) / 20 : 0
                        };
                    }

                    // 行距
                    if (pPr['w:spacing']) {
                        const spacing = pPr['w:spacing'][0]['$'];
                        paragraphFormat.spacing = {
                            before: spacing['w:before'] ? parseInt(spacing['w:before']) / 20 : 0,
                            after: spacing['w:after'] ? parseInt(spacing['w:after']) / 20 : 0,
                            line: spacing['w:line'] ? parseInt(spacing['w:line']) / 20 : 0,
                            lineRule: spacing['w:lineRule'] || 'auto'
                        };
                    }

                    // 大綱階層
                    if (pPr['w:outlineLvl']) {
                        paragraphFormat.outlineLevel = parseInt(pPr['w:outlineLvl'][0]['$']['w:val']);
                    }

                    // === 新增：段落邊框 ===
                    if (pPr['w:pBdr']) {
                        const pBdr = pPr['w:pBdr'][0];
                        paragraphFormat.borders = {};
                        ['top', 'bottom', 'left', 'right'].forEach(side => {
                            if (pBdr[`w:${side}`]) {
                                const b = pBdr[`w:${side}`][0]['$'];
                                paragraphFormat.borders[side] = {
                                    style: b['w:val'],
                                    width: b['w:sz'] ? parseInt(b['w:sz']) / 8 : 1,
                                    color: b['w:color'] || 'auto'
                                };
                            }
                        });
                    }

                    // === 新增：段落背景/底紋 ===
                    if (pPr['w:shd']) {
                        const shd = pPr['w:shd'][0]['$'];
                        paragraphFormat.shading = {
                            fill: shd['w:fill'],
                            color: shd['w:color'],
                            pattern: shd['w:val']
                        };
                    }

                    // === 新增：換頁前 ===
                    if (pPr['w:pageBreakBefore']) {
                        paragraphFormat.pageBreakBefore = true;
                        pageBreaks.push({ type: 'before', paragraphIndex: idx });
                    }

                    // === 新增：段落內不分頁 ===
                    if (pPr['w:keepLines']) {
                        paragraphFormat.keepLines = true;
                    }

                    // === 新增：與下段同頁 ===
                    if (pPr['w:keepNext']) {
                        paragraphFormat.keepNext = true;
                    }

                    // === 新增：寡行/孤行控制 ===
                    if (pPr['w:widowControl']) {
                        paragraphFormat.widowControl = true;
                    }

                    // === 新增：節屬性（sectPr 在段落中表示節結束） ===
                    if (pPr['w:sectPr']) {
                        const sectPr = pPr['w:sectPr'][0];
                        const sectionInfo = parseSectionProperties(sectPr);
                        sectionInfo.endParagraphIndex = idx;
                        sections.push(sectionInfo);
                        paragraphFormat.sectionBreak = sectionInfo.type || 'nextPage';
                    }

                    // 提取文字內容和 run 樣式
                    let text = '';
                    const runs = [];

                    if (p['w:r']) {
                        p['w:r'].forEach(r => {
                            const rPr = r['w:rPr'] ? r['w:rPr'][0] : null;
                            const runFormat = {};
                            let runText = '';

                            // Run 級別格式
                            if (rPr) {
                                // 字體
                                if (rPr['w:rFonts']) {
                                    const fonts = rPr['w:rFonts'][0]['$'];
                                    runFormat.font = fonts['w:eastAsia'] || fonts['w:ascii'] || fonts['w:hAnsi'];
                                }

                                // 字體大小
                                if (rPr['w:sz']) {
                                    runFormat.size = parseInt(rPr['w:sz'][0]['$']['w:val']) / 2;
                                }

                                // 顏色
                                if (rPr['w:color']) {
                                    runFormat.color = rPr['w:color'][0]['$']['w:val'];
                                }

                                // 粗體
                                if (rPr['w:b']) {
                                    runFormat.bold = true;
                                }

                                // 斜體
                                if (rPr['w:i']) {
                                    runFormat.italic = true;
                                }

                                // 底線
                                if (rPr['w:u']) {
                                    runFormat.underline = rPr['w:u'][0]['$']['w:val'];
                                }

                                // 刪除線
                                if (rPr['w:strike']) {
                                    runFormat.strike = true;
                                }

                                // 上標/下標
                                if (rPr['w:vertAlign']) {
                                    runFormat.vertAlign = rPr['w:vertAlign'][0]['$']['w:val'];
                                }
                            }

                            // 提取文字
                            if (r['w:t']) {
                                r['w:t'].forEach(t => {
                                    const textContent = typeof t === 'string' ? t : (t['_'] || '');
                                    runText += textContent;
                                    text += textContent;
                                });
                            }

                            // === 新增：換行/換頁符號 ===
                            if (r['w:br']) {
                                r['w:br'].forEach(br => {
                                    const brType = br['$'] ? br['$']['w:type'] : 'textWrapping';
                                    if (brType === 'page') {
                                        runFormat.hasPageBreak = true;
                                        pageBreaks.push({ type: 'inline', paragraphIndex: idx });
                                    } else if (brType === 'column') {
                                        runFormat.hasColumnBreak = true;
                                    } else {
                                        runFormat.hasLineBreak = true;
                                    }
                                    runText += '\n';
                                    text += '\n';
                                });
                            }

                            // === 新增：Tab 符號 ===
                            if (r['w:tab']) {
                                runText += '\t';
                                text += '\t';
                            }

                            // === 新增：圖片參照 ===
                            if (r['w:drawing']) {
                                runFormat.hasImage = true;
                                // 提取圖片 ID（可用於後續獲取圖片）
                                try {
                                    const drawing = r['w:drawing'][0];
                                    if (drawing['wp:inline']) {
                                        const inline = drawing['wp:inline'][0];
                                        runFormat.image = {
                                            type: 'inline',
                                            width: inline['$']['cx'] ? parseInt(inline['$']['cx']) / 914400 : null, // EMU to inches
                                            height: inline['$']['cy'] ? parseInt(inline['$']['cy']) / 914400 : null
                                        };
                                    } else if (drawing['wp:anchor']) {
                                        runFormat.image = { type: 'anchor' };
                                    }
                                } catch (e) { /* 忽略解析錯誤 */ }
                            }

                            if (runText || Object.keys(runFormat).length > 0) {
                                runs.push({
                                    text: runText,
                                    format: runFormat
                                });
                            }
                        });
                    }

                    // === 新增：書籤 ===
                    const bookmarks = [];
                    if (p['w:bookmarkStart']) {
                        p['w:bookmarkStart'].forEach(bm => {
                            bookmarks.push({
                                id: bm['$']['w:id'],
                                name: bm['$']['w:name']
                            });
                        });
                    }

                    // === 新增：超連結 ===
                    const hyperlinks = [];
                    if (p['w:hyperlink']) {
                        p['w:hyperlink'].forEach(hl => {
                            let linkText = '';
                            if (hl['w:r']) {
                                hl['w:r'].forEach(r => {
                                    if (r['w:t']) {
                                        r['w:t'].forEach(t => {
                                            linkText += typeof t === 'string' ? t : (t['_'] || '');
                                        });
                                    }
                                });
                            }
                            hyperlinks.push({
                                id: hl['$'] ? hl['$']['r:id'] : null,
                                anchor: hl['$'] ? hl['$']['w:anchor'] : null,
                                text: linkText
                            });
                        });
                    }

                    // 只要有內容（文字、書籤、超連結等）就記錄
                    if (text.trim() || bookmarks.length > 0 || hyperlinks.length > 0) {
                        const paraData = {
                            index: idx,
                            style: pStyle,
                            text: text.substring(0, 200), // 摘要
                            fullText: text, // 完整文字
                            format: paragraphFormat,
                            runs: runs // 每個 run 的詳細樣式
                        };

                        if (bookmarks.length > 0) paraData.bookmarks = bookmarks;
                        if (hyperlinks.length > 0) paraData.hyperlinks = hyperlinks;

                        paragraphs.push(paraData);
                    }
                });
            }

            // 提取表格 (完整版 - 包含儲存格內容和樣式)
            if (body['w:tbl']) {
                body['w:tbl'].forEach((tbl, tblIdx) => {
                    const rowCount = tbl['w:tr'] ? tbl['w:tr'].length : 0;
                    const colCount = tbl['w:tr'] && tbl['w:tr'][0] && tbl['w:tr'][0]['w:tc']
                        ? tbl['w:tr'][0]['w:tc'].length : 0;

                    // 提取表格樣式
                    const tblPr = tbl['w:tblPr'] ? tbl['w:tblPr'][0] : null;
                    const tableFormat = {};

                    if (tblPr) {
                        // 表格樣式
                        if (tblPr['w:tblStyle']) {
                            tableFormat.style = tblPr['w:tblStyle'][0]['$']['w:val'];
                        }

                        // 表格寬度
                        if (tblPr['w:tblW']) {
                            tableFormat.width = {
                                value: tblPr['w:tblW'][0]['$']['w:w'],
                                type: tblPr['w:tblW'][0]['$']['w:type']
                            };
                        }

                        // 表格對齊
                        if (tblPr['w:jc']) {
                            tableFormat.alignment = tblPr['w:jc'][0]['$']['w:val'];
                        }

                        // === 新增：表格邊框 ===
                        if (tblPr['w:tblBorders']) {
                            const borders = tblPr['w:tblBorders'][0];
                            tableFormat.borders = {};
                            ['top', 'bottom', 'left', 'right', 'insideH', 'insideV'].forEach(side => {
                                if (borders[`w:${side}`]) {
                                    const b = borders[`w:${side}`][0]['$'];
                                    tableFormat.borders[side] = {
                                        style: b['w:val'],
                                        width: b['w:sz'] ? parseInt(b['w:sz']) / 8 : 1,
                                        color: b['w:color'] || 'auto'
                                    };
                                }
                            });
                        }

                        // === 新增：儲存格邊距 ===
                        if (tblPr['w:tblCellMar']) {
                            const cellMar = tblPr['w:tblCellMar'][0];
                            tableFormat.cellMargins = {};
                            ['top', 'bottom', 'left', 'right'].forEach(side => {
                                if (cellMar[`w:${side}`]) {
                                    tableFormat.cellMargins[side] = parseInt(cellMar[`w:${side}`][0]['$']['w:w']) / 20;
                                }
                            });
                        }

                        // === 新增：表格縮排 ===
                        if (tblPr['w:tblInd']) {
                            tableFormat.indent = parseInt(tblPr['w:tblInd'][0]['$']['w:w']) / 20;
                        }

                        // === 新增：表格佈局 ===
                        if (tblPr['w:tblLayout']) {
                            tableFormat.layout = tblPr['w:tblLayout'][0]['$']['w:type']; // fixed, autofit
                        }
                    }

                    // === 新增：欄寬定義 (tblGrid) ===
                    const columnWidths = [];
                    if (tbl['w:tblGrid'] && tbl['w:tblGrid'][0]['w:gridCol']) {
                        tbl['w:tblGrid'][0]['w:gridCol'].forEach(col => {
                            columnWidths.push(parseInt(col['$']['w:w']) / 20); // twips to pt
                        });
                    }

                    // 提取儲存格內容
                    const cells = [];
                    const rowFormats = []; // === 新增：行格式陣列 ===

                    if (tbl['w:tr']) {
                        tbl['w:tr'].forEach((tr, rowIdx) => {
                            // === 新增：解析行屬性 ===
                            const trPr = tr['w:trPr'] ? tr['w:trPr'][0] : null;
                            rowFormats.push(parseTableRowProperties(trPr));

                            if (tr['w:tc']) {
                                tr['w:tc'].forEach((tc, colIdx) => {
                                    const cellText = [];
                                    const cellRuns = [];

                                    // 提取儲存格中的段落
                                    if (tc['w:p']) {
                                        tc['w:p'].forEach(p => {
                                            let pText = '';
                                            const pRuns = [];

                                            if (p['w:r']) {
                                                p['w:r'].forEach(r => {
                                                    const rPr = r['w:rPr'] ? r['w:rPr'][0] : null;
                                                    const runFormat = {};
                                                    let runText = '';

                                                    // Run 格式
                                                    if (rPr) {
                                                        if (rPr['w:rFonts']) {
                                                            const fonts = rPr['w:rFonts'][0]['$'];
                                                            runFormat.font = fonts['w:eastAsia'] || fonts['w:ascii'];
                                                        }
                                                        if (rPr['w:sz']) {
                                                            runFormat.size = parseInt(rPr['w:sz'][0]['$']['w:val']) / 2;
                                                        }
                                                        if (rPr['w:color']) {
                                                            runFormat.color = rPr['w:color'][0]['$']['w:val'];
                                                        }
                                                        if (rPr['w:b']) {
                                                            runFormat.bold = true;
                                                        }
                                                        if (rPr['w:i']) {
                                                            runFormat.italic = true;
                                                        }
                                                    }

                                                    // 提取文字
                                                    if (r['w:t']) {
                                                        r['w:t'].forEach(t => {
                                                            const textContent = typeof t === 'string' ? t : (t['_'] || '');
                                                            runText += textContent;
                                                            pText += textContent;
                                                        });
                                                    }

                                                    if (runText) {
                                                        pRuns.push({
                                                            text: runText,
                                                            format: runFormat
                                                        });
                                                    }
                                                });
                                            }

                                            if (pText.trim()) {
                                                cellText.push(pText);
                                                cellRuns.push(...pRuns);
                                            }
                                        });
                                    }

                                    // 儲存格樣式
                                    const tcPr = tc['w:tcPr'] ? tc['w:tcPr'][0] : null;
                                    const cellFormat = {};

                                    if (tcPr) {
                                        // 儲存格寬度
                                        if (tcPr['w:tcW']) {
                                            cellFormat.width = tcPr['w:tcW'][0]['$']['w:w'];
                                        }

                                        // 垂直對齊
                                        if (tcPr['w:vAlign']) {
                                            cellFormat.vAlign = tcPr['w:vAlign'][0]['$']['w:val'];
                                        }

                                        // 背景顏色
                                        if (tcPr['w:shd']) {
                                            cellFormat.backgroundColor = tcPr['w:shd'][0]['$']['w:fill'];
                                        }

                                        // === 新增：水平合併儲存格 ===
                                        if (tcPr['w:gridSpan']) {
                                            cellFormat.colSpan = parseInt(tcPr['w:gridSpan'][0]['$']['w:val']);
                                        }

                                        // === 新增：垂直合併儲存格 ===
                                        if (tcPr['w:vMerge']) {
                                            const vMergeVal = tcPr['w:vMerge'][0]['$'];
                                            if (vMergeVal && vMergeVal['w:val'] === 'restart') {
                                                cellFormat.vMerge = 'start'; // 垂直合併起始
                                            } else {
                                                cellFormat.vMerge = 'continue'; // 垂直合併延續
                                            }
                                        }

                                        // === 新增：儲存格邊框 ===
                                        if (tcPr['w:tcBorders']) {
                                            const borders = tcPr['w:tcBorders'][0];
                                            cellFormat.borders = {};
                                            ['top', 'bottom', 'left', 'right'].forEach(side => {
                                                if (borders[`w:${side}`]) {
                                                    const b = borders[`w:${side}`][0]['$'];
                                                    cellFormat.borders[side] = {
                                                        style: b['w:val'],
                                                        width: b['w:sz'] ? parseInt(b['w:sz']) / 8 : 1, // 轉換為點
                                                        color: b['w:color'] || 'auto'
                                                    };
                                                }
                                            });
                                        }
                                    }

                                    // === 新增：段落水平對齊（從儲存格內的段落提取） ===
                                    if (tc['w:p'] && tc['w:p'][0]) {
                                        const firstPara = tc['w:p'][0];
                                        if (firstPara['w:pPr'] && firstPara['w:pPr'][0]) {
                                            const pPr = firstPara['w:pPr'][0];
                                            if (pPr['w:jc']) {
                                                cellFormat.hAlign = pPr['w:jc'][0]['$']['w:val']; // left, center, right, both
                                            }
                                        }
                                    }

                                    cells.push({
                                        row: rowIdx,
                                        col: colIdx,
                                        text: cellText.join('\n'),
                                        runs: cellRuns,
                                        format: cellFormat
                                    });
                                });
                            }
                        });
                    }

                    tables.push({
                        index: tblIdx,
                        rows: rowCount,
                        cols: colCount,
                        columnWidths: columnWidths, // === 新增：欄寬 ===
                        rowFormats: rowFormats,     // === 新增：每行格式 ===
                        format: tableFormat,
                        cells: cells // 包含所有儲存格的內容和樣式
                    });
                });
            }

            // === 新增：解析文件級別節屬性 ===
            if (body['w:sectPr']) {
                const docSectPr = body['w:sectPr'][0];
                const docSection = parseSectionProperties(docSectPr);
                docSection.isDocumentLevel = true;
                sections.push(docSection);
            }
        }

        // 提取樣式定義 (完整版)
        if (stylesData['w:styles'] && stylesData['w:styles']['w:style']) {
            stylesData['w:styles']['w:style'].forEach(style => {
                const styleId = style['$']['w:styleId'];
                const styleName = style['w:name'] ? style['w:name'][0]['$']['w:val'] : styleId;
                const styleType = style['$']['w:type'];
                const basedOn = style['w:basedOn'] ? style['w:basedOn'][0]['$']['w:val'] : null;

                // 提取字體資訊
                const rPr = style['w:rPr'] ? style['w:rPr'][0] : null;
                const pPr = style['w:pPr'] ? style['w:pPr'][0] : null;

                const styleInfo = {
                    id: styleId,
                    name: styleName,
                    type: styleType,
                    basedOn: basedOn,
                    font: {},
                    paragraph: {}
                };

                // 字元樣式 (rPr - run properties)
                if (rPr) {
                    // 字體名稱
                    if (rPr['w:rFonts']) {
                        const fonts = rPr['w:rFonts'][0]['$'];
                        styleInfo.font.ascii = fonts['w:ascii'];
                        styleInfo.font.eastAsia = fonts['w:eastAsia'];
                        styleInfo.font.hAnsi = fonts['w:hAnsi'];
                    }

                    // 字體大小 (半點,需除以2)
                    if (rPr['w:sz']) {
                        styleInfo.font.size = parseInt(rPr['w:sz'][0]['$']['w:val']) / 2;
                    }

                    // 顏色
                    if (rPr['w:color']) {
                        styleInfo.font.color = rPr['w:color'][0]['$']['w:val'];
                    }

                    // 粗體
                    if (rPr['w:b']) {
                        styleInfo.font.bold = true;
                    }

                    // 斜體
                    if (rPr['w:i']) {
                        styleInfo.font.italic = true;
                    }

                    // 底線
                    if (rPr['w:u']) {
                        styleInfo.font.underline = rPr['w:u'][0]['$']['w:val'];
                    }
                }

                // 段落樣式 (pPr - paragraph properties)
                if (pPr) {
                    // 對齊方式
                    if (pPr['w:jc']) {
                        styleInfo.paragraph.alignment = pPr['w:jc'][0]['$']['w:val'];
                    }

                    // 縮排
                    if (pPr['w:ind']) {
                        const ind = pPr['w:ind'][0]['$'];
                        styleInfo.paragraph.indentation = {
                            left: ind['w:left'] ? parseInt(ind['w:left']) / 20 : 0, // 轉換為點
                            right: ind['w:right'] ? parseInt(ind['w:right']) / 20 : 0,
                            firstLine: ind['w:firstLine'] ? parseInt(ind['w:firstLine']) / 20 : 0,
                            hanging: ind['w:hanging'] ? parseInt(ind['w:hanging']) / 20 : 0
                        };
                    }

                    // 行距
                    if (pPr['w:spacing']) {
                        const spacing = pPr['w:spacing'][0]['$'];
                        styleInfo.paragraph.spacing = {
                            before: spacing['w:before'] ? parseInt(spacing['w:before']) / 20 : 0,
                            after: spacing['w:after'] ? parseInt(spacing['w:after']) / 20 : 0,
                            line: spacing['w:line'] ? parseInt(spacing['w:line']) / 20 : 0,
                            lineRule: spacing['w:lineRule'] || 'auto'
                        };
                    }

                    // 大綱階層 (標題階層)
                    if (pPr['w:outlineLvl']) {
                        styleInfo.paragraph.outlineLevel = parseInt(pPr['w:outlineLvl'][0]['$']['w:val']);
                    }
                }

                styles.push(styleInfo);
            });
        }

        console.log('✅ 解析完成:', {
            styles: styles.length,
            paragraphs: paragraphs.length,
            tables: tables.length,
            sections: sections.length,
            pageBreaks: pageBreaks.length
        });

        // 5. 返回結果（完整版）
        res.json({
            success: true,
            template_id,
            structure: {
                styles,           // 樣式定義
                paragraphs,       // 段落（含格式）
                tables,           // 表格（含合併儲存格、對齊等）
                sections,         // === 新增：節（頁面設定、換節） ===
                pageBreaks        // === 新增：換頁位置 ===
            },
            summary: {
                total_styles: styles.length,
                total_paragraphs: paragraphs.length,
                total_tables: tables.length,
                total_sections: sections.length,
                total_page_breaks: pageBreaks.length
            }
        });

    } catch (error) {
        console.error('❌ 解析失敗:', error);
        res.status(500).json({
            error: '範本解析失敗',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * 從 Supabase Storage 下載範本並生成文件
 *
 * POST /generate-from-supabase
 * Body (JSON):
 *   - file_path: Supabase Storage 中的檔案路徑 (例如: "raw-files/xxx.docx")
 *   - data: JSON 數據
 *   - supabase_url: Supabase URL (可選,從環境變數讀取)
 */
app.post('/generate-from-supabase', async (req, res) => {
    let outputPath = null;

    try {
        console.log('📄 從 Supabase 生成文件...');

        const { file_path, data, supabase_url } = req.body;

        // 1. 驗證輸入
        if (!file_path) {
            return res.status(400).json({ error: '缺少 file_path' });
        }

        if (!data) {
            return res.status(400).json({ error: '缺少 data' });
        }

        // 2. 建構 Supabase Storage URL
        const baseUrl = supabase_url || process.env.SUPABASE_URL;
        if (!baseUrl) {
            return res.status(500).json({ error: 'Supabase URL 未設定' });
        }

        const templateUrl = `${baseUrl}/storage/v1/object/public/${file_path}`;
        console.log('🌐 下載範本:', templateUrl);

        // 3. 下載範本
        const response = await axios.get(templateUrl, { responseType: 'arraybuffer' });
        const templateBuffer = Buffer.from(response.data);
        console.log('✅ 範本下載成功:', templateBuffer.length, 'bytes');

        // 4. 使用 easy-template-x 渲染
        const handler = new TemplateHandler();
        const docBuffer = await handler.process(templateBuffer, data);
        console.log('✅ 文件渲染成功:', docBuffer.length, 'bytes');

        // 5. 儲存生成的文件
        const outputFilename = `generated_${Date.now()}.docx`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);
        await fs.writeFile(outputPath, docBuffer);
        console.log('💾 文件已儲存:', outputPath);

        // 6. 返回文件
        res.download(outputPath, outputFilename, async (err) => {
            // 清理暫存檔案
            if (outputPath) await fs.unlink(outputPath).catch(() => {});

            if (err) {
                console.error('❌ 下載失敗:', err);
            } else {
                console.log('✅ 文件已下載');
            }
        });

    } catch (error) {
        console.error('❌ 生成失敗:', error);

        // 清理暫存檔案
        if (outputPath) await fs.unlink(outputPath).catch(() => {});

        res.status(500).json({
            error: '文件生成失敗',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 啟動服務
app.listen(PORT, () => {
    console.log('🚀 Document Generation Service V2 (easy-template-x)');
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log('✅ Ready to generate high-fidelity documents');
});

