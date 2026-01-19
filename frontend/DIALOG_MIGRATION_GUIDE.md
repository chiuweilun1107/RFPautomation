# Dialog 组件迁移指南 - Phase 3 集成

**状态**: 🚧 正在进行中
**已完成**: 4/18 对话框
**完成度**: 22%

---

## 📋 迁移进度

### ✅ 已完成迁移 (4/18)

| 文件名 | 类型 | 复杂度 | 迁移模式 |
|--------|------|--------|---------|
| `RenameSourceDialog.tsx` | 简单表单 | ⭐ | 直接替换 |
| `AddSectionDialog.tsx` | 简单输入 | ⭐ | 直接替换 |
| `ConflictConfirmationDialog.tsx` | 自定义脚注 | ⭐⭐ | 自定义 footer |
| `AddTaskDialog.tsx` | 复杂内容 | ⭐⭐⭐ | 自定义 footer |

### 🚧 待迁移 (14/18)

#### 简单对话框 (预计 2-3 小时)
- [ ] `AddSourceDialog.tsx` - 多面板来源添加
- [ ] `CreateFolderDialog.tsx` - 文件夹创建（简单）
- [ ] `CreateTemplateFolderDialog.tsx` - 模板文件夹创建（简单）
- [ ] `SaveDialog.tsx` - 保存选择对话框
- [ ] `SaveAsDialog.tsx` - 另存为对话框

#### 中等复杂度 (预计 3-4 小时)
- [ ] `AddSubsectionDialog.tsx` - 添加小节
- [ ] `GenerateSubsectionDialog.tsx` - 生成小节
- [ ] `ContentGenerationDialog.tsx` - 内容生成
- [ ] `ImageGenerationDialog.tsx` - 图片生成（含标签页）
- [ ] `UploadResourcesDialog.tsx` - 资源上传
- [ ] `TemplateUploadDialog.tsx` - 模板上传
- [ ] `SelectTemplateDialog.tsx` - 模板选择

#### 特殊情况 (预计 1-2 小时)
- [ ] `CreateProjectDialog.tsx` - 项目创建
- [ ] `CreateProjectDialogWrapper.tsx` - 项目创建包装

---

## 🔄 迁移模式

### 模式 1: 简单对话框 (推荐大多数)

**特点**:
- 简单的内容区域
- 标准的确认/取消按钮
- 少于 5 个状态变量

**迁移步骤**:

```typescript
// ❌ 之前: 使用原生 Dialog 组件
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export function MyDialog({ open, onOpenChange, /* ... */ }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>标题</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {/* 内容 */}
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleConfirm}>确认</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ✅ 之后: 使用 BaseDialog
import { BaseDialog } from "@/components/common";

export function MyDialog({ open, onOpenChange, /* ... */ }) {
    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title="标题"
            confirmText="确认"
            cancelText="取消"
            onConfirm={handleConfirm}
        >
            {/* 内容 */}
        </BaseDialog>
    );
}
```

**好处**:
- 代码减少 ~40%
- 自动处理加载状态和错误显示
- 一致的样式和行为

---

### 模式 2: 自定义脚注 (3+ 个按钮)

**特点**:
- 需要多个操作按钮
- 自定义按钮样式或布局
- 非标准确认/取消

**迁移步骤**:

```typescript
// ❌ 之前
<DialogFooter>
    <Button variant="outline" onClick={onCancel}>取消</Button>
    <Button variant="outline" onClick={onAppend}>追加</Button>
    <Button variant="destructive" onClick={onReplace}>替换</Button>
</DialogFooter>

// ✅ 之后
<BaseDialog
    showFooter={true}
    footer={
        <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>取消</Button>
            <Button variant="outline" onClick={onAppend}>追加</Button>
            <Button variant="destructive" onClick={onReplace}>替换</Button>
        </div>
    }
>
```

**查看示例**: `ConflictConfirmationDialog.tsx`

---

### 模式 3: 复杂内容 (标签页、多部分)

**特点**:
- 包含标签页或分步流程
- 大量的内容和组件嵌套
- 自定义滚动和布局

**迁移步骤**:

1. 保持内容结构不变
2. 用 `BaseDialog` 包装
3. 使用 `maxWidth="xl"` 或 `2xl`
4. 自定义 `footer` 如需要

**查看示例**: `AddTaskDialog.tsx`

```typescript
<BaseDialog
    open={open}
    onOpenChange={onOpenChange}
    title={title}
    maxWidth="lg"  // 或 xl, 2xl
    showFooter={true}
    footer={/* 自定义脚注 */}
>
    {/* 复杂内容保持原样 */}
</BaseDialog>
```

---

## 📊 BaseDialog API 参考

### 基础属性

