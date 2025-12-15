#!/bin/bash

# Docker MCP Server 快速設定腳本
# 此腳本會幫助你設定 Docker MCP server 到你的 MCP 客戶端

set -e

echo "🐳 Docker MCP Server 設定工具"
echo "================================"
echo ""

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: 未找到 Node.js"
    echo "請先安裝 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 檢查 npm 是否安裝
if ! command -v npm &> /dev/null; then
    echo "❌ 錯誤: 未找到 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"

# 檢查 Docker 是否運行
if ! docker ps &> /dev/null; then
    echo "⚠️  警告: Docker 似乎未運行"
    echo "請確保 Docker Desktop 已啟動"
    read -p "是否繼續? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Docker 正在運行"
fi

echo ""
echo "請選擇你要配置的 MCP 客戶端:"
echo "1) Claude Desktop"
echo "2) VS Code"
echo "3) Cursor"
echo "4) 僅測試 Docker MCP server"
echo "5) 退出"
echo ""

read -p "請輸入選項 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "配置 Claude Desktop..."
        
        # 檢測操作系統
        if [[ "$OSTYPE" == "darwin"* ]]; then
            CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            CONFIG_FILE="$HOME/.config/Claude/claude_desktop_config.json"
        else
            echo "❌ 不支持的操作系統"
            exit 1
        fi
        
        # 創建配置目錄
        mkdir -p "$(dirname "$CONFIG_FILE")"
        
        # 創建或更新配置文件
        if [ -f "$CONFIG_FILE" ]; then
            echo "⚠️  配置文件已存在: $CONFIG_FILE"
            echo "請手動添加以下配置到 mcpServers 部分:"
            echo ""
            echo '"docker": {'
            echo '  "command": "npx",'
            echo '  "args": ["-y", "@modelcontextprotocol/server-docker"]'
            echo '}'
        else
            cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}
EOF
            echo "✅ 配置文件已創建: $CONFIG_FILE"
        fi
        
        echo ""
        echo "📝 下一步:"
        echo "1. 重啟 Claude Desktop"
        echo "2. Docker MCP server 將自動啟動"
        ;;
        
    2)
        echo ""
        echo "配置 VS Code..."
        echo ""
        echo "請在 VS Code 中執行以下步驟:"
        echo "1. 打開設置 (Cmd/Ctrl + ,)"
        echo "2. 搜索 'MCP'"
        echo "3. 點擊 'Edit in settings.json'"
        echo "4. 添加以下配置:"
        echo ""
        echo '{
  "mcp.servers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}'
        ;;
        
    3)
        echo ""
        echo "配置 Cursor..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            CONFIG_FILE="$HOME/Library/Application Support/Cursor/User/globalStorage/mcp.json"
        else
            echo "❌ 目前僅支持 macOS 的自動配置"
            echo "請手動創建配置文件"
            exit 1
        fi
        
        mkdir -p "$(dirname "$CONFIG_FILE")"
        
        if [ -f "$CONFIG_FILE" ]; then
            echo "⚠️  配置文件已存在: $CONFIG_FILE"
            echo "請手動添加 Docker MCP server 配置"
        else
            cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}
EOF
            echo "✅ 配置文件已創建: $CONFIG_FILE"
        fi
        
        echo ""
        echo "📝 下一步: 重啟 Cursor"
        ;;
        
    4)
        echo ""
        echo "測試 Docker MCP server..."
        echo ""
        echo "正在啟動 Docker MCP server..."
        npx -y @modelcontextprotocol/server-docker
        ;;
        
    5)
        echo "退出"
        exit 0
        ;;
        
    *)
        echo "❌ 無效的選項"
        exit 1
        ;;
esac

echo ""
echo "✨ 設定完成!"

