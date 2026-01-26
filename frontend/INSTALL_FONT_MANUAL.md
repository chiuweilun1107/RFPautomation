# 手動安裝字體到 ONLYOFFICE

## 步驟

### 1. 準備字體檔

從以下任一來源獲取：

**開源字體（推薦）：**
- TW-Kai（台灣教育部標準楷書）：https://github.com/ButTaiwan/gensen-font/releases
- cwTeX 楷書：https://github.com/l10n-tw/cwtex-q-fonts

**或從 Windows 複製：**
- 位置：`C:\Windows\Fonts\kaiu.ttf`（標楷體）

### 2. 上傳到 Hetzner 伺服器

```bash
scp -i ~/.ssh/id_hetzner_migration <你的字體檔.ttf> root@5.78.118.41:/tmp/
```

### 3. SSH 連接到伺服器

```bash
ssh -i ~/.ssh/id_hetzner_migration root@5.78.118.41
```

### 4. 複製字體到 ONLYOFFICE 容器

```bash
# 假設字體檔名為 kaiu.ttf
docker cp /tmp/kaiu.ttf onlyoffice-documentserver:/usr/share/fonts/truetype/

# 更新字體緩存
docker exec onlyoffice-documentserver fc-cache -f -v

# 重新生成 ONLYOFFICE 字體列表
docker exec onlyoffice-documentserver documentserver-generate-allfonts.sh
```

### 5. 驗證安裝

```bash
docker exec onlyoffice-documentserver fc-list | grep -i kai
```

應該會看到新字體出現在列表中。

### 6. 重新整理編輯器

回到瀏覽器，重新整理 ONLYOFFICE 編輯器，新字體應該出現在字體選單中。

---

## 已安裝的中文字體

目前 ONLYOFFICE 已安裝以下字體：

- **AR PL UKai TW/CN** ← 楷書（類似標楷體）✅
- AR PL UMing ← 明體
- Noto Sans CJK ← 黑體（思源黑體）
- Noto Serif CJK ← 宋體（思源宋體）
- WenQuanYi Micro Hei ← 文泉驛微米黑
