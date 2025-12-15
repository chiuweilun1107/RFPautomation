# Google Gemini API 申請與升級指南 (從零開始)

## 第一階段：取得 API Key (如果您還沒有 Key)
如果您是完全的新手，還沒有拿到那一串像亂碼的 API Key，請先做這個：

1.  前往 **Google AI Studio**：[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2.  登入您的 Google 帳號。
3.  點擊藍色的按鈕 **"Create API key"**。
4.  如果有跳出選單，選擇 **"Create API key in new project" (在新專案建立 Key)**。
    *   這會自動幫您建立一個新專案 (Project)。
5.  **複製那串 Key** (通常以 `AIza` 開頭)，這就是您的鑰匙。

---

## 第二階段：綁定信用卡 (解除限制)
拿到 Key 雖然可以用，但有次數限制 (每分鐘 15 次)。如果您想付費解除限制，請做這個：

1.  前往 **Google Cloud Console Billing**：[https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)
2.  確認左上角有選到您 **剛剛建立 Key 的那個專案** (名字通常叫 `Generative AI` 或 `My Project`)。
3.  點擊 **"Link a billing account"**。
4.  點擊 **"Create billing account"**，然後輸入信用卡資訊。
5.  完成後，您的 Key 就會自動升級成付費版了。
