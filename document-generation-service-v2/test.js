/**
 * 測試腳本
 * 
 * 使用方法:
 * node test.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:8005';

// 測試數據
const testData = {
    project_title: "AI 自動化系統建置專案",
    customer_name: "台灣積體電路製造股份有限公司",
    project_id: "PRJ-2025-001",
    date: "2025年12月31日",
    items: [
        {
            name: "需求分析與規劃",
            hours: 40,
            rate: 2000,
            total: 80000
        },
        {
            name: "系統架構設計",
            hours: 80,
            rate: 2000,
            total: 160000
        },
        {
            name: "前端開發",
            hours: 120,
            rate: 1800,
            total: 216000
        },
        {
            name: "後端開發",
            hours: 160,
            rate: 2000,
            total: 320000
        },
        {
            name: "測試與部署",
            hours: 60,
            rate: 1800,
            total: 108000
        }
    ],
    total_hours: 460,
    total_amount: 884000,
    company: {
        name: "創新科技股份有限公司",
        address: "台北市信義區信義路五段7號",
        phone: "02-1234-5678",
        email: "contact@innovation.com.tw"
    }
};

async function testHealth() {
    console.log('\n🔍 測試 1: 健康檢查');
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ 服務正常:', response.data);
        return true;
    } catch (error) {
        console.error('❌ 服務異常:', error.message);
        return false;
    }
}

async function testGenerateFromSupabase() {
    console.log('\n🔍 測試 2: 從 Supabase 生成文件');
    
    try {
        const response = await axios.post(
            `${BASE_URL}/generate-from-supabase`,
            {
                file_path: 'raw-files/test_template.docx',
                data: testData,
                supabase_url: process.env.SUPABASE_URL
            },
            {
                responseType: 'arraybuffer'
            }
        );

        // 儲存文件
        const outputPath = './test_output.docx';
        fs.writeFileSync(outputPath, response.data);
        console.log('✅ 文件已生成:', outputPath);
        return true;
    } catch (error) {
        console.error('❌ 生成失敗:', error.response?.data || error.message);
        return false;
    }
}

async function testGenerateFromUpload() {
    console.log('\n🔍 測試 3: 從上傳檔案生成');
    
    // 檢查測試範本是否存在
    const templatePath = './test_template.docx';
    if (!fs.existsSync(templatePath)) {
        console.log('⚠️  測試範本不存在,跳過此測試');
        console.log('   請建立 test_template.docx 並放在此目錄');
        return false;
    }

    try {
        const form = new FormData();
        form.append('template', fs.createReadStream(templatePath));
        form.append('data', JSON.stringify(testData));

        const response = await axios.post(
            `${BASE_URL}/generate`,
            form,
            {
                headers: form.getHeaders(),
                responseType: 'arraybuffer'
            }
        );

        // 儲存文件
        const outputPath = './test_output_upload.docx';
        fs.writeFileSync(outputPath, response.data);
        console.log('✅ 文件已生成:', outputPath);
        return true;
    } catch (error) {
        console.error('❌ 生成失敗:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 開始測試 Document Generation Service V2\n');
    console.log('測試數據:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n' + '='.repeat(60));

    const results = [];

    // 測試 1: 健康檢查
    results.push(await testHealth());

    // 測試 2: 從 Supabase 生成 (需要環境變數)
    if (process.env.SUPABASE_URL) {
        results.push(await testGenerateFromSupabase());
    } else {
        console.log('\n⚠️  跳過測試 2: SUPABASE_URL 未設定');
    }

    // 測試 3: 從上傳檔案生成
    results.push(await testGenerateFromUpload());

    // 總結
    console.log('\n' + '='.repeat(60));
    console.log('📊 測試總結:');
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`✅ 通過: ${passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 所有測試通過!');
    } else {
        console.log('⚠️  部分測試失敗,請檢查錯誤訊息');
    }
}

// 執行測試
runAllTests().catch(console.error);

