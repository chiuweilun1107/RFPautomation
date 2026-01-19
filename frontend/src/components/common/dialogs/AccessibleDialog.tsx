"use client";

import React, { ReactNode, useRef, useEffect } from "react";
import { BaseDialog, BaseDialogProps } from "./BaseDialog";
import {
  getDialogAriaProps,
  generateId,
  trapFocusInContainer,
  setFocus,
  announceToScreenReader,
} from "@/lib/a11y/aria-helpers";
import { useFocusTrap } from "@/hooks";

interface AccessibleDialogProps extends Omit<BaseDialogProps, "children"> {
  /** Dialog 的唯一 ID */
  dialogId?: string;
  /** 关闭时宣布消息 */
  announceClose?: boolean;
  /** Dialog 内容 */
  children: ReactNode;
}

/**
 * 无障碍 Dialog 组件
 * 支持：
 * - ARIA 标签和角色
 * - 焦点陷阱（Tab 键限制在 Dialog 内）
 * - Escape 关闭
 * - 屏幕阅读器宣布
 * - 自动焦点管理
 *
 * @example
 * <AccessibleDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Add Item"
 *   dialogId="add-item-dialog"
 * >
 *   <Input placeholder="Item name" />
 * </AccessibleDialog>
 */
export function AccessibleDialog({
  open,
  onOpenChange,
  dialogId: customDialogId,
  title,
  announceClose = true,
  children,
  ...props
}: AccessibleDialogProps) {
  const dialogId = customDialogId || generateId("dialog");
  const titleId = generateId("dialog-title");
  const contentRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open);

  // 处理 Escape 键
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (announceClose) {
          announceToScreenReader("Dialog 已关闭", "polite");
        }
        onOpenChange(false);
      }

      // 焦点陷阱
      if (contentRef.current) {
        trapFocusInContainer(event, contentRef.current, () => onOpenChange(false));
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // 宣布 Dialog 打开
      announceToScreenReader(`${title} Dialog 已打开`, "assertive");
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, title, onOpenChange, announceClose]);

  // 打开时焦点移动到第一个可聚焦元素
  useEffect(() => {
    if (open && contentRef.current) {
      const focusableElements = contentRef.current.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );

      if (focusableElements.length > 0) {
        const firstFocusable = focusableElements[0] as HTMLElement;
        // 延迟焦点设置，确保 Dialog 已挂载
        setTimeout(() => setFocus(firstFocusable), 100);
      }
    }
  }, [open]);

  return (
    <div ref={focusTrapRef}>
      <BaseDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        {...props}
      >
        <div
          ref={contentRef}
          role="document"
          aria-labelledby={titleId}
        >
          {children}
        </div>
      </BaseDialog>
    </div>
  );
}

/**
 * 无障碍表单 Dialog
 * 增加表单相关的 ARIA 支持
 */
export function AccessibleFormDialog<T extends Record<string, any>>({
  open,
  onOpenChange,
  dialogId: customDialogId,
  title,
  children,
  ...props
}: Omit<AccessibleDialogProps, "children"> & {
  children: (formData: T, setFormData: (data: T) => void) => ReactNode;
} & {
  initialData?: T;
}) {
  const [formData, setFormData] = React.useState<T>(
    (props as any).initialData || {}
  );
  const dialogId = customDialogId || generateId("form-dialog");

  return (
    <AccessibleDialog
      open={open}
      onOpenChange={onOpenChange}
      dialogId={dialogId}
      title={title}
      {...props}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // 由 BaseDialog 的 onConfirm 处理提交
        }}
        noValidate
      >
        {children(formData, setFormData)}
      </form>
    </AccessibleDialog>
  );
}
