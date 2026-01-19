# 可訪問性完全指南 (WCAG 2.1 AA)

## 📋 概覽

本指南幫助開發者實現 WCAG 2.1 AA 標準的可訪問性。當前評分 2/10，目標 8/10。

**快速鏈接**
- 🎯 [實施清單](#實施清單)
- 🔍 [檢查工具](#檢查工具)
- 💡 [代碼示例](#代碼示例)
- 📚 [參考資源](#參考資源)

---

## 🎯 實施清單

### 1️⃣ 語義化 HTML（優先級：高）

```typescript
// ❌ 錯誤
<div onClick={handleClick}>按鈕</div>
<div role="button">標題</div>

// ✅ 正確
<button onClick={handleClick}>按鈕</button>
<h1>標題</h1>
```

**檢查項**：
- [ ] 使用 `<button>` 代替 `<div>` 按鈕
- [ ] 使用正確的標題層級 (`<h1>` → `<h6>`)
- [ ] 使用 `<main>`, `<nav>`, `<aside>` 標籤
- [ ] 表單使用 `<label>` 和 `<input>`

### 2️⃣ ARIA 標籤（優先級：高）

```typescript
// ✅ 對話框
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h1 id="dialog-title">確認刪除</h1>
  <p id="dialog-desc">此操作無法撤銷</p>
</div>

// ✅ 按鈕
<button aria-label="關閉菜單">×</button>
<button aria-pressed={isActive}>切換</button>

// ✅ 列表
<ul role="list">
  {items.map(item => (
    <li key={item.id} role="listitem">{item.name}</li>
  ))}
</ul>

// ✅ 實時區域
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {statusMessage}
</div>
```

**檢查項**：
- [ ] 所有對話框有 `role="dialog"` 和 `aria-modal="true"`
- [ ] 所有按鈕有 `aria-label` 或文字內容
- [ ] 表單 input 有關聯的 `label`
- [ ] 動態內容有 `aria-live="polite"`

### 3️⃣ 鍵盤導航（優先級：高）

```typescript
// ✅ 按鈕鍵盤支持
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  操作
</button>

// ✅ Tab 導航順序
<div tabIndex={-1}> {/* 非互動元素 */}
  <button tabIndex={0}>按鈕 1</button>
  <button tabIndex={0}>按鈕 2</button>
  <input tabIndex={0} type="text" />
  {/* 自動按 DOM 順序聚焦 */}
</div>

// ✅ Escape 鍵關閉
<Dialog onKeyDown={(e) => {
  if (e.key === 'Escape') {
    onClose();
  }
}}>
  {/* 內容 */}
</Dialog>
```

**檢查項**：
- [ ] 所有互動元素可用鍵盤操作
- [ ] 不使用非語義化元素的 `onClick`
- [ ] 模態對話框有焦點陷阱
- [ ] Escape 鍵能關閉對話框
- [ ] Tab 順序邏輯合理

### 4️⃣ 焦點管理（優先級：高）

```typescript
// ✅ Dialog 焦點陷阱
function Dialog({ children, onClose }: DialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 打開時移動焦點到關閉按鈕
    closeButtonRef.current?.focus();

    // 返回時恢復焦點
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === 'Tab') {
          // 焦點陷阱邏輯
          handleTabKey(e);
        }
      }}
    >
      {children}
      <button ref={closeButtonRef} onClick={onClose}>
        關閉
      </button>
    </div>
  );
}

// ✅ 跳過鏈接
<a href="#main-content" className="sr-only">
  跳到主要內容
</a>
```

**檢查項**：
- [ ] 模態對話框中焦點被限制
- [ ] 對話框關閉後焦點恢復
- [ ] 提供 Skip Link
- [ ] 焦點指示器清晰可見

### 5️⃣ 顏色和對比度（優先級：中）

```css
/* ✅ 最小對比度 4.5:1（常規文字）或 3:1（大文字） */
.text-primary {
  color: #000000; /* 對黑色背景 */
  background-color: #ffffff;
  /* 對比度: 21:1 */
}

/* ❌ 不夠 */
.text-muted {
  color: #999999;
  background-color: #ffffff;
  /* 對比度: 4.48:1 - 太接近 */
}

/* ✅ 使用工具檢查 */
/* WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/ */
```

**檢查項**：
- [ ] 所有文字對比度 ≥ 4.5:1
- [ ] 大文字對比度 ≥ 3:1
- [ ] 不依賴顏色傳達信息（使用符號或文字）

### 6️⃣ 圖像和圖標（優先級：中）

```typescript
// ❌ 錯誤
<img src="icon.svg" />
<Image src="chart.png" alt="" />

// ✅ 正確
<img src="logo.svg" alt="公司名稱" />
<Image src="chart.png" alt="2026年銷售趨勢：上升30%" />
<Icon name="close" aria-label="關閉" />

// ✅ 裝飾性圖像
<img src="decoration.svg" alt="" aria-hidden="true" />
```

**檢查項**：
- [ ] 所有 `<img>` 有 `alt` 屬性
- [ ] Alt 文字描述內容，不只是"圖像"
- [ ] 裝飾性圖像有 `alt=""` 和 `aria-hidden="true"`

### 7️⃣ 表單可訪問性（優先級：中）

```typescript
// ✅ 完整的表單
<form>
  <div>
    <label htmlFor="email">電郵地址</label>
    <input
      id="email"
      type="email"
      aria-describedby="email-help"
      required
      aria-required="true"
    />
    <span id="email-help">我們不會分享您的電郵</span>
  </div>

  <div>
    <label>
      <input type="checkbox" />
      同意條款
    </label>
  </div>

  <button type="submit">提交</button>

  {/* 錯誤反饋 */}
  {error && (
    <div role="alert" aria-live="assertive">
      {error}
    </div>
  )}
</form>
```

**檢查項**：
- [ ] 所有 input 有關聯的 `<label>`
- [ ] 使用 `aria-describedby` 連接幫助文字
- [ ] 必填項有 `aria-required="true"`
- [ ] 錯誤有 `role="alert"`

---

## 🔍 檢查工具

### 自動化工具

#### 1. ESLint + jsx-a11y
```bash
npm install --save-dev eslint-plugin-jsx-a11y

# .eslintrc.json
{
  "plugins": ["jsx-a11y"],
  "extends": ["plugin:jsx-a11y/recommended"]
}

# 運行檢查
npm run lint
```

#### 2. axe DevTools
```bash
npm install --save-dev @axe-core/react

# 在應用中啟用
import { axe } from '@axe-core/react';

if (process.env.NODE_ENV === 'development') {
  axe(React, ReactDOM, 1000);
}
```

#### 3. WAVE - Chrome 擴展
- 安裝：https://wave.webaim.org/extension/
- 右鍵點擊頁面 → WAVE

### 手動測試

#### 鍵盤測試
```
1. 移除鼠標/觸摸板
2. 使用 Tab 導航
3. 使用 Enter/Space 激活
4. 測試 Escape、Home、End 等
5. 檢查焦點指示器是否清晰
```

#### 屏幕閱讀器測試
- **Windows**: NVDA (免費)
- **macOS**: VoiceOver (內置)
- **iOS**: VoiceOver (內置)
- **Android**: TalkBack (內置)

---

## 💡 代碼示例

### 示例 1：可訪問的對話框

```typescript
import { useRef, useEffect } from 'react';

interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  children,
}: AccessibleDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 保存當前焦點
    previousFocusRef.current = document.activeElement as HTMLElement;

    // 移動焦點到對話框
    closeButtonRef.current?.focus();

    // 焦點陷阱
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab') {
        // 實現焦點陷阱
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 恢復焦點
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 對話框 */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <h2 id="dialog-title" className="text-xl font-bold mb-4">
            {title}
          </h2>

          {children}

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="關閉對話框"
          >
            關閉
          </button>
        </div>
      </div>
    </>
  );
}
```

### 示例 2：可訪問的表單

```typescript
interface AccessibleFormProps {
  onSubmit: (data: FormData) => void;
}

export function AccessibleForm({ onSubmit }: AccessibleFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 驗證和提交
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* 電郵輸入 */}
      <div className="mb-4">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          電郵地址 <span aria-label="必填">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          aria-required="true"
          aria-describedby={errors.email ? 'email-error' : 'email-help'}
          className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p id="email-help" className="text-xs text-gray-500 mt-1">
          我們不會分享您的電郵
        </p>
        {errors.email && (
          <p
            id="email-error"
            role="alert"
            className="text-sm text-red-600 mt-1"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* 選擇框 */}
      <div className="mb-4">
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700"
        >
          國家
        </label>
        <select
          id="country"
          className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選擇國家</option>
          <option value="tw">台灣</option>
          <option value="cn">中國</option>
        </select>
      </div>

      {/* 複選框 */}
      <div className="mb-4">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span>同意條款和條件</span>
        </label>
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        提交
      </button>
    </form>
  );
}
```

---

## 📚 參考資源

### 官方標準
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [HTML Spec - Accessibility](https://html.spec.whatwg.org/multipage/semantics.html)

### 工具
- [WAVE - Web Accessibility Evaluation Tool](https://wave.webaim.org/)
- [WebAIM - Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lighthouse - Google Chrome](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools - Deque](https://www.deque.com/axe/devtools/)

### 學習資源
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA in HTML](https://www.w3.org/TR/html-aria/)

---

## ✅ 檢查清單

在提交代碼前，檢查以下項目：

- [ ] 所有互動元素可用鍵盤操作
- [ ] 所有圖像有描述性 alt 文字
- [ ] 顏色對比度≥4.5:1
- [ ] 表單有標籤
- [ ] 錯誤消息有 `role="alert"`
- [ ] 運行 ESLint 無 a11y 警告
- [ ] 使用屏幕閱讀器測試過
- [ ] 焦點指示器清晰可見

---

**目標**：WCAG 2.1 AA 級合規性
**當前評分**：2/10 → 目標：8/10
**預計時間**：2-3 天（基礎實施）