```typescript
interface BaseDialogProps {
  // 必需
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;

  // 可选
  description?: string;
  footer?: ReactNode;
  confirmText?: string;  // 默认: "Confirm"
  cancelText?: string;   // 默认: "Cancel"
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showFooter?: boolean;  // 默认: true
  loading?: boolean;
  error?: string | null;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";  // 默认: md
  disableConfirm?: boolean;
  disableCancel?: boolean;
}
```

### 常见用法

**简单对话框**:
```typescript
<BaseDialog
  open={open}
  onOpenChange={setOpen}
  title="Confirm Action"
  onConfirm={handleSubmit}
>
  Are you sure?
</BaseDialog>
```

**带加载状态**:
```typescript
<BaseDialog
  open={open}
  onOpenChange={setOpen}
  title="Processing..."
  loading={isLoading}
  error={errorMsg}
  onConfirm={handleSubmit}
>
  <Input value={value} onChange={e => setValue(e.target.value)} />
</BaseDialog>
```

**自定义脚注**:
```typescript
<BaseDialog
  open={open}
  onOpenChange={setOpen}
  title="Choose Action"
  showFooter={true}
  footer={
    <div className="flex gap-2 justify-between">
      <Button onClick={handleActionA}>Action A</Button>
      <Button onClick={handleActionB}>Action B</Button>
    </div>
  }
>
  Content here
</BaseDialog>
```

---

## 🎯 下一步任务优先级

### 🔴 高优先级 (本周)
1. **AddSourceDialog** - 多面板复杂对话框
2. **GenerateSubsectionDialog** - 来源选择对话框
3. **AddSubsectionDialog** - 简单对话框

### 🟡 中优先级 (下周)
4. **ImageGenerationDialog** - 包含标签页
5. **ContentGenerationDialog** - 来源选择
6. **TemplateUploadDialog** - 文件上传

### 🟢 低优先级 (可选)
7. **SaveDialog** - 简单选择
8. **SaveAsDialog** - 表单对话框
9. **CreateFolderDialog** - 简单创建

---

## ✅ 迁移检查清单

迁移每个对话框时，请检查以下内容:

- [ ] 移除所有 Dialog/DialogContent/DialogHeader/DialogTitle/DialogFooter 导入
- [ ] 添加 `import { BaseDialog } from "@/components/common"`
- [ ] 将对话框 JSX 替换为 `<BaseDialog>`
- [ ] 更新所有属性映射:
  - `open` → `open`
  - `onOpenChange` → `onOpenChange`
  - `title` (从 DialogTitle 提取)
  - `children` (之前的内容)
  - `footer` (如需自定义脚注)
- [ ] 处理 `loading` 和 `error` 状态 (如有)
- [ ] 设置适当的 `maxWidth`
- [ ] 测试对话框打开/关闭
- [ ] 验证所有按钮功能正常
- [ ] 检查 TypeScript 编译无错误

---

## 📝 迁移模板

### 复制此模板开始新的迁移:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BaseDialog } from "@/components/common";

interface MyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // 添加其他属性...
}

export function MyDialog({
    open,
    onOpenChange,
    // 解构其他属性...
}: MyDialogProps) {
    // 状态管理...

    return (
        <BaseDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Dialog Title"
            confirmText="Confirm"
            cancelText="Cancel"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            loading={isLoading}
            error={error}
            maxWidth="md"
        >
            <div className="grid gap-4">
                <Label>Field Name</Label>
                <Input value={value} onChange={e => setValue(e.target.value)} />
            </div>
        </BaseDialog>
    );
}
```

---

## 🚀 性能改进

迁移到 BaseDialog 后的预期改进:

| 指标 | 改进 |
|------|------|
| **代码行数** | ⬇️ 30-40% 每个对话框 |
| **文件体积** | ⬇️ 15-20% 总体 JS |
| **维护成本** | ⬇️ 50% (统一组件) |
| **一致性** | ⬆️ 100% (统一 UI/UX) |
| **加载时间** | ⬇️ 5-10% (代码减少) |

---

## 📚 相关文档

- [BaseDialog 源代码](./src/components/common/dialogs/BaseDialog.tsx)
- [AccessibleDialog (无障碍版本)](./src/components/common/dialogs/AccessibleDialog.tsx)
- [优化完成总结](./OPTIMIZATION_FINAL_SUMMARY.md)

---

## 💡 常见问题

**Q: 如果我的对话框使用自定义样式怎么办?**
A: BaseDialog 支持 `footer` prop 来自定义脚注。对于内容样式，保持原样即可。

**Q: 如何处理表单验证?**
A: 在 `onConfirm` 回调中进行验证，或使用 `disableConfirm` 属性来禁用按钮。

**Q: 迁移后测试什么?**
A: 测试打开/关闭、确认/取消、加载状态、错误显示和所有自定义功能。

**Q: 可以混合使用旧对话框和新对话框吗?**
A: 可以，但建议统一迁移以获得最佳的一致性。

---

**上次更新**: 2026-01-19
**下一步**: 继续迁移剩余 14 个对话框
