"use client";

import React, { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface BaseDialogProps {
  /** Dialog 是否打开 */
  open: boolean;
  /** Dialog 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** Dialog 标题 */
  title: string | ReactNode;
  /** Dialog 描述（可选） */
  description?: string;
  /** Dialog 内容 */
  children: ReactNode;
  /** Dialog 底部操作按钮区域（可选）*/
  footer?: ReactNode;
  /** 确认按钮文案 */
  confirmText?: string;
  /** 取消按钮文案 */
  cancelText?: string;
  /** 确认按钮点击处理 */
  onConfirm?: () => void | Promise<void>;
  /** 取消按钮点击处理 */
  onCancel?: () => void;
  /** 是否显示默认的底部操作按钮 */
  showFooter?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 错误提示 */
  error?: string | null;
  /** 最大宽度 */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** 是否禁用确认按钮 */
  disableConfirm?: boolean;
  /** 是否禁用取消按钮 */
  disableCancel?: boolean;
}

const widthClasses = {
  sm: "w-full sm:max-w-sm",
  md: "w-full sm:max-w-md",
  lg: "w-full sm:max-w-lg",
  xl: "w-full sm:max-w-xl",
  "2xl": "w-full sm:max-w-2xl",
};

/**
 * 通用 Dialog 组件
 * 提供统一的 Dialog 结构、加载状态、错误处理
 *
 * @example
 * <BaseDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Add Task"
 *   description="Create a new task"
 *   onConfirm={handleSubmit}
 *   loading={loading}
 *   error={error}
 * >
 *   <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} />
 * </BaseDialog>
 */
export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showFooter = true,
  loading = false,
  error,
  maxWidth = "md",
  disableConfirm = false,
  disableCancel = false,
}: BaseDialogProps) {
  const handleConfirm = async () => {
    if (onConfirm) {
      try {
        await onConfirm();
      } catch (err) {
        // Error handling is delegated to parent component
        console.error("Dialog confirm error:", err);
      }
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={widthClasses[maxWidth]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* 内容区域 */}
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {children}
        </div>

        {/* 底部操作区 */}
        {showFooter && (
          <DialogFooter className="flex gap-2 justify-end">
            {footer || (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading || disableCancel}
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={loading || disableConfirm}
                  className="gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {confirmText}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * 带表单验证的 Dialog
 * 自动管理表单状态和提交
 */
export function FormDialog<T extends Record<string, any>>({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  children,
  loading = false,
  error,
  submitText = "Submit",
  ...props
}: Omit<BaseDialogProps, "onConfirm"> & {
  onSubmit: (formData: T) => Promise<void> | void;
  children: (formData: T, setFormData: (data: T) => void) => ReactNode;
  submitText?: string;
  initialData?: T;
}) {
  const [formData, setFormData] = React.useState<T>(
    (props as any).initialData || {}
  );

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      setFormData({} as T);
    } catch (err) {
      console.error("Form submission error:", err);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      onConfirm={handleSubmit}
      loading={loading}
      error={error}
      confirmText={submitText}
      {...props}
    >
      {children(formData, setFormData)}
    </BaseDialog>
  );
}
