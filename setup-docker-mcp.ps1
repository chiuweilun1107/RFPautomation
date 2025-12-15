# Docker MCP Server 快速設定腳本 (Windows PowerShell)
# 此腳本會幫助你設定 Docker MCP server 到你的 MCP 客戶端

Write-Host "🐳 Docker MCP Server 設定工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js 是否安裝
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 錯誤: 未找到 Node.js" -ForegroundColor Red
    Write-Host "請先安裝 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 檢查 npm 是否安裝
try {
    $npmVersion = npm --version
    Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 錯誤: 未找到 npm" -ForegroundColor Red
    exit 1
}

# 檢查 Docker 是否運行
try {
    docker ps | Out-Null
    Write-Host "✅ Docker 正在運行" -ForegroundColor Green
} catch {
    Write-Host "⚠️  警告: Docker 似乎未運行" -ForegroundColor Yellow
    Write-Host "請確保 Docker Desktop 已啟動" -ForegroundColor Yellow
    $continue = Read-Host "是否繼續? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "請選擇你要配置的 MCP 客戶端:" -ForegroundColor Cyan
Write-Host "1) Claude Desktop"
Write-Host "2) VS Code"
Write-Host "3) Cursor"
Write-Host "4) 僅測試 Docker MCP server"
Write-Host "5) 退出"
Write-Host ""

$choice = Read-Host "請輸入選項 (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "配置 Claude Desktop..." -ForegroundColor Cyan
        
        $configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
        $configDir = Split-Path -Parent $configPath
        
        # 創建配置目錄
        if (-not (Test-Path $configDir)) {
            New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        }
        
        # 創建或更新配置文件
        if (Test-Path $configPath) {
            Write-Host "⚠️  配置文件已存在: $configPath" -ForegroundColor Yellow
            Write-Host "請手動添加以下配置到 mcpServers 部分:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host '"docker": {' -ForegroundColor White
            Write-Host '  "command": "npx",' -ForegroundColor White
            Write-Host '  "args": ["-y", "@modelcontextprotocol/server-docker"]' -ForegroundColor White
            Write-Host '}' -ForegroundColor White
        } else {
            $config = @{
                mcpServers = @{
                    docker = @{
                        command = "npx"
                        args = @("-y", "@modelcontextprotocol/server-docker")
                    }
                }
            }
            $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
            Write-Host "✅ 配置文件已創建: $configPath" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "📝 下一步:" -ForegroundColor Cyan
        Write-Host "1. 重啟 Claude Desktop"
        Write-Host "2. Docker MCP server 將自動啟動"
    }
    
    "2" {
        Write-Host ""
        Write-Host "配置 VS Code..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "請在 VS Code 中執行以下步驟:" -ForegroundColor Yellow
        Write-Host "1. 打開設置 (Ctrl + ,)"
        Write-Host "2. 搜索 'MCP'"
        Write-Host "3. 點擊 'Edit in settings.json'"
        Write-Host "4. 添加以下配置:"
        Write-Host ""
        Write-Host '{' -ForegroundColor White
        Write-Host '  "mcp.servers": {' -ForegroundColor White
        Write-Host '    "docker": {' -ForegroundColor White
        Write-Host '      "command": "npx",' -ForegroundColor White
        Write-Host '      "args": ["-y", "@modelcontextprotocol/server-docker"]' -ForegroundColor White
        Write-Host '    }' -ForegroundColor White
        Write-Host '  }' -ForegroundColor White
        Write-Host '}' -ForegroundColor White
    }
    
    "3" {
        Write-Host ""
        Write-Host "配置 Cursor..." -ForegroundColor Cyan
        
        $configPath = "$env:APPDATA\Cursor\User\globalStorage\mcp.json"
        $configDir = Split-Path -Parent $configPath
        
        # 創建配置目錄
        if (-not (Test-Path $configDir)) {
            New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        }
        
        # 創建或更新配置文件
        if (Test-Path $configPath) {
            Write-Host "⚠️  配置文件已存在: $configPath" -ForegroundColor Yellow
            Write-Host "請手動添加 Docker MCP server 配置" -ForegroundColor Yellow
        } else {
            $config = @{
                mcpServers = @{
                    docker = @{
                        command = "npx"
                        args = @("-y", "@modelcontextprotocol/server-docker")
                    }
                }
            }
            $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
            Write-Host "✅ 配置文件已創建: $configPath" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "📝 下一步: 重啟 Cursor" -ForegroundColor Cyan
    }
    
    "4" {
        Write-Host ""
        Write-Host "測試 Docker MCP server..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "正在啟動 Docker MCP server..." -ForegroundColor Yellow
        npx -y @modelcontextprotocol/server-docker
    }
    
    "5" {
        Write-Host "退出" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host "❌ 無效的選項" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ 設定完成!" -ForegroundColor Green

