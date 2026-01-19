
import os

path = '/Users/chiuyongren/Desktop/AI dev/backend/n8n/WF11-Task-Generation-Advanced.json'

with open(path, 'r') as f:
    content = f.read()

# Exact target string matching the file content (3 backslashes before quote)
target = r'architecture_summary\\\": \\\"【前台功能架構】：... (請依據文件內容歸納)\\n【後台管理架構】：... (請依據文件內容歸納)\\\"'

replacement = (
    r'architecture_summary\\\": \\\"請輸出【系統功能架構表】(Markdown Table)。\\n'
    r'格式要求：\\n'
    r'| 分類 (前台/後台) | 一級模組 | 二級功能項目 |\\n'
    r'|---|---|---|\\n'
    r'| 前台功能 | 首頁 | 登入/註冊, 社群分享, 大圖輪播 |\\n'
    r'| 後台管理 | 會員管理 | 帳號管理, 權限設定 |\\n'
    r'...請包含所有歸納出的模組。\\\"'
)

if target not in content:
    print("Error: Target string not found in content.")
    # Debug info
    print(f"Searching for: {target!r}")
    keyword = 'architecture_summary'
    idx = content.find(keyword)
    if idx != -1:
         print(f"Actual content around architecture_summary: {content[idx:idx+100]!r}")
else:
    new_content = content.replace(target, replacement)
    with open(path, 'w') as f:
        f.write(new_content)
    print("Successfully patched WF11.")
